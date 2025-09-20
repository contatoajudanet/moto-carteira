export interface Solicitation {
  id: string;
  nome: string;
  fone: string; // Campo correto do banco (não telefone)
  placa: string;
  matricula: string; // Campo que está sendo usado na tabela
  solicitacao: string; // Campo correto do banco
  valor?: string; // Campo correto do banco
  valorCombustivel?: number | null;
  descricaoPecas?: string | null;
  status: string;
  avisado: boolean;
  aprovacao: string; // Campo correto do banco
  aprovacaoSup: 'pendente' | 'aprovado' | 'rejeitado';
  data: string | Date; // Campo correto do banco (não dataCriacao) - pode ser string ou Date
  created_at?: string;
  updated_at?: string;
  pdfLaudo?: string; // Caminho do PDF no Supabase Storage
  // Novos campos para peças
  valorPeca?: number | null; // Valor autorizado da peça
  lojaAutorizada?: string | null; // Loja onde a peça pode ser retirada
  descricaoCompletaPecas?: string | null; // Descrição completa da peça
  // Campo para supervisor
  supervisor_codigo?: string | null; // Código do supervisor responsável (ex: "1234", "12345")
  supervisor?: {
    id: string;
    codigo: string;
    nome: string;
  } | null; // Dados do supervisor (populado via join)
  // Campos para imagem de peças
  url_imagem_pecas?: string | null; // URL da imagem enviada pelo motoboy
  data_recebimento_imagem?: string | null; // Data/hora quando a imagem foi recebida
  status_imagem?: 'pendente' | 'recebida' | 'processada'; // Status da imagem
}

export type SolicitationStatus = 'todas' | 'pendente' | 'aprovado' | 'rejeitado';