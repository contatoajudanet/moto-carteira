export interface Solicitation {
  id: string;
  data: string;
  fone: string;
  nome: string;
  matricula: string;
  placa: string;
  solicitacao: string;
  valor: number;
  aprovacao: 'pendente' | 'aprovado' | 'rejeitado';
  avisado: boolean;
  aprovacaoSup: boolean;
  createdAt: Date;
}

export type SolicitationStatus = 'todas' | 'pendente' | 'aprovado' | 'rejeitado';