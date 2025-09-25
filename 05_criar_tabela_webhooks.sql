-- =====================================================
-- SCRIPT PARA CRIAR TABELA DE CONFIGURAÇÕES DE WEBHOOK
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Data: $(date)
-- Sistema: Motoboy Fuel Buddy

-- =====================================================
-- 1. TABELA DE CONFIGURAÇÕES DE WEBHOOK
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_configs_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'aprovacao', 'pecas_imagem', 'geral'
    url TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    descricao TEXT,
    headers JSONB DEFAULT '{}', -- Headers customizados se necessário
    timeout INTEGER DEFAULT 30000, -- Timeout em ms
    retry_attempts INTEGER DEFAULT 3, -- Tentativas de retry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_webhook_configs_tipo ON webhook_configs_motoboy(tipo);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_ativo ON webhook_configs_motoboy(ativo);

-- =====================================================
-- 3. TRIGGER PARA AUDITORIA
-- =====================================================

CREATE TRIGGER update_webhook_configs_updated_at 
    BEFORE UPDATE ON webhook_configs_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE webhook_configs_motoboy ENABLE ROW LEVEL SECURITY;

-- Políticas para webhook_configs_motoboy
CREATE POLICY "Permitir leitura pública webhook configs" ON webhook_configs_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir inserção webhook configs" ON webhook_configs_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização webhook configs" ON webhook_configs_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão webhook configs" ON webhook_configs_motoboy FOR DELETE USING (true);

-- =====================================================
-- 5. DADOS INICIAIS
-- =====================================================

-- Inserir configurações padrão dos webhooks
INSERT INTO webhook_configs_motoboy (nome, tipo, url, ativo, descricao) VALUES
(
    'Webhook de Aprovação/Rejeição',
    'aprovacao',
    'https://evo-youtube-n8n.3sbind.easypanel.host/webhook/6fb80aa6-6aa4-45f6-90ea-37ae18b8ca1e',
    true,
    'Webhook acionado quando uma solicitação é aprovada ou rejeitada'
),
(
    'Webhook de Imagem de Peças',
    'pecas_imagem',
    'https://evo-youtube-n8n.3sbind.easypanel.host/webhook-test/7db9b091-45bd-4af6-bdd8-67b65aab2578',
    true,
    'Webhook para envio de imagens no fluxo de peças'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. TABELA DE LOG DE WEBHOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_logs_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_config_id UUID REFERENCES webhook_configs_motoboy(id) ON DELETE CASCADE,
    solicitacao_id UUID REFERENCES solicitacoes_motoboy(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    tentativa INTEGER DEFAULT 1,
    sucesso BOOLEAN DEFAULT false,
    tempo_resposta INTEGER, -- em ms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_config ON webhook_logs_motoboy(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_solicitacao ON webhook_logs_motoboy(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tipo ON webhook_logs_motoboy(tipo);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs_motoboy(created_at);

-- RLS para logs
ALTER TABLE webhook_logs_motoboy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública webhook logs" ON webhook_logs_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir inserção webhook logs" ON webhook_logs_motoboy FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para buscar webhook por tipo
CREATE OR REPLACE FUNCTION get_webhook_by_type(webhook_type VARCHAR)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    url TEXT,
    ativo BOOLEAN,
    headers JSONB,
    timeout INTEGER,
    retry_attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.nome,
        w.url,
        w.ativo,
        w.headers,
        w.timeout,
        w.retry_attempts
    FROM webhook_configs_motoboy w
    WHERE w.tipo = webhook_type 
        AND w.ativo = true
    ORDER BY w.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para log de webhook
CREATE OR REPLACE FUNCTION log_webhook_call(
    p_webhook_config_id UUID,
    p_solicitacao_id UUID,
    p_tipo VARCHAR,
    p_url TEXT,
    p_payload JSONB,
    p_response_status INTEGER,
    p_response_body TEXT,
    p_error_message TEXT,
    p_tentativa INTEGER,
    p_sucesso BOOLEAN,
    p_tempo_resposta INTEGER
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO webhook_logs_motoboy (
        webhook_config_id,
        solicitacao_id,
        tipo,
        url,
        payload,
        response_status,
        response_body,
        error_message,
        tentativa,
        sucesso,
        tempo_resposta
    ) VALUES (
        p_webhook_config_id,
        p_solicitacao_id,
        p_tipo,
        p_url,
        p_payload,
        p_response_status,
        p_response_body,
        p_error_message,
        p_tentativa,
        p_sucesso,
        p_tempo_resposta
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%webhook%'
ORDER BY table_name;

-- Verificar dados iniciais
SELECT 
    nome,
    tipo,
    url,
    ativo,
    descricao
FROM webhook_configs_motoboy
ORDER BY tipo;

-- =====================================================
-- SCRIPT CONCLUÍDO!
-- =====================================================
-- ✅ Tabela webhook_configs_motoboy criada
-- ✅ Tabela webhook_logs_motoboy criada
-- ✅ Configurações padrão inseridas
-- ✅ Funções auxiliares criadas
-- ✅ RLS e políticas configuradas
-- 
-- Próximo passo: Criar painel de configuração
-- =====================================================
