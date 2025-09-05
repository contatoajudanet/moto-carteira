import jsPDF from 'jspdf';

export interface PecasLaudoData {
  nome: string;
  telefone: string;
  placa: string;
  matricula: string;
  descricaoPecas: string;
  valorPeca: number;
  loja: string;
  dataCriacao: string;
}

export function generatePecasLaudoPDF(data: PecasLaudoData): jsPDF {
  const doc = new jsPDF();
  
  // Configurações de fonte
  const titleFontSize = 18;
  const subtitleFontSize = 14;
  const normalFontSize = 12;
  const smallFontSize = 10;
  
  // Cores
  const primaryColor = [255, 140, 0]; // Laranja
  const darkColor = [51, 51, 51]; // Cinza escuro
  const lightGray = [240, 240, 240];
  
  let yPosition = 20;
  
  // Cabeçalho
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(titleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZAÇÃO DE PEÇAS', 105, 15, { align: 'center' });
  
  doc.setFontSize(smallFontSize);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão de Motoboys', 105, 22, { align: 'center' });
  
  yPosition = 45;
  
  // Título do documento
  doc.setTextColor(...darkColor);
  doc.setFontSize(subtitleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDO DE AUTORIZAÇÃO PARA RETIRADA DE PEÇAS', 105, yPosition, { align: 'center' });
  
  yPosition += 20;
  
  // Linha separadora
  doc.setDrawColor(...primaryColor);
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
    `Matrícula: ${data.matricula}`,
    `Placa da Moto: ${data.placa}`,
    `Data da Solicitação: ${new Date(data.dataCriacao).toLocaleDateString('pt-BR')}`
  ];
  
  motoboyInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Descrição da Peça
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIÇÃO DA PEÇA:', 20, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const descricaoLines = doc.splitTextToSize(data.descricaoPecas, 160);
  descricaoLines.forEach((line: string) => {
    doc.text(line, 25, yPosition);
    yPosition += 6;
  });
  
  yPosition += 15;
  
  // Informações de Autorização
  doc.setFillColor(...lightGray);
  doc.rect(20, yPosition - 5, 170, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZAÇÃO:', 25, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Valor Autorizado: R$ ${data.valorPeca.toFixed(2)}`, 25, yPosition);
  yPosition += 7;
  
  doc.text(`Loja Autorizada: ${data.loja}`, 25, yPosition);
  yPosition += 7;
  
  doc.text(`Data de Autorização: ${new Date().toLocaleDateString('pt-BR')}`, 25, yPosition);
  
  yPosition += 20;
  
  // Instruções
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUÇÕES:', 20, yPosition);
  
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const instrucoes = [
    '1. Este documento autoriza a retirada da peça descrita acima.',
    '2. O valor máximo autorizado é o especificado neste laudo.',
    '3. A retirada deve ser feita na loja indicada.',
    '4. Apresente este documento na loja para retirada.',
    '5. Guarde o comprovante de retirada para controle.'
  ];
  
  instrucoes.forEach(instrucao => {
    doc.text(instrucao, 25, yPosition);
    yPosition += 6;
  });
  
  yPosition += 15;
  
  // Assinaturas
  doc.setDrawColor(...primaryColor);
  doc.line(20, yPosition, 90, yPosition);
  doc.line(120, yPosition, 190, yPosition);
  
  yPosition += 5;
  
  doc.setFontSize(smallFontSize);
  doc.text('Supervisor', 55, yPosition, { align: 'center' });
  doc.text('Motoboy', 155, yPosition, { align: 'center' });
  
  // Rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado automaticamente pelo Sistema de Gestão de Motoboys', 105, pageHeight - 10, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 5, { align: 'center' });
  
  return doc;
}
