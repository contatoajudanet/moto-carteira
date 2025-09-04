import { WEBHOOK_CONFIG } from '@/config/webhook';

export async function sendWebhookNotification(
  nome: string,
  telefone: string,
  aprovacaoSup: string,
  tipoSolicitacao: string,
  valor?: number,
  pdfUrl?: string // URL do PDF opcional
): Promise<boolean> {
  if (!WEBHOOK_CONFIG.enabled) {
    console.log('📤 Webhook desabilitado');
    return false;
  }

  const mensagem = aprovacaoSup === 'aprovado' 
    ? `✅ AUTORIZADO: Motoboy ${nome} está autorizado a retirar ${tipoSolicitacao.toLowerCase()}.`
    : `❌ NEGADO: Solicitação de ${nome} para ${tipoSolicitacao.toLowerCase()} foi rejeitada.`;

  const payload = {
    mensagem,
    nome,
    telefone,
    aprovacao_sup: aprovacaoSup,
    tipo_solicitacao: tipoSolicitacao,
    valor: valor || 0,
    timestamp: new Date().toISOString(),
    pdf_url: pdfUrl || null // Incluir URL do PDF se disponível
  };

  try {
    console.log('📤 Enviando webhook para:', WEBHOOK_CONFIG.url);
    console.log('📤 Payload:', payload);

    const response = await fetch(WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_CONFIG.timeout)
    });

    if (response.ok) {
      console.log('✅ Webhook enviado com sucesso:', response.status);
      return true;
    } else {
      console.error('❌ Erro no webhook:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error);
    return false;
  }
}
