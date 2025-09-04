-- Script para atualizar a estrutura do banco de dados
-- Execute este script no SQL Editor do Supabase

-- 1. Alterar o tipo da coluna telefone para VARCHAR(50)
ALTER TABLE solicitacoes_motoboy 
ALTER COLUMN telefone TYPE VARCHAR(50);

-- 2. Adicionar coluna para armazenar URL do PDF do laudo
ALTER TABLE solicitacoes_motoboy 
ADD COLUMN IF NOT EXISTS pdf_laudo TEXT;

-- 3. Criar bucket de storage para documentos
-- Nota: Este comando deve ser executado via API do Supabase ou interface web
-- O bucket será criado automaticamente quando o primeiro arquivo for enviado

-- 4. Verificar a estrutura atual da tabela
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_motoboy'
ORDER BY ordinal_position;

-- 5. Verificar dados existentes
SELECT 
  id,
  nome,
  telefone,
  placa,
  solicitacao,
  valor_combustivel,
  descricao_pecas,
  status,
  avisado,
  aprovacao_sup,
  pdf_laudo,
  data_criacao
FROM solicitacoes_motoboy 
LIMIT 5;
