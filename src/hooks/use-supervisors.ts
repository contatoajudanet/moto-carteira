import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Supervisor } from '@/types/supervisor';

export function useSupervisors() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os supervisores (incluindo inativos)
  const fetchSupervisors = async (includeInactive: boolean = false): Promise<Supervisor[]> => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('supervisores_motoboy')
        .select('*');
      
      if (!includeInactive) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query.order('nome', { ascending: true });

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

  // Criar novo supervisor
  const createSupervisor = async (supervisorData: Omit<Supervisor, 'id' | 'created_at' | 'updated_at'>): Promise<Supervisor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('supervisores_motoboy')
        .insert(supervisorData)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista local
      if (data) {
        setSupervisors(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar supervisor';
      setError(errorMessage);
      console.error('Erro ao criar supervisor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar supervisor
  const updateSupervisor = async (id: string, updates: Partial<Omit<Supervisor, 'id' | 'created_at' | 'updated_at'>>): Promise<Supervisor | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('supervisores_motoboy')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista local
      if (data) {
        setSupervisors(prev => 
          prev.map(s => s.id === id ? data : s)
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar supervisor';
      setError(errorMessage);
      console.error('Erro ao atualizar supervisor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Deletar supervisor (exclusão lógica - desativar)
  const deleteSupervisor = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('supervisores_motoboy')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Remover da lista local
      setSupervisors(prev => prev.filter(s => s.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar supervisor';
      setError(errorMessage);
      console.error('Erro ao deletar supervisor:', err);
      return false;
    } finally {
      setLoading(false);
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
    createSupervisor,
    updateSupervisor,
    deleteSupervisor,
    refetch: () => fetchSupervisors().then(setSupervisors)
  };
}
