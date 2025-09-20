-- Script para adicionar campo de URL da imagem na tabela solicitacoes_motoboy
-- Execute este SQL no Supabase para adicionar o campo

-- Adicionar coluna para URL da imagem enviada pelo motoboy
ALTER TABLE solicitacoes_motoboy 
ADD COLUMN IF NOT EXISTS url_imagem_pecas TEXT;

-- Adicionar coluna para timestamp de quando a imagem foi recebida
ALTER TABLE solicitacoes_motoboy 
ADD COLUMN IF NOT EXISTS data_recebimento_imagem TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna para status da imagem (pendente, recebida, processada)
ALTER TABLE solicitacoes_motoboy 
ADD COLUMN IF NOT EXISTS status_imagem TEXT DEFAULT 'pendente';

-- Comentário: 
-- Agora a tabela terá os campos:
-- - url_imagem_pecas: URL da imagem enviada pelo motoboy
-- - data_recebimento_imagem: Quando a imagem foi recebida
-- - status_imagem: Status da imagem (pendente, recebida, processada)

