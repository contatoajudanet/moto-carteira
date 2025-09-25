import { supabase } from './supabase';
import { Solicitation } from '@/types/solicitation';

export interface WebhookConfig {
  id: string;
  nome: string;
  tipo: 'aprovacao' | 'pecas_imagem' | 'geral';
  url: string;
  ativo: boolean;
  descricao?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retry_attempts?: number;
}

// Buscar webhook por tipo
export async function getWebhookByType(tipo: string): Promise<WebhookConfig | null> {
  try {
    const { data, error } = await supabase
      .from('webhook_configs_motoboy')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum webhook encontrado
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Erro ao buscar webhook por tipo:', err);
    return null;
  }
}

// Log de webhook
export async function logWebhookCall(logData: {
  webhook_config_id: string;
  solicitacao_id: string;
  tipo: string;
  url: string;
  payload?: any;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  tentativa: number;
  sucesso: boolean;
  tempo_resposta?: number;
}) {
  try {
    const { error } = await supabase
      .from('webhook_logs_motoboy')
      .insert([logData]);

    if (error) {
      console.error('Erro ao salvar log do webhook:', error);
    }
  } catch (err) {
    console.error('Erro ao salvar log do webhook:', err);
  }
}

// Executar webhook
export async function executeWebhook(
  tipo: string,
  payload: any,
  solicitacaoId?: string
): Promise<boolean> {
  try {
    // Buscar configuração do webhook
    const webhookConfig = await getWebhookByType(tipo);
    
    if (!webhookConfig) {
      console.log(`Nenhum webhook ativo encontrado para o tipo: ${tipo}`);
      return false;
    }

    console.log(`🚀 [WEBHOOK] Executando webhook ${webhookConfig.nome}:`, {
      tipo,
      url: webhookConfig.url,
      payload
    });

    const startTime = Date.now();
    let tentativa = 1;
    const maxTentativas = webhookConfig.retry_attempts || 3;

    while (tentativa <= maxTentativas) {
        try {
          // Em desenvolvimento, usar proxy para contornar CORS
          const isDevelopment = import.meta.env.DEV;
          let webhookUrl = webhookConfig.url;
          
          if (isDevelopment && webhookUrl.includes('evo-youtube-n8n.3sbind.easypanel.host')) {
            // Substituir a URL pelo proxy local
            webhookUrl = webhookUrl.replace('https://evo-youtube-n8n.3sbind.easypanel.host', '/api/webhook');
            console.log('🔄 [WEBHOOK] Usando proxy para desenvolvimento:', webhookUrl);
          }

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...webhookConfig.headers
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(webhookConfig.timeout || 30000)
          });

        const endTime = Date.now();
        const tempoResposta = endTime - startTime;

        // Log do resultado
        await logWebhookCall({
          webhook_config_id: webhookConfig.id,
          solicitacao_id: solicitacaoId || '',
          tipo,
          url: webhookConfig.url,
          payload,
          response_status: response.status,
          response_body: await response.text(),
          error_message: response.ok ? null : `HTTP ${response.status}`,
          tentativa,
          sucesso: response.ok,
          tempo_resposta: tempoResposta
        });

        if (response.ok) {
          console.log(`✅ [WEBHOOK] ${webhookConfig.nome} executado com sucesso (${tempoResposta}ms)`);
          return true;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const endTime = Date.now();
        const tempoResposta = endTime - startTime;
        
        console.error(`❌ [WEBHOOK] Tentativa ${tentativa} falhou:`, err);

        // Log do erro
        await logWebhookCall({
          webhook_config_id: webhookConfig.id,
          solicitacao_id: solicitacaoId || '',
          tipo,
          url: webhookConfig.url,
          payload,
          response_status: null,
          response_body: null,
          error_message: err instanceof Error ? err.message : 'Erro desconhecido',
          tentativa,
          sucesso: false,
          tempo_resposta: tempoResposta
        });

        if (tentativa === maxTentativas) {
          console.error(`❌ [WEBHOOK] ${webhookConfig.nome} falhou após ${maxTentativas} tentativas`);
          return false;
        }

        tentativa++;
        // Aguardar antes da próxima tentativa (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa - 1) * 1000));
      }
    }

    return false;
  } catch (err) {
    console.error('Erro ao executar webhook:', err);
    return false;
  }
}

// Webhook de aprovação/rejeição
export async function sendApprovalWebhook(
  solicitation: Solicitation,
  status: 'aprovado' | 'rejeitado',
  motivo?: string
): Promise<boolean> {
  // Obter base64 do PDF se disponível
  let pdfBase64 = null;
  if (solicitation.pdfLaudo) {
    try {
      const { getPDFBase64FromUrl } = await import('./supabase-storage');
      pdfBase64 = await getPDFBase64FromUrl(solicitation.pdfLaudo);
    } catch (error) {
      console.error('Erro ao obter base64 do PDF:', error);
    }
  }

  const payload = {
    mensagem: status === 'aprovado' 
      ? `✅ AUTORIZADO! Olá *${solicitation.nome}*, sua solicitação de ${solicitation.solicitacao} no valor de R$ ${solicitation.valor || '0,00'} foi APROVADA pelo supervisor. Você pode retirar o vale ou realizar a compra.`
      : `❌ NEGADO! Olá *${solicitation.nome}*, sua solicitação de ${solicitation.solicitacao} foi NEGADA pelo supervisor. Motivo: ${motivo || 'Não informado'}. Entre em contato para mais informações.`,
    id: solicitation.id, // ID da solicitação
    nome: solicitation.nome,
    telefone: solicitation.fone,
    aprovacao_sup: status,
    solicitacao: solicitation.solicitacao,
    valor: solicitation.valor,
    motivo: motivo,
    pdf_url: solicitation.pdfLaudo || null, // Incluir URL do PDF se disponível
    pdf_base64: pdfBase64, // Incluir base64 do PDF se disponível
    timestamp: new Date().toISOString()
  };

  return await executeWebhook('aprovacao', payload, solicitation.id);
}

