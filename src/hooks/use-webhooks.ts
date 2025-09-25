import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
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
  created_at: string;
}

export function useWebhooks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar webhook por tipo
  const getWebhookByType = useCallback(async (tipo: string): Promise<WebhookConfig | null> => {
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
  }, []);

  // Executar webhook
  const executeWebhook = useCallback(async (
    tipo: string,
    payload: any,
    solicitacaoId?: string
  ): Promise<boolean> => {
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
          const response = await fetch(webhookConfig.url, {
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
  }, [getWebhookByType]);

  // Log de webhook
  const logWebhookCall = useCallback(async (logData: {
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
  }) => {
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
  }, []);

  // Webhook de aprovação/rejeição
  const sendApprovalWebhook = useCallback(async (
    solicitation: any,
    status: 'aprovado' | 'rejeitado',
    motivo?: string
  ) => {
    const payload = {
      mensagem: status === 'aprovado' 
        ? `✅ AUTORIZADO! Olá ${solicitation.nome}, sua solicitação de ${solicitation.solicitacao} no valor de R$ ${solicitation.valor || '0,00'} foi APROVADA pelo supervisor. Você pode retirar o vale ou realizar a compra.`
        : `❌ NEGADO! Olá ${solicitation.nome}, sua solicitação de ${solicitation.solicitacao} foi NEGADA pelo supervisor. Motivo: ${motivo || 'Não informado'}. Entre em contato para mais informações.`,
      nome: solicitation.nome,
      telefone: solicitation.fone,
      aprovacao_sup: status,
      solicitacao: solicitation.solicitacao,
      valor: solicitation.valor,
      motivo: motivo,
      timestamp: new Date().toISOString()
    };

    return await executeWebhook('aprovacao', payload, solicitation.id);
  }, [executeWebhook]);

  // Webhook de imagem de peças
  const sendPecasImageWebhook = useCallback(async (
    solicitation: any,
    imageUrl: string
  ) => {
    const payload = {
      mensagem: `📸 Imagem recebida! Olá ${solicitation.nome}, recebemos a imagem da peça solicitada. Nossa equipe irá analisar e em breve você receberá uma resposta.`,
      nome: solicitation.nome,
      telefone: solicitation.fone,
      solicitacao: solicitation.solicitacao,
      descricao_pecas: solicitation.descricaoPecas,
      imagem_url: imageUrl,
      timestamp: new Date().toISOString()
    };

    return await executeWebhook('pecas_imagem', payload, solicitation.id);
  }, [executeWebhook]);

  // Testar webhook
  const testWebhook = useCallback(async (webhookConfig: WebhookConfig): Promise<boolean> => {
    const testPayload = {
      teste: true,
      timestamp: new Date().toISOString(),
      webhook_nome: webhookConfig.nome,
      webhook_tipo: webhookConfig.tipo,
      mensagem: `Teste do webhook ${webhookConfig.nome}`
    };

    return await executeWebhook(webhookConfig.tipo, testPayload);
  }, [executeWebhook]);

  return {
    loading,
    error,
    getWebhookByType,
    executeWebhook,
    sendApprovalWebhook,
    sendPecasImageWebhook,
    testWebhook,
    logWebhookCall
  };
}
