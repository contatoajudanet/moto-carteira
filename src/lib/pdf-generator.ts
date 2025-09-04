import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface LaudoData {
  nome: string;
  telefone: string;
  placa: string;
  solicitacao: 'Combustivel' | 'Vale Pecas';
  valorCombustivel?: number;
  descricaoPecas?: string;
  dataCriacao: string;
}

export const generateLaudoPDF = (data: LaudoData): jsPDF => {
  const doc = new jsPDF();
  
  // Configurar fonte que suporta caracteres especiais
  doc.setFont('helvetica');
  
  // Adicionar logo (placeholder)
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('MOTOBOY FUEL BUDDY', 105, 20, { align: 'center' });
  
  // Título do laudo
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('LAUDO DE APROVACAO', 105, 35, { align: 'center' });
  
  // Data
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const dataFormatada = new Date(data.dataCriacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`Data: ${dataFormatada}`, 20, 50);
  
  // Tabela com dados
  const tableData = [
    ['Campo', 'Informacao'],
    ['Nome do Motorista', data.nome],
    ['Telefone', data.telefone],
    ['Placa do Veiculo', data.placa],
    ['Tipo de Solicitacao', data.solicitacao],
    ['Data da Solicitacao', dataFormatada],
  ];
  
  if (data.solicitacao === 'Combustivel' && data.valorCombustivel) {
    tableData.push(['Valor do Combustivel', `R$ ${data.valorCombustivel.toFixed(2)}`]);
  }
  
  if (data.solicitacao === 'Vale Pecas' && data.descricaoPecas) {
    tableData.push(['Descricao das Pecas', data.descricaoPecas]);
  }
  
  autoTable(doc, {
    head: [['Campo', 'Informacao']],
    body: tableData.slice(1),
    startY: 60,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 100 }
    }
  });
  
  // Status de aprovação
  doc.setFontSize(14);
  doc.setTextColor(0, 128, 0);
  doc.text('APROVADO', 105, 150, { align: 'center' });
  
  // Observações
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Este laudo autoriza o motoboy a proceder com a solicitacao aprovada.', 20, 170);
  doc.text('Assinatura do Supervisor: _________________', 20, 180);
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
