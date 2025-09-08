// Utilitário para testar conexão Realtime
import { supabase } from '@/lib/supabase';

export async function testRealtimeConnection() {
  console.log('🧪 Testando conexão Realtime...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase
      .from('solicitacoes_motoboy')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão básica:', error);
      return false;
    }
    
    console.log('✅ Conexão básica funcionando');
    
    // Testar subscription
    const channel = supabase
      .channel('test_realtime_connection')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solicitacoes_motoboy'
      }, (payload) => {
        console.log('🔄 Evento Realtime recebido:', payload);
      })
      .subscribe((status) => {
        console.log('📡 Status da subscription de teste:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime funcionando corretamente!');
          // Desconectar após teste
          setTimeout(() => {
            supabase.removeChannel(channel);
            console.log('🔌 Canal de teste desconectado');
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription Realtime');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Timeout na conexão Realtime');
        }
      });
    
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de Realtime:', error);
    return false;
  }
}

// Função para verificar configurações do Supabase
export async function checkSupabaseConfig() {
  console.log('🔍 Verificando configurações do Supabase...');
  
  try {
    // Verificar URL e chave
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('📋 Configurações:');
    console.log('- URL:', url ? '✅ Configurada' : '❌ Não configurada');
    console.log('- Key:', key ? '✅ Configurada' : '❌ Não configurada');
    
    if (!url || !key) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return false;
    }
    
    // Testar conexão
    const { data, error } = await supabase
      .from('solicitacoes_motoboy')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando');
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
}

// Função para diagnosticar problemas
export async function diagnoseRealtimeIssues() {
  console.log('🔧 Diagnosticando problemas de Realtime...');
  
  const results = {
    config: false,
    connection: false,
    realtime: false,
    table: false
  };
  
  // 1. Verificar configurações
  results.config = await checkSupabaseConfig();
  
  if (!results.config) {
    console.log('❌ Problema: Configurações do Supabase');
    return results;
  }
  
  // 2. Verificar conexão básica
  try {
    const { data, error } = await supabase
      .from('solicitacoes_motoboy')
      .select('id')
      .limit(1);
    
    results.connection = !error;
    console.log('📊 Conexão básica:', results.connection ? '✅' : '❌');
  } catch (error) {
    console.log('📊 Conexão básica: ❌', error);
  }
  
  // 3. Verificar se a tabela existe
  try {
    const { data, error } = await supabase
      .from('solicitacoes_motoboy')
      .select('*')
      .limit(1);
    
    results.table = !error;
    console.log('📊 Tabela existe:', results.table ? '✅' : '❌');
  } catch (error) {
    console.log('📊 Tabela existe: ❌', error);
  }
  
  // 4. Testar Realtime
  results.realtime = await testRealtimeConnection();
  console.log('📊 Realtime funcionando:', results.realtime ? '✅' : '❌');
  
  // Resumo
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('- Configurações:', results.config ? '✅' : '❌');
  console.log('- Conexão:', results.connection ? '✅' : '❌');
  console.log('- Tabela:', results.table ? '✅' : '❌');
  console.log('- Realtime:', results.realtime ? '✅' : '❌');
  
  if (!results.realtime) {
    console.log('\n🚨 AÇÕES NECESSÁRIAS:');
    console.log('1. Acesse o Dashboard do Supabase');
    console.log('2. Vá para Database > Tables');
    console.log('3. Clique na tabela "solicitacoes_motoboy"');
    console.log('4. Vá para Settings/Configuration');
    console.log('5. Habilite "Realtime" para esta tabela');
    console.log('6. Verifique se RLS não está bloqueando');
  }
  
  return results;
}
