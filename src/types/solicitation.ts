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
  data: string; // Campo correto do banco (não dataCriacao)
  created_at?: string;
  updated_at?: string;
  pdfLaudo?: string; // Caminho do PDF no Supabase Storage
}

export type SolicitationStatus = 'todas' | 'pendente' | 'aprovado' | 'rejeitado';