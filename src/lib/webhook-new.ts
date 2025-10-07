import { supabase } from './supabase';
import { Solicitation } from '@/types/solicitation';

export interface WebhookConfig {
  id: string;
  nome: string;
  tipo: 'aprovacao' | 'geral';
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
    // Ignorar webhooks de peças (removido do sistema) - BLOQUEIO TOTAL
    if (tipo === 'pecas_imagem' || tipo?.toLowerCase().includes('pecas')) {
      console.log('🚫 Busca por webhook de peças BLOQUEADA - funcionalidade removida do sistema. Tipo:', tipo);
      return null;
    }

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
    // Ignorar webhooks de peças (removido do sistema) - BLOQUEIO TOTAL
    if (tipo === 'pecas_imagem' || tipo?.toLowerCase().includes('pecas')) {
      console.log('🚫 Webhook de peças BLOQUEADO - funcionalidade removida do sistema. Tipo:', tipo);
      return false;
    }

    // Buscar configuração do webhook
    let webhookConfig = await getWebhookByType(tipo);
    
    // FALLBACK: Se não encontrar webhook 'aprovacao', usar configuração fixa
    if (!webhookConfig && tipo === 'aprovacao') {
      console.log('⚠️ Webhook aprovacao não encontrado no banco, usando configuração fixa');
      webhookConfig = {
        id: 'fallback-aprovacao',
        nome: 'Webhook Aprovação (Fallback)',
        tipo: 'aprovacao',
        url: 'https://evo-youtube-n8n.3sbind.easypanel.host/webhook/6fb80aa6-6aa4-45f6-90ea-37ae18b8ca1e',
        ativo: true,
        timeout: 30000,
        retry_attempts: 3
      };
    }
    
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

  // Determinar se é uma solicitação de peças
  const isPecas = solicitation.solicitacao?.toLowerCase().includes('peça') || 
                  solicitation.solicitacao?.toLowerCase().includes('pecas') || 
                  solicitation.solicitacao === 'Vale Pecas';
  
  // Usar valor apropriado baseado no tipo de solicitação
  const valorFormatado = isPecas 
    ? (solicitation.valorPeca?.toFixed(2) || '0,00')
    : (solicitation.valorCombustivel?.toFixed(2) || solicitation.valor || '0,00');

  let mensagem = '';
  if (status === 'aprovado') {
    if (isPecas) {
      mensagem = `🔧 AUTORIZADO! Olá *${solicitation.nome}*, sua solicitação de peça foi APROVADA pelo supervisor. Você pode retirar a peça na loja ${solicitation.lojaAutorizada || 'autorizada'} no valor de R$ ${valorFormatado}.`;
    } else {
      mensagem = `✅ AUTORIZADO! Olá *${solicitation.nome}*, sua solicitação de ${solicitation.solicitacao} no valor de R$ ${valorFormatado} foi APROVADA pelo supervisor. Você pode retirar o vale ou realizar a compra.`;
    }
  } else {
    mensagem = `❌ NEGADO! Olá *${solicitation.nome}*, sua solicitação de ${solicitation.solicitacao} foi NEGADA pelo supervisor. Motivo: ${motivo || 'Não informado'}. Entre em contato para mais informações.`;
  }

  const payload = {
    mensagem,
    id: solicitation.id, // ID da solicitação
    nome: solicitation.nome,
    telefone: solicitation.fone,
    aprovacao_sup: status,
    solicitacao: solicitation.solicitacao,
    valor: isPecas ? solicitation.valorPeca : (solicitation.valorCombustivel || solicitation.valor),
    valor_peca: solicitation.valorPeca || null,
    loja_autorizada: solicitation.lojaAutorizada || null,
    descricao_completa_pecas: solicitation.descricaoCompletaPecas || null,
    motivo: motivo,
    pdf_url: solicitation.pdfLaudo || null, // Incluir URL do PDF se disponível
    pdf_base64: pdfBase64, // Incluir base64 do PDF se disponível
    timestamp: new Date().toISOString()
  };

  // FORÇAR tipo 'aprovacao' - NUNCA usar tipos relacionados a peças
  console.log('📤 [WEBHOOK] Enviando webhook de aprovação - Tipo: aprovacao');
  return await executeWebhook('aprovacao', payload, solicitation.id);
}