// Webhook de imagem de peças
export async function sendPecasImageWebhook(
  solicitation: Solicitation,
  imageUrl: string
): Promise<boolean> {
  // Obter base64 do PDF se disponível
  let pdfBase64 = null;
  if (solicitation.pdfLaudo) {
    try {
      const { getPDFBase64FromUrl } = await import('./supabase-storage');
      pdfBase64 = await getPDFBase64FromUrl(solicitation.pdfLaudo);
    } catch (error) {
      console.error('Erro ao obter base64 do PDF:', error);
    }
  }

  const payload = {
    mensagem: `Certo, *${solicitation.nome}*, estamos quase finalizando, agora preciso de uma foto do orçamento realizado na loja, foto nítida e clara da peça solicitada: *${solicitation.descricaoPecas || 'peça'}*.`,
    id: solicitation.id, // ID da solicitação
    nome: solicitation.nome,
    telefone: solicitation.fone,
    solicitacao: solicitation.solicitacao,
    descricao_pecas: solicitation.descricaoPecas,
    imagem_url: imageUrl,
    pdf_url: solicitation.pdfLaudo || null, // Incluir URL do PDF se disponível
    pdf_base64: pdfBase64, // Incluir base64 do PDF se disponível
    timestamp: new Date().toISOString()
  };

  return await executeWebhook('pecas_imagem', payload, solicitation.id);
}

// Webhook para nova solicitação
export async function sendNewSolicitationWebhook(solicitation: Solicitation): Promise<boolean> {
  const payload = {
    mensagem: `🆕 Nova solicitação! *${solicitation.nome}* solicitou ${solicitation.solicitacao} no valor de R$ ${solicitation.valor || '0,00'}. Aguardando aprovação do supervisor.`,
    id: solicitation.id, // ID da solicitação
    nome: solicitation.nome,
    telefone: solicitation.fone,
    solicitacao: solicitation.solicitacao,
    valor: solicitation.valor,
    status: 'pendente',
    timestamp: new Date().toISOString()
  };

  return await executeWebhook('geral', payload, solicitation.id);
}

// Webhook para vale peças
export async function sendValePecasWebhook(
  solicitation: {
    id: string;
    nome: string;
    fone: string;
    matricula: string;
    placa: string;
    solicitacao: string;
    valor?: string;
    valorCombustivel?: number | null;
    descricaoPecas?: string | null;
    valorPeca?: number | null;
    lojaAutorizada?: string | null;
    pdfLaudo?: string | null; // Adicionar campo para PDF
  }
): Promise<boolean> {
  // Obter base64 do PDF se disponível
  let pdfBase64 = null;
  if (solicitation.pdfLaudo) {
    try {
      const { getPDFBase64FromUrl } = await import('./supabase-storage');
      pdfBase64 = await getPDFBase64FromUrl(solicitation.pdfLaudo);
    } catch (error) {
      console.error('Erro ao obter base64 do PDF:', error);
    }
  }

  const payload = {
    mensagem: `Certo, *${solicitation.nome}*, estamos quase finalizando, agora preciso de uma foto do orçamento realizado na loja, foto nítida e clara da peça solicitada: *${solicitation.descricaoPecas || 'peça'}*.`,
    id: solicitation.id, // ID da solicitação
    nome: solicitation.nome,
    telefone: solicitation.fone,
    aprovacao_sup: 'pendente',
    solicitacao: solicitation.solicitacao,
    valor_peca: solicitation.valorPeca,
    loja_autorizada: solicitation.lojaAutorizada,
    descricao_pecas: solicitation.descricaoPecas,
    pdf_url: solicitation.pdfLaudo || null, // Incluir URL do PDF se disponível
    pdf_base64: pdfBase64, // Incluir base64 do PDF se disponível
    timestamp: new Date().toISOString()
  };

  return await executeWebhook('pecas_imagem', payload, solicitation.id);
}

// Testar webhook
export async function testWebhook(webhookConfig: WebhookConfig): Promise<boolean> {
  const testPayload = {
    teste: true,
    timestamp: new Date().toISOString(),
    webhook_nome: webhookConfig.nome,
    webhook_tipo: webhookConfig.tipo,
    mensagem: `Teste do webhook ${webhookConfig.nome}`
  };

  return await executeWebhook(webhookConfig.tipo, testPayload);
}
