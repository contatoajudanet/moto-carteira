-- =====================================================
-- SCRIPT SIMPLES PARA CRIAR BUCKETS DE STORAGE
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Data: $(date)
-- Sistema: Motoboy Fuel Buddy

-- =====================================================
-- 1. BUCKET PRINCIPAL: DOCUMENTOS E PDFs
-- =====================================================

-- Criar bucket para documentos (PDFs, laudos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'motoboy-documents',
    'motoboy-documents',
    true,
    5242880, -- 5MB em bytes
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. BUCKET SECUNDÁRIO: IMAGENS DE PEÇAS
-- =====================================================

-- Criar bucket para imagens de peças
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'motoboy-images',
    'motoboy-images',
    true,
    10485760, -- 10MB em bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET DE DOCUMENTOS
-- =====================================================

-- Política para permitir leitura pública de documentos
CREATE POLICY "Permitir leitura pública documentos" ON storage.objects
FOR SELECT USING (bucket_id = 'motoboy-documents');

-- Política para permitir upload de documentos
CREATE POLICY "Permitir upload documentos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'motoboy-documents' AND
    (storage.foldername(name))[1] IN ('laudos', 'documentos', 'pdfs')
);

-- Política para permitir atualização de documentos
CREATE POLICY "Permitir atualização documentos" ON storage.objects
FOR UPDATE USING (bucket_id = 'motoboy-documents');

-- Política para permitir exclusão de documentos
CREATE POLICY "Permitir exclusão documentos" ON storage.objects
FOR DELETE USING (bucket_id = 'motoboy-documents');

-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET DE IMAGENS
-- =====================================================

-- Política para permitir leitura pública de imagens
CREATE POLICY "Permitir leitura pública imagens" ON storage.objects
FOR SELECT USING (bucket_id = 'motoboy-images');

-- Política para permitir upload de imagens
CREATE POLICY "Permitir upload imagens" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'motoboy-images' AND
    (storage.foldername(name))[1] IN ('pecas', 'imagens', 'uploads')
);

-- Política para permitir atualização de imagens
CREATE POLICY "Permitir atualização imagens" ON storage.objects
FOR UPDATE USING (bucket_id = 'motoboy-images');

-- Política para permitir exclusão de imagens
CREATE POLICY "Permitir exclusão imagens" ON storage.objects
FOR DELETE USING (bucket_id = 'motoboy-images');

-- =====================================================
-- FUNÇÕES SIMPLES PARA STORAGE
-- =====================================================

-- Função para verificar se um arquivo existe no storage
CREATE OR REPLACE FUNCTION file_exists(bucket_name TEXT, file_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    file_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO file_count
    FROM storage.objects
    WHERE bucket_id = bucket_name AND name = file_path;
    
    RETURN file_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar arquivos de um bucket
CREATE OR REPLACE FUNCTION list_bucket_files(bucket_name TEXT, folder_path TEXT DEFAULT '')
RETURNS TABLE (
    name TEXT,
    size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.name,
        o.metadata->>'size'::BIGINT,
        o.created_at,
        o.updated_at
    FROM storage.objects o
    WHERE o.bucket_id = bucket_name
        AND (folder_path = '' OR o.name LIKE folder_path || '%')
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO DOS BUCKETS
-- =====================================================

-- Verificar se os buckets foram criados
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id LIKE 'motoboy-%'
ORDER BY created_at;

-- Verificar políticas de storage criadas
SELECT 
    policyname,
    tablename,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
    AND (policyname LIKE '%documentos%' OR policyname LIKE '%imagens%')
ORDER BY policyname;

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Exemplo 1: Verificar se arquivo existe
-- SELECT file_exists('motoboy-documents', 'laudos/laudo_12345.pdf');

-- Exemplo 2: Listar arquivos de um bucket
-- SELECT * FROM list_bucket_files('motoboy-documents', 'laudos/');

-- Exemplo 3: Upload de PDF de laudo (via aplicação)
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata)
-- VALUES (
--     'motoboy-documents',
--     'laudos/laudo_12345.pdf',
--     auth.uid(),
--     '{"size": 1024000, "mimetype": "application/pdf"}'::jsonb
-- );

-- Exemplo 4: Upload de imagem de peça (via aplicação)
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata)
-- VALUES (
--     'motoboy-images',
--     'pecas/peca_67890.jpg',
--     auth.uid(),
--     '{"size": 2048000, "mimetype": "image/jpeg"}'::jsonb
-- );

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================
-- ✅ Bucket 'motoboy-documents' criado para PDFs
-- ✅ Bucket 'motoboy-images' criado para imagens
-- ✅ Políticas de segurança configuradas
-- ✅ Funções auxiliares criadas
-- 
-- Próximos passos:
-- 1. Teste o upload de arquivos via aplicação
-- 2. Configure as variáveis de ambiente da aplicação
-- 3. Execute testes de integração
-- =====================================================
