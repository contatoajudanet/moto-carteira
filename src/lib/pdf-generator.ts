import jsPDF from 'jspdf';

export interface LaudoData {
  nome: string;
  telefone: string;
  placa: string;
  solicitacao: 'Combustivel' | 'Vale Pecas';
  valorCombustivel?: number;
  descricaoPecas?: string;
  dataCriacao: string;
  supervisor?: {
    id: string;
    codigo: string;
    nome: string;
  } | null;
}

export const generateLaudoPDF = (data: LaudoData): jsPDF => {
  const doc = new jsPDF();
  
  // Configurações de fonte
  const titleFontSize = 18;
  const subtitleFontSize = 14;
  const normalFontSize = 12;
  const smallFontSize = 10;
  
  // Cores
  const primaryColor = { r: 0, g: 123, b: 255 }; // Azul
  const darkColor = { r: 51, g: 51, b: 51 }; // Cinza escuro
  const lightGray = { r: 240, g: 240, b: 240 };
  
  let yPosition = 20;
  
  // Cabeçalho
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(titleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZAÇÃO DE COMBUSTÍVEL', 105, 15, { align: 'center' });
  
  doc.setFontSize(smallFontSize);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão de Motoboys', 105, 22, { align: 'center' });
  
  yPosition = 45;
  
  // Título do documento
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(subtitleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDO DE AUTORIZAÇÃO PARA RETIRADA DE COMBUSTÍVEL', 105, yPosition, { align: 'center' });
  
  yPosition += 20;
  
  // Linha separadora
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  
  yPosition += 15;
  
  // Informações do Motoboy
  doc.setFontSize(normalFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO MOTOBOY:', 20, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const motoboyInfo = [
    `Nome: ${data.nome}`,
    `Telefone: ${data.telefone}`,
    `Placa da Moto: ${data.placa}`,
    `Data da Solicitação: ${new Date(data.dataCriacao).toLocaleDateString('pt-BR')}`
  ];
  
  motoboyInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Informações do Supervisor
  if (data.supervisor) {
    doc.setFont('helvetica', 'bold');
    doc.text('SUPERVISOR RESPONSÁVEL:', 20, yPosition);
    
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${data.supervisor.nome}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Código: ${data.supervisor.codigo}`, 25, yPosition);
    yPosition += 10;
  }
  
  // Informações do Combustível
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DO COMBUSTÍVEL:', 20, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  if (data.valorCombustivel) {
    doc.text(`Valor Solicitado: R$ ${data.valorCombustivel.toFixed(2)}`, 25, yPosition);
    yPosition += 7;
  }
  
  doc.text(`Tipo de Solicitação: ${data.solicitacao}`, 25, yPosition);
  yPosition += 7;
  
  yPosition += 15;
  
  // Informações de Autorização
  doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  doc.rect(20, yPosition - 5, 170, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZAÇÃO:', 25, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  if (data.valorCombustivel) {
    doc.text(`Valor Autorizado: R$ ${data.valorCombustivel.toFixed(2)}`, 25, yPosition);
    yPosition += 7;
  }
  
  doc.text(`Data de Autorização: ${new Date().toLocaleDateString('pt-BR')}`, 25, yPosition);
  yPosition += 7;
  
  doc.text(`Status: APROVADO`, 25, yPosition);
  
  yPosition += 20;
  
  // Instruções
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUÇÕES:', 20, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const instrucoes = [
    '1. Este documento autoriza a retirada do combustível solicitado.',
    '2. O valor máximo autorizado é o especificado neste laudo.',
    '3. A retirada deve ser feita em postos credenciados.',
    '4. Apresente este documento no posto para retirada.',
    '5. Guarde o comprovante de abastecimento para controle.'
  ];
  
  instrucoes.forEach(instrucao => {
    doc.text(instrucao, 25, yPosition);
    yPosition += 6;
  });
  
  yPosition += 15;
  
  // Assinaturas
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.line(20, yPosition, 90, yPosition);
  doc.line(120, yPosition, 190, yPosition);
  
  yPosition += 5;
  
  doc.setFontSize(smallFontSize);
  const supervisorName = data.supervisor ? data.supervisor.nome : 'Supervisor';
  doc.text(supervisorName, 55, yPosition, { align: 'center' });
  doc.text('Motoboy', 155, yPosition, { align: 'center' });
  
  // Rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado automaticamente pelo Sistema de Gestão de Motoboys', 105, pageHeight - 10, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 5, { align: 'center' });
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