// Webhook específico para aprovação de PEÇAS - usa mesmo fluxo do combustível
export async function sendPecasApprovalWebhook(
  solicitation: Solicitation,
  status: 'aprovado' | 'rejeitado',
  motivo?: string
): Promise<boolean> {
  // Usar EXATAMENTE o mesmo código do sendApprovalWebhook mas forçando tipo 'aprovacao'
  
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

  // Determinar se é uma solicitação de peças
  const isPecas = solicitation.solicitacao?.toLowerCase().includes('peça') || 
                  solicitation.solicitacao?.toLowerCase().includes('pecas') || 
                  solicitation.solicitacao === 'Vale Pecas';
  
  // Usar valor apropriado baseado no tipo de solicitação
  const valorFormatado = isPecas 
    ? (solicitation.valorPeca?.toFixed(2) || '0,00')
    : (solicitation.valorCombustivel?.toFixed(2) || solicitation.valor || '0,00');

  let mensagem = '';
  if (status === 'aprovado') {
    if (isPecas) {
      mensagem = `🔧 AUTORIZADO! Olá *${solicitation.nome}*, sua solicitação de peça foi APROVADA pelo supervisor. Você pode retirar a peça na loja ${solicitation.lojaAutorizada || 'autorizada'} no valor de R$ ${valorFormatado}.`;
    } else {
      mensagem = `✅ AUTORIZADO! Olá *${solicitation.nome}*, sua solicitação de ${solicitation.solicitacao} no valor de R$ ${valorFormatado} foi APROVADA pelo supervisor. Você pode retirar o vale ou realizar a compra.`;
    }
  } else {
    mensagem = `❌ NEGADO! Olá *${solicitation.nome}*, sua solicitação de ${solicitation.solicitacao} foi NEGADA pelo supervisor. Motivo: ${motivo || 'Não informado'}. Entre em contato para mais informações.`;
  }

  const payload = {
    mensagem,
    id: solicitation.id,
    nome: solicitation.nome,
    telefone: solicitation.fone,
    aprovacao_sup: status,
    solicitacao: solicitation.solicitacao,
    valor: isPecas ? solicitation.valorPeca : (solicitation.valorCombustivel || solicitation.valor),
    valor_peca: solicitation.valorPeca || null,
    loja_autorizada: solicitation.lojaAutorizada || null,
    descricao_completa_pecas: solicitation.descricaoCompletaPecas || null,
    motivo: motivo,
    pdf_url: solicitation.pdfLaudo || null,
    pdf_base64: pdfBase64,
    timestamp: new Date().toISOString()
  };

  // FORÇAR SEMPRE tipo 'aprovacao' - JAMAIS usar qualquer tipo relacionado a peças
  console.log('🔧 [WEBHOOK-PECAS] Enviando webhook de PEÇAS usando tipo: aprovacao');
  return await executeWebhook('aprovacao', payload, solicitation.id);
}

// Webhook específico para solicitar imagem de peças
export async function sendImageRequestWebhook(solicitation: Solicitation): Promise<boolean> {
  const payload = {
    mensagem: `📸 SOLICITAÇÃO DE IMAGEM\n\nOlá *${solicitation.nome}*!\n\nPara finalizar a aprovação da sua solicitação de peças, precisamos da foto da peça.\n\n🔧 *Peça solicitada:* ${solicitation.descricaoPecas || 'Peça para manutenção'}\n🚗 *Placa:* ${solicitation.placa}\n💰 *Valor estimado:* R$ ${solicitation.valor || '0,00'}\n\n📱 *Por favor, envie a foto da peça para prosseguirmos com a aprovação.*\n\n⚠️ *Importante:* A foto é obrigatória para liberação do vale peças.`,
    id: solicitation.id,
    nome: solicitation.nome,
    telefone: solicitation.fone,
    tipo_solicitacao: 'Solicitação de Imagem',
    solicitacao: 'Solicitação de Imagem',
    valor: solicitation.valor,
    placa: solicitation.placa,
    descricao_pecas: solicitation.descricaoPecas,
    tag: 'SOLICITACAO_IMAGEM',
    status: 'aguardando_imagem',
    motivo: 'Imagem obrigatória para aprovação de peças',
    timestamp: new Date().toISOString()
  };

  console.log('📸 [WEBHOOK-IMAGEM] Enviando solicitação de imagem:', payload);
  return await executeWebhook('aprovacao', payload, solicitation.id);
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
