-- =====================================================
-- SCRIPT CORRIGIDO PARA CRIAR BUCKETS DE STORAGE
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
-- FUNÇÕES AUXILIARES PARA STORAGE
-- =====================================================

-- Função para obter URL pública de um arquivo
-- Nota: Esta função retorna o padrão de URL do Supabase
-- O URL real será construído pela aplicação usando a URL do projeto
CREATE OR REPLACE FUNCTION get_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Retorna o caminho relativo que será usado pela aplicação
    -- A aplicação deve concatenar com a URL base do Supabase
    RETURN CONCAT('/storage/v1/object/public/', bucket_name, '/', file_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- TRIGGERS PARA AUDITORIA DE STORAGE
-- =====================================================

-- Tabela para auditoria de arquivos
CREATE TABLE IF NOT EXISTS storage_audit_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    action TEXT NOT NULL, -- 'upload', 'delete', 'update'
    file_size BIGINT,
    mime_type TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para auditoria de storage
CREATE OR REPLACE FUNCTION audit_storage_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO storage_audit_motoboy (bucket_id, file_path, action, file_size, mime_type)
        VALUES (NEW.bucket_id, NEW.name, 'upload', 
                (NEW.metadata->>'size')::BIGINT, 
                NEW.metadata->>'mimetype');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO storage_audit_motoboy (bucket_id, file_path, action, file_size, mime_type)
        VALUES (NEW.bucket_id, NEW.name, 'update', 
                (NEW.metadata->>'size')::BIGINT, 
                NEW.metadata->>'mimetype');
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO storage_audit_motoboy (bucket_id, file_path, action, file_size, mime_type)
        VALUES (OLD.bucket_id, OLD.name, 'delete', 
                (OLD.metadata->>'size')::BIGINT, 
                OLD.metadata->>'mimetype');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria de storage
CREATE TRIGGER storage_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON storage.objects
    FOR EACH ROW EXECUTE FUNCTION audit_storage_changes();

-- =====================================================
-- VERIFICAÇÃO E TESTE DOS BUCKETS
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
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
    AND (policyname LIKE '%documentos%' OR policyname LIKE '%imagens%')
ORDER BY policyname;

-- Testar função de URL pública
SELECT get_public_url('motoboy-documents', 'laudos/teste.pdf') as exemplo_caminho;

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Exemplo 1: Upload de PDF de laudo
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata)
-- VALUES (
--     'motoboy-documents',
--     'laudos/laudo_12345.pdf',
--     auth.uid(),
--     '{"size": 1024000, "mimetype": "application/pdf"}'::jsonb
-- );

-- Exemplo 2: Upload de imagem de peça
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata)
-- VALUES (
--     'motoboy-images',
--     'pecas/peca_67890.jpg',
--     auth.uid(),
--     '{"size": 2048000, "mimetype": "image/jpeg"}'::jsonb
-- );

-- Exemplo 3: Listar arquivos de um bucket
-- SELECT * FROM list_bucket_files('motoboy-documents', 'laudos/');

-- Exemplo 4: Verificar se arquivo existe
-- SELECT file_exists('motoboy-documents', 'laudos/laudo_12345.pdf');

-- =====================================================
-- LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Função para limpar arquivos antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_files(
    bucket_name TEXT,
    days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = bucket_name
        AND created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================
-- ✅ Bucket 'motoboy-documents' criado para PDFs
-- ✅ Bucket 'motoboy-images' criado para imagens
-- ✅ Políticas de segurança configuradas
-- ✅ Funções auxiliares criadas
-- ✅ Sistema de auditoria implementado
-- 
-- Próximos passos:
-- 1. Teste o upload de arquivos
-- 2. Configure as variáveis de ambiente da aplicação
-- 3. Execute testes de integração
-- =====================================================
