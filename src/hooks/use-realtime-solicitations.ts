import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Solicitation } from '@/types/solicitation';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeSolicitations() {
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toast } = useToast();

  // Função para converter dados do Supabase para o formato da aplicação
  const convertSupabaseData = useCallback(async (data: any[]): Promise<Solicitation[]> => {
    if (!data || data.length === 0) return [];

    // Buscar dados dos supervisores se houver supervisor_codigo
    const supervisorCodigos = [...new Set(data.map(item => item.supervisor_codigo).filter(Boolean))];
    let supervisorsMap: Record<string, any> = {};
    
    if (supervisorCodigos.length > 0) {
      const { data: supervisorsData, error: supervisorsError } = await supabase
        .from('supervisores_motoboy')
        .select('id, codigo, nome')
        .in('codigo', supervisorCodigos);
        
      if (!supervisorsError && supervisorsData) {
        supervisorsMap = supervisorsData.reduce((acc, supervisor) => {
          acc[supervisor.codigo] = supervisor;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    return data.map(item => ({
      id: item.id,
      data: item.data,
      fone: item.fone || '',
      nome: item.nome,
      matricula: item.matricula,
      placa: item.placa,
      solicitacao: item.solicitacao,
      valor: item.valor,
      valorCombustivel: item.valor_combustivel ? parseFloat(item.valor_combustivel) : undefined,
      descricaoPecas: item.descricao_pecas || undefined,
      status: item.status || 'Pendente',
      aprovacao: item.aprovacao,
      avisado: item.avisado,
      aprovacaoSup: item.aprovacao_sup,
      pdfLaudo: item.pdf_laudo || undefined,
      valorPeca: item.valor_peca ? parseFloat(item.valor_peca) : undefined,
      lojaAutorizada: item.loja_autorizada || undefined,
      descricaoCompletaPecas: item.descricao_completa_pecas || undefined,
      supervisor_codigo: item.supervisor_codigo || undefined,
      supervisor: item.supervisor_codigo ? supervisorsMap[item.supervisor_codigo] || undefined : undefined,
      created_at: item.created_at,
    }));
  }, []);

  // Função para buscar todas as solicitações
  const fetchSolicitations = useCallback(async (): Promise<Solicitation[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const convertedData = await convertSupabaseData(data || []);
      setSolicitations(convertedData);
      return convertedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [convertSupabaseData]);

  // Função para buscar solicitações por status
  const fetchSolicitationsByStatus = useCallback(async (status: string): Promise<Solicitation[]> => {
    if (status === 'todas') {
      return fetchSolicitations();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .select('*')
        .eq('aprovacao', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const convertedData = await convertSupabaseData(data || []);
      setSolicitations(convertedData);
      return convertedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchSolicitations, convertSupabaseData]);

  // Função para buscar solicitações por supervisor
  const fetchSolicitationsBySupervisor = useCallback(async (supervisorCodigo: string | null): Promise<Solicitation[]> => {
    if (!supervisorCodigo) {
      return fetchSolicitations();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .select('*')
        .eq('supervisor_codigo', supervisorCodigo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const convertedData = await convertSupabaseData(data || []);
      setSolicitations(convertedData);
      return convertedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchSolicitations, convertSupabaseData]);

  // Função para criar nova solicitação
  const createSolicitation = useCallback(async (solicitation: Omit<Solicitation, 'id' | 'createdAt'>): Promise<Solicitation | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .insert([{
          data: solicitation.data,
          fone: solicitation.fone,
          nome: solicitation.nome,
          matricula: solicitation.matricula,
          placa: solicitation.placa,
          solicitacao: solicitation.solicitacao,
          valor: solicitation.valor,
          valor_combustivel: solicitation.valorCombustivel,
          descricao_pecas: solicitation.descricaoPecas,
          status: solicitation.status,
          aprovacao: solicitation.aprovacao,
          avisado: solicitation.avisado,
          aprovacao_sup: solicitation.aprovacaoSup,
          supervisor_codigo: solicitation.supervisor_codigo,
        }])
        .select()
        .single();

      if (error) throw error;
      
      const convertedData = await convertSupabaseData([data]);
      return convertedData[0] || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar solicitação';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [convertSupabaseData]);

  // Função para atualizar solicitação
  const updateSolicitation = useCallback(async (id: string, updates: Partial<Solicitation>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData: any = {};
      
      if (updates.data !== undefined) updateData.data = updates.data;
      if (updates.fone !== undefined) updateData.fone = updates.fone;
      if (updates.nome !== undefined) updateData.nome = updates.nome;
      if (updates.matricula !== undefined) updateData.matricula = updates.matricula;
      if (updates.placa !== undefined) updateData.placa = updates.placa;
      if (updates.solicitacao !== undefined) updateData.solicitacao = updates.solicitacao;
      if (updates.valor !== undefined) updateData.valor = updates.valor;
      if (updates.valorCombustivel !== undefined) updateData.valor_combustivel = updates.valorCombustivel;
      if (updates.descricaoPecas !== undefined) updateData.descricao_pecas = updates.descricaoPecas;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.aprovacao !== undefined) updateData.aprovacao = updates.aprovacao;
      if (updates.avisado !== undefined) updateData.avisado = updates.avisado;
      if (updates.aprovacaoSup !== undefined) updateData.aprovacao_sup = updates.aprovacaoSup;
      if (updates.pdfLaudo !== undefined) updateData.pdf_laudo = updates.pdfLaudo;
      if (updates.valorPeca !== undefined) updateData.valor_peca = updates.valorPeca;
      if (updates.lojaAutorizada !== undefined) updateData.loja_autorizada = updates.lojaAutorizada;
      if (updates.descricaoCompletaPecas !== undefined) updateData.descricao_completa_pecas = updates.descricaoCompletaPecas;
      if (updates.supervisor_codigo !== undefined) updateData.supervisor_codigo = updates.supervisor_codigo;

      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar solicitação';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para deletar solicitação
  const deleteSolicitation = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Primeiro, buscar a solicitação para obter a URL do PDF
      const { data: solicitation, error: fetchError } = await supabase
        .from('solicitacoes_motoboy')
        .select('pdf_laudo')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar solicitação para deletar:', fetchError);
      }

      // Deletar a solicitação do banco
      const { error } = await supabase
        .from('solicitacoes_motoboy')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Se existe PDF, deletar do storage
      if (solicitation?.pdf_laudo) {
        try {
          const { deletePDFFromStorage } = await import('@/lib/supabase-storage');
          await deletePDFFromStorage(solicitation.pdf_laudo);
        } catch (storageError) {
          console.error('Erro ao deletar PDF do storage:', storageError);
          // Não falha a operação se não conseguir deletar o PDF
        }
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar solicitação';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar realtime subscription
  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      try {
        // Configurar subscription para mudanças na tabela solicitacoes_motoboy
        subscription = supabase
          .channel('solicitacoes_motoboy_changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'solicitacoes_motoboy'
            },
            async (payload) => {
              console.log('🔄 Mudança detectada no Supabase:', payload);
              
              try {
                // Buscar dados atualizados
                const { data, error } = await supabase
                  .from('solicitacoes_motoboy')
                  .select('*')
                  .order('created_at', { ascending: false });

                if (error) {
                  console.error('Erro ao buscar dados atualizados:', error);
                  return;
                }

                const convertedData = await convertSupabaseData(data || []);
                setSolicitations(convertedData);

                // Mostrar notificação baseada no tipo de evento
                if (payload.eventType === 'INSERT') {
                  toast({
                    title: "Nova solicitação recebida! 🚀",
                    description: "Uma nova solicitação foi adicionada ao sistema",
                    duration: 5000,
                  });
                } else if (payload.eventType === 'UPDATE') {
                  toast({
                    title: "Solicitação atualizada",
                    description: "Uma solicitação foi modificada",
                    duration: 3000,
                  });
                } else if (payload.eventType === 'DELETE') {
                  toast({
                    title: "Solicitação removida",
                    description: "Uma solicitação foi excluída",
                    duration: 3000,
                  });
                }
              } catch (error) {
                console.error('Erro ao processar mudança realtime:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Status da subscription:', status);
            setIsRealtimeConnected(status === 'SUBSCRIBED');
          });

        console.log('✅ Subscription realtime configurada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao configurar subscription realtime:', error);
        setError('Erro ao configurar atualizações em tempo real');
      }
    };

    setupRealtimeSubscription();

    // Cleanup da subscription quando o componente for desmontado
    return () => {
      if (subscription) {
        console.log('🔌 Desconectando subscription realtime');
        supabase.removeChannel(subscription);
      }
    };
  }, [convertSupabaseData, toast]);

  return {
    solicitations,
    loading,
    error,
    isRealtimeConnected,
    fetchSolicitations,
    fetchSolicitationsByStatus,
    fetchSolicitationsBySupervisor,
    createSolicitation,
    updateSolicitation,
    deleteSolicitation,
  };
}
