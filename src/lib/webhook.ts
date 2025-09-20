import { WEBHOOK_CONFIG } from '@/config/webhook';

// Função para gerar mensagens padronizadas
function generateWebhookMessage(
  nome: string,
  aprovacaoSup: string,
  tipoSolicitacao: string,
  detalhes?: {
    valorPeca?: number;
    lojaAutorizada?: string;
    valorCombustivel?: number;
    motivoRejeicao?: string;
    supervisor?: { nome: string; codigo: string };
  }
): string {
  if (aprovacaoSup === 'aprovado') {
    if (tipoSolicitacao.toLowerCase().includes('peça') || tipoSolicitacao.toLowerCase().includes('pecas')) {
      return `🔧 AUTORIZADO! Olá ${nome}, sua solicitação de peça foi APROVADA pelo supervisor. Você pode retirar a peça na loja ${detalhes?.lojaAutorizada || 'autorizada'} no valor de R$ ${detalhes?.valorPeca?.toFixed(2) || '0,00'}.`;
    } else {
      return `✅ AUTORIZADO: Motoboy ${nome} está autorizado a retirar ${tipoSolicitacao.toLowerCase()}.`;
    }
  } else {
    // Mensagem padronizada para rejeição com motivo
    const motivo = detalhes?.motivoRejeicao || 'Motivo não informado';
    
    // Para combustível, incluir nome e código do supervisor
    if (tipoSolicitacao.toLowerCase().includes('combustível') || tipoSolicitacao.toLowerCase().includes('combustivel')) {
      const supervisorInfo = detalhes?.supervisor 
        ? ` pelo supervisor ${detalhes.supervisor.nome} (Código: ${detalhes.supervisor.codigo})`
        : ' pelo supervisor';
      return `❌ SOLICITAÇÃO NEGADA: Olá ${nome}, sua solicitação de ${tipoSolicitacao.toLowerCase()} foi rejeitada${supervisorInfo}. Motivo: ${motivo}`;
    } else {
      // Para peças, manter mensagem simples
      return `❌ SOLICITAÇÃO NEGADA: Olá ${nome}, sua solicitação de ${tipoSolicitacao.toLowerCase()} foi rejeitada pelo supervisor. Motivo: ${motivo}`;
    }
  }
}

