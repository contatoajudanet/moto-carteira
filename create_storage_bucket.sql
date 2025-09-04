-- Script para criar o bucket de storage no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar bucket para documentos dos motoboys
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'motoboy-documents',
  'motoboy-documents',
  true,
  5242880, -- 5MB em bytes
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'motoboy-documents';

-- Configurar políticas de acesso (opcional - para desenvolvimento)
-- Permitir acesso público para leitura
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'motoboy-documents');

-- Permitir inserção para usuários autenticados
CREATE POLICY "Authenticated users can insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'motoboy-documents' AND auth.role() = 'authenticated');

-- Permitir atualização para usuários autenticados
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'motoboy-documents' AND auth.role() = 'authenticated');

-- Permitir exclusão para usuários autenticados
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'motoboy-documents' AND auth.role() = 'authenticated');
