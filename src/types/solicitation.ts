export interface Solicitation {
  id: string;
  data: string;
  fone: string;
  nome: string;
  matricula: string;
  placa: string;
  solicitacao: string;
  valor: number;
  valorCombustivel?: number; // Valor específico para combustível
  descricaoPecas?: string; // Descrição para peças
  status: string; // Campo de texto livre para status
  aprovacao: 'pendente' | 'aprovado' | 'rejeitado';
  avisado: boolean; // Sempre true (fixo)
  aprovacaoSup: 'pendente' | 'aprovado' | 'rejeitado'; // Três estados
  createdAt: Date;
}

export type SolicitationStatus = 'todas' | 'pendente' | 'aprovado' | 'rejeitado';