import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Supervisor } from '@/types/supervisor';

export function useSupervisors() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os supervisores
  const fetchSupervisors = async (): Promise<Supervisor[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('supervisores_motoboy')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar supervisores';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar supervisor por ID
  const fetchSupervisorById = async (id: string): Promise<Supervisor | null> => {
    try {
      const { data, error } = await supabase
        .from('supervisores_motoboy')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Erro ao buscar supervisor:', err);
      return null;
    }
  };

  // Buscar supervisor por código
  const fetchSupervisorByCode = async (codigo: string): Promise<Supervisor | null> => {
    try {
      const { data, error } = await supabase
        .from('supervisores_motoboy')
        .select('*')
        .eq('codigo', codigo)
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Erro ao buscar supervisor por código:', err);
      return null;
    }
  };

  // Carregar supervisores na inicialização
  useEffect(() => {
    fetchSupervisors().then(setSupervisors);
  }, []);

  return {
    supervisors,
    loading,
    error,
    fetchSupervisors,
    fetchSupervisorById,
    fetchSupervisorByCode,
    refetch: () => fetchSupervisors().then(setSupervisors)
  };
}
