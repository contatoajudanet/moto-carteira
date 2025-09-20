import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Solicitation } from '@/types/solicitation';
import { sendNewSolicitationWebhook } from '@/lib/webhook';

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
      
      console.log('📊 Dados brutos do Supabase:', data);
      
      // Buscar dados dos supervisores se houver supervisor_codigo
      const supervisorCodigos = [...new Set(data?.map(item => item.supervisor_codigo).filter(Boolean) || [])];
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
      
      // Converter os dados do Supabase para o formato da aplicação
      return data?.map(item => {
        console.log(`📄 PDF Laudo para ${item.nome}:`, item.pdf_laudo);
        return {
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
        };
      }) || [];
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
      
      const createdSolicitation = {
        id: data.id,
        data: data.data,
        fone: data.fone || '',
        nome: data.nome,
        matricula: data.matricula,
        placa: data.placa,
        solicitacao: data.solicitacao,
        valor: data.valor,
        valorCombustivel: data.valor_combustivel ? parseFloat(data.valor_combustivel) : undefined,
        descricaoPecas: data.descricao_pecas || undefined,
        status: data.status || 'Pendente',
        aprovacao: data.aprovacao,
        avisado: data.avisado,
        aprovacaoSup: data.aprovacao_sup,
        pdfLaudo: data.pdf_laudo || undefined,
        valorPeca: data.valor_peca ? parseFloat(data.valor_peca) : undefined,
        lojaAutorizada: data.loja_autorizada || undefined,
        descricaoCompletaPecas: data.descricao_completa_pecas || undefined,
        created_at: data.created_at,
      };

      // Disparar webhook automaticamente para nova solicitação
      try {
        await sendNewSolicitationWebhook({
          id: createdSolicitation.id,
          nome: createdSolicitation.nome,
          fone: createdSolicitation.fone,
          matricula: createdSolicitation.matricula,
          placa: createdSolicitation.placa,
          solicitacao: createdSolicitation.solicitacao,
          valor: createdSolicitation.valor,
          valorCombustivel: createdSolicitation.valorCombustivel,
          descricaoPecas: createdSolicitation.descricaoPecas,
          status: createdSolicitation.status,
          aprovacaoSup: createdSolicitation.aprovacaoSup,
          data: createdSolicitation.data,
          supervisor_codigo: data.supervisor_codigo || null,
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de nova solicitação:', webhookError);
        // Não falhar a criação da solicitação se o webhook falhar
      }
      
      return createdSolicitation;
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
      if (updates.pdfLaudo !== undefined) updateData.pdf_laudo = updates.pdfLaudo;
      if (updates.valorPeca !== undefined) updateData.valor_peca = updates.valorPeca;
      if (updates.lojaAutorizada !== undefined) updateData.loja_autorizada = updates.lojaAutorizada;
      if (updates.descricaoCompletaPecas !== undefined) updateData.descricao_completa_pecas = updates.descricaoCompletaPecas;
      if (updates.supervisor_codigo !== undefined) updateData.supervisor_codigo = updates.supervisor_codigo;

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
      
      // Buscar dados dos supervisores se houver supervisor_codigo
      const supervisorCodigos = [...new Set(data?.map(item => item.supervisor_codigo).filter(Boolean) || [])];
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
      
      return data?.map(item => ({
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
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar solicitações por supervisor
  const fetchSolicitationsBySupervisor = async (supervisorCodigo: string | null): Promise<Solicitation[]> => {
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
      
      // Buscar dados dos supervisores se houver supervisor_codigo
      const supervisorCodigos = [...new Set(data?.map(item => item.supervisor_codigo).filter(Boolean) || [])];
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
      
      return data?.map(item => ({
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
    fetchSolicitationsBySupervisor,
  };
}
