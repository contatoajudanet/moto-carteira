import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Solicitation } from '@/types/solicitation';

export function useSupabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as solicitações
  const fetchSolicitations = async (): Promise<Solicitation[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Converter os dados do Supabase para o formato da aplicação
      return data?.map(item => ({
        id: item.id,
        data: item.data,
        fone: item.fone || '',
        nome: item.nome,
        matricula: item.matricula,
        placa: item.placa,
        solicitacao: item.solicitacao,
        valor: parseFloat(item.valor),
        valorCombustivel: item.valor_combustivel ? parseFloat(item.valor_combustivel) : undefined,
        descricaoPecas: item.descricao_pecas || undefined,
        status: item.status || 'Pendente',
        aprovacao: item.aprovacao,
        avisado: item.avisado,
        aprovacaoSup: item.aprovacao_sup,
        createdAt: new Date(item.created_at),
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Criar nova solicitação
  const createSolicitation = async (solicitation: Omit<Solicitation, 'id' | 'createdAt'>): Promise<Solicitation | null> => {
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
        }])
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        data: data.data,
        fone: data.fone || '',
        nome: data.nome,
        matricula: data.matricula,
        placa: data.placa,
        solicitacao: data.solicitacao,
        valor: parseFloat(data.valor),
        valorCombustivel: data.valor_combustivel ? parseFloat(data.valor_combustivel) : undefined,
        descricaoPecas: data.descricao_pecas || undefined,
        status: data.status || 'Pendente',
        aprovacao: data.aprovacao,
        avisado: data.avisado,
        aprovacaoSup: data.aprovacao_sup,
        createdAt: new Date(data.created_at),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar solicitação';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar solicitação
  const updateSolicitation = async (id: string, updates: Partial<Solicitation>): Promise<boolean> => {
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

      console.log('📝 Dados para atualização:', { id, updateData });

      const { data, error } = await supabase
        .from('solicitacoes_motoboy')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Erro Supabase:', error);
        throw error;
      }
      
      console.log('✅ Solicitação atualizada com sucesso:', data);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar solicitação';
      console.error('❌ Erro na atualização:', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Deletar solicitação
  const deleteSolicitation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('solicitacoes_motoboy')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar solicitação';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar solicitações por status
  const fetchSolicitationsByStatus = async (status: string): Promise<Solicitation[]> => {
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
      
      return data?.map(item => ({
        id: item.id,
        data: item.data,
        fone: item.fone || '',
        nome: item.nome,
        matricula: item.matricula,
        placa: item.placa,
        solicitacao: item.solicitacao,
        valor: parseFloat(item.valor),
        valorCombustivel: item.valor_combustivel ? parseFloat(item.valor_combustivel) : undefined,
        descricaoPecas: item.descricao_pecas || undefined,
        status: item.status || 'Pendente',
        aprovacao: item.aprovacao,
        avisado: item.avisado,
        aprovacaoSup: item.aprovacao_sup,
        createdAt: new Date(item.created_at),
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchSolicitations,
    createSolicitation,
    updateSolicitation,
    deleteSolicitation,
    fetchSolicitationsByStatus,
  };
}
