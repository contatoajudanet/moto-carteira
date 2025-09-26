export interface Motoboy {
  id: string;
  fone: string;
  nome: string;
  matricula: string;
  placa: string;
  supervisor_codigo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMotoboyData {
  fone: string;
  nome: string;
  matricula: string;
  placa: string;
  supervisor_codigo: string;
  ativo?: boolean;
}

export interface UpdateMotoboyData {
  fone?: string;
  nome?: string;
  matricula?: string;
  placa?: string;
  supervisor_codigo?: string;
  ativo?: boolean;
}
