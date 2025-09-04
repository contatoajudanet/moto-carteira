-- Script para corrigir as políticas de segurança do Storage
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- 2. Criar políticas mais permissivas para desenvolvimento
-- Permitir acesso público para leitura
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'motoboy-documents');

-- Permitir inserção para qualquer usuário (desenvolvimento)
CREATE POLICY "Public Insert Access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'motoboy-documents');

-- Permitir atualização para qualquer usuário (desenvolvimento)
CREATE POLICY "Public Update Access" ON storage.objects
FOR UPDATE USING (bucket_id = 'motoboy-documents');

-- Permitir exclusão para qualquer usuário (desenvolvimento)
CREATE POLICY "Public Delete Access" ON storage.objects
FOR DELETE USING (bucket_id = 'motoboy-documents');

-- 3. Verificar se o bucket existe e criar se necessário
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'motoboy-documents',
  'motoboy-documents',
  true,
  5242880, -- 5MB em bytes
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 4. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