export async function sendWebhookNotification(
  nome: string,
  telefone: string,
  aprovacaoSup: string,
  tipoSolicitacao: string,
  valor?: number,
  pdfUrl?: string, // URL do PDF opcional
  motivoRejeicao?: string, // Motivo da rejeição opcional
  supervisor?: { nome: string; codigo: string } // Dados do supervisor opcional
): Promise<boolean> {
  if (!WEBHOOK_CONFIG.enabled) {
    console.log('📤 Webhook desabilitado');
    return false;
  }

  const mensagem = generateWebhookMessage(nome, aprovacaoSup, tipoSolicitacao, {
    motivoRejeicao,
    supervisor
  });

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

// Função específica para webhook de peças
export async function sendPecasWebhookNotification(
  nome: string,
  telefone: string,
  aprovacaoSup: string,
  descricaoPecas: string,
  valorPeca: number,
  lojaAutorizada: string,
  pdfUrl?: string,
  motivoRejeicao?: string // Motivo da rejeição opcional
): Promise<boolean> {
  if (!WEBHOOK_CONFIG.enabled) {
    console.log('📤 Webhook desabilitado');
    return false;
  }

  const mensagem = generateWebhookMessage(nome, aprovacaoSup, 'Vale Peças', {
    valorPeca,
    lojaAutorizada,
    motivoRejeicao
  });

  const payload = {
    mensagem,
    nome,
    telefone,
    aprovacao_sup: aprovacaoSup,
    tipo_solicitacao: 'Vale Peças',
    descricao_pecas: descricaoPecas,
    valor_peca: valorPeca,
    loja_autorizada: lojaAutorizada,
    timestamp: new Date().toISOString(),
    pdf_url: pdfUrl || null
  };

  try {
    console.log('📤 Enviando webhook de peças para:', WEBHOOK_CONFIG.url);
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
      console.log('✅ Webhook de peças enviado com sucesso:', response.status);
      return true;
    } else {
      console.error('❌ Erro no webhook de peças:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de peças:', error);
    return false;
  }
}

// Função específica para webhook de Vale Peças (solicitação de imagem)
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
    status: string;
    aprovacaoSup: string;
    data: string;
    supervisor_codigo?: string | null;
  }
): Promise<boolean> {
  if (!WEBHOOK_CONFIG.enabled) {
    console.log('📤 Webhook desabilitado');
    return false;
  }

  const mensagem = `Olá ${solicitation.nome}, estamos confirmando seu registro de vale peças, só precisamos que envie uma imagem para armazenar em nosso sistema.`;

  const payload = {
    mensagem,
    evento: 'vale_pecas_solicitacao_imagem',
    tipo_teste: 'webhook_vale_pecas',
    origem: 'sistema_motoboy_fuel_buddy',
    dados: {
      id: solicitation.id,
      nome: solicitation.nome,
      telefone: '554195059996@s.whatsapp.net',
      telefone_original: solicitation.fone,
      matricula: solicitation.matricula,
      placa: solicitation.placa,
      tipo_solicitacao: solicitation.solicitacao,
      valor: solicitation.valor,
      valor_combustivel: solicitation.valorCombustivel,
      descricao_pecas: solicitation.descricaoPecas,
      status: solicitation.status,
      aprovacao_sup: solicitation.aprovacaoSup,
      data_criacao: solicitation.data,
      supervisor_codigo: solicitation.supervisor_codigo,
      timestamp: new Date().toISOString(),
      // Campos específicos para Vale Peças
      solicitacao_imagem: true,
      versao_sistema: '1.0.0',
      ambiente: 'desenvolvimento'
    }
  };

  try {
    console.log('📤 Enviando webhook de Vale Peças para:', WEBHOOK_CONFIG.url);
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
      console.log('✅ Webhook de Vale Peças enviado com sucesso:', response.status);
      return true;
    } else {
      console.error('❌ Erro no webhook de Vale Peças:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de Vale Peças:', error);
    return false;
  }
}

// Função específica para webhook de nova solicitação criada
export async function sendNewSolicitationWebhook(
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
    status: string;
    aprovacaoSup: string;
    data: string;
    supervisor_codigo?: string | null;
  }
): Promise<boolean> {
  if (!WEBHOOK_CONFIG.enabled) {
    console.log('📤 Webhook desabilitado');
    return false;
  }

  const mensagem = `🧪 TESTE WEBHOOK - NOVA SOLICITAÇÃO: Motoboy ${solicitation.nome} (Matrícula: ${solicitation.matricula}) criou uma nova solicitação de ${solicitation.solicitacao.toLowerCase()}. Status: ${solicitation.status}. Valor: R$ ${solicitation.valor || '0,00'}. Placa: ${solicitation.placa}. Telefone: 554195059996@s.whatsapp.net`;

  const payload = {
    mensagem,
    evento: 'nova_solicitacao',
    tipo_teste: 'webhook_automatico',
    origem: 'sistema_motoboy_fuel_buddy',
    dados: {
      id: solicitation.id,
      nome: solicitation.nome,
      telefone: '554195059996@s.whatsapp.net',
      telefone_original: solicitation.fone,
      matricula: solicitation.matricula,
      placa: solicitation.placa,
      tipo_solicitacao: solicitation.solicitacao,
      valor: solicitation.valor,
      valor_combustivel: solicitation.valorCombustivel,
      descricao_pecas: solicitation.descricaoPecas,
      status: solicitation.status,
      aprovacao_sup: solicitation.aprovacaoSup,
      data_criacao: solicitation.data,
      supervisor_codigo: solicitation.supervisor_codigo,
      timestamp: new Date().toISOString(),
      // Campos adicionais para teste
      teste_webhook: true,
      versao_sistema: '1.0.0',
      ambiente: 'desenvolvimento'
    }
  };

  try {
    console.log('📤 Enviando webhook de nova solicitação para:', WEBHOOK_CONFIG.url);
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
      console.log('✅ Webhook de nova solicitação enviado com sucesso:', response.status);
      return true;
    } else {
      console.error('❌ Erro no webhook de nova solicitação:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de nova solicitação:', error);
    return false;
  }
}