import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Motoboy, CreateMotoboyData, UpdateMotoboyData } from '@/types/motoboy';

export function useMotoboys() {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os motoboys
  const fetchMotoboys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      setMotoboys(data || []);
    } catch (err) {
      console.error('Erro ao buscar motoboys:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar novo motoboy
  const createMotoboy = useCallback(async (motoboyData: CreateMotoboyData): Promise<Motoboy | null> => {
    try {
      setError(null);

      // Filtrar campos que podem não existir na tabela ainda
      const filteredData = { ...motoboyData };
      
      // Se supervisor_codigo não existe na tabela, remover do insert
      if (filteredData.supervisor_codigo !== undefined) {
        // Tentar fazer o insert e se der erro de coluna não encontrada, tentar sem supervisor_codigo
        try {
          const { data, error } = await supabase
            .from('motoboys')
            .insert([filteredData])
            .select()
            .single();

          if (error) {
            if (error.code === 'PGRST204' && error.message.includes('supervisor_codigo')) {
              // Coluna não existe, tentar sem supervisor_codigo
              console.warn('Coluna supervisor_codigo não existe na tabela, criando motoboy sem supervisor');
              delete filteredData.supervisor_codigo;
              
              const { data: retryData, error: retryError } = await supabase
                .from('motoboys')
                .insert([filteredData])
                .select()
                .single();

              if (retryError) {
                throw retryError;
              }

              // Atualizar lista local
              setMotoboys(prev => [...prev, retryData].sort((a, b) => a.nome.localeCompare(b.nome)));
              return retryData;
            } else {
              throw error;
            }
          }

          // Atualizar lista local
          setMotoboys(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
          return data;
        } catch (insertErr) {
          throw insertErr;
        }
      } else {
        // Se não tem supervisor_codigo, fazer insert normal
        const { data, error } = await supabase
          .from('motoboys')
          .insert([filteredData])
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Atualizar lista local
        setMotoboys(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
        return data;
      }
    } catch (err) {
      console.error('Erro ao criar motoboy:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  }, []);

  // Atualizar motoboy
  const updateMotoboy = useCallback(async (id: string, motoboyData: UpdateMotoboyData): Promise<Motoboy | null> => {
    try {
      setError(null);

      // Filtrar campos que podem não existir na tabela ainda
      const filteredData = { ...motoboyData };
      
      // Se supervisor_codigo não existe na tabela, remover do update
      if (filteredData.supervisor_codigo !== undefined) {
        // Tentar fazer o update e se der erro de coluna não encontrada, tentar sem supervisor_codigo
        try {
          const { data, error } = await supabase
            .from('motoboys')
            .update(filteredData)
            .eq('id', id)
            .select()
            .single();

          if (error) {
            if (error.code === 'PGRST204' && error.message.includes('supervisor_codigo')) {
              // Coluna não existe, tentar sem supervisor_codigo
              console.warn('Coluna supervisor_codigo não existe na tabela, atualizando motoboy sem supervisor');
              delete filteredData.supervisor_codigo;
              
              const { data: retryData, error: retryError } = await supabase
                .from('motoboys')
                .update(filteredData)
                .eq('id', id)
                .select()
                .single();

              if (retryError) {
                throw retryError;
              }

              // Atualizar lista local
              setMotoboys(prev => 
                prev.map(motoboy => 
                  motoboy.id === id ? retryData : motoboy
                ).sort((a, b) => a.nome.localeCompare(b.nome))
              );
              return retryData;
            } else {
              throw error;
            }
          }

          // Atualizar lista local
          setMotoboys(prev => 
            prev.map(motoboy => 
              motoboy.id === id ? data : motoboy
            ).sort((a, b) => a.nome.localeCompare(b.nome))
          );
          return data;
        } catch (updateErr) {
          throw updateErr;
        }
      } else {
        // Se não tem supervisor_codigo, fazer update normal
        const { data, error } = await supabase
          .from('motoboys')
          .update(filteredData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Atualizar lista local
        setMotoboys(prev => 
          prev.map(motoboy => 
            motoboy.id === id ? data : motoboy
          ).sort((a, b) => a.nome.localeCompare(b.nome))
        );
        return data;
      }
    } catch (err) {
      console.error('Erro ao atualizar motoboy:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  }, []);

  // Deletar motoboy
  const deleteMotoboy = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('motoboys')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setMotoboys(prev => prev.filter(motoboy => motoboy.id !== id));
      
      return true;
    } catch (err) {
      console.error('Erro ao deletar motoboy:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, []);

  // Buscar motoboy por telefone
  const getMotoboyByPhone = useCallback(async (fone: string): Promise<Motoboy | null> => {
    try {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .eq('fone', fone)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Erro ao buscar motoboy por telefone:', err);
      return null;
    }
  }, []);

  // Buscar motoboy por matrícula
  const getMotoboyByMatricula = useCallback(async (matricula: string): Promise<Motoboy | null> => {
    try {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .eq('matricula', matricula)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Erro ao buscar motoboy por matrícula:', err);
      return null;
    }
  }, []);

  // Buscar motoboy por placa
  const getMotoboyByPlaca = useCallback(async (placa: string): Promise<Motoboy | null> => {
    try {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .eq('placa', placa)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Erro ao buscar motoboy por placa:', err);
      return null;
    }
  }, []);

  // Buscar motoboys por supervisor
  const getMotoboysBySupervisor = useCallback(async (supervisorCodigo: string): Promise<Motoboy[]> => {
    try {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .eq('supervisor_codigo', supervisorCodigo)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Erro ao buscar motoboys por supervisor:', err);
      return [];
    }
  }, []);

  // Carregar motoboys na inicialização
  useEffect(() => {
    fetchMotoboys();
  }, [fetchMotoboys]);

  return {
    motoboys,
    loading,
    error,
    fetchMotoboys,
    createMotoboy,
    updateMotoboy,
    deleteMotoboy,
    getMotoboyByPhone,
    getMotoboyByMatricula,
    getMotoboyByPlaca,
    getMotoboysBySupervisor
  };
}
