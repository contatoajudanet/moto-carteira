export interface Supervisor {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupervisorWithSolicitations extends Supervisor {
  solicitacoes?: number; // Contador de solicitações
}
