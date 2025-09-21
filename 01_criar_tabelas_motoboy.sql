-- =====================================================
-- SCRIPT PARA CRIAR TODAS AS TABELAS DO SISTEMA MOTOBOY
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Data: $(date)
-- Sistema: Motoboy Fuel Buddy

-- =====================================================
-- 1. TABELA PRINCIPAL: SOLICITAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS solicitacoes_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    fone VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    placa VARCHAR(10) NOT NULL,
    solicitacao VARCHAR(100) NOT NULL,
    valor VARCHAR(20),
    valor_combustivel DECIMAL(10,2),
    descricao_pecas TEXT,
    status VARCHAR(100) NOT NULL,
    aprovacao VARCHAR(50) NOT NULL DEFAULT 'pendente',
    avisado BOOLEAN NOT NULL DEFAULT true,
    aprovacao_sup VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (aprovacao_sup IN ('pendente', 'aprovado', 'rejeitado')),
    supervisor_codigo VARCHAR(20),
    
    -- Campos para peças
    valor_peca DECIMAL(10,2),
    loja_autorizada VARCHAR(255),
    descricao_completa_pecas TEXT,
    
    -- Campos para imagem de peças
    url_imagem_pecas TEXT,
    data_recebimento_imagem TIMESTAMP WITH TIME ZONE,
    status_imagem VARCHAR(20) DEFAULT 'pendente' CHECK (status_imagem IN ('pendente', 'recebida', 'processada')),
    
    -- Campos de auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA DE SUPERVISORES
-- =====================================================
CREATE TABLE IF NOT EXISTS supervisores_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA DE HISTÓRICO DE APROVAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS historico_aprovacoes_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID REFERENCES solicitacoes_motoboy(id) ON DELETE CASCADE,
    supervisor_codigo VARCHAR(20),
    acao VARCHAR(50) NOT NULL, -- 'aprovado', 'rejeitado', 'alterado'
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABELA DE CONFIGURAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABELA DE TIPOS DE SOLICITAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS tipos_solicitacao_motoboy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para solicitacoes_motoboy
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON solicitacoes_motoboy(data);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_matricula ON solicitacoes_motoboy(matricula);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_motoboy(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao_sup ON solicitacoes_motoboy(aprovacao_sup);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_supervisor ON solicitacoes_motoboy(supervisor_codigo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_created_at ON solicitacoes_motoboy(created_at);

-- Índices para supervisores_motoboy
CREATE INDEX IF NOT EXISTS idx_supervisores_codigo ON supervisores_motoboy(codigo);
CREATE INDEX IF NOT EXISTS idx_supervisores_ativo ON supervisores_motoboy(ativo);

-- Índices para usuarios_motoboy
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios_motoboy(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios_motoboy(ativo);

-- Índices para historico_aprovacoes_motoboy
CREATE INDEX IF NOT EXISTS idx_historico_solicitacao ON historico_aprovacoes_motoboy(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_historico_supervisor ON historico_aprovacoes_motoboy(supervisor_codigo);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON historico_aprovacoes_motoboy(created_at);

-- Índices para configuracoes_motoboy
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_motoboy(chave);

-- Índices para tipos_solicitacao_motoboy
CREATE INDEX IF NOT EXISTS idx_tipos_solicitacao_ativo ON tipos_solicitacao_motoboy(ativo);

-- =====================================================
-- TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_solicitacoes_updated_at 
    BEFORE UPDATE ON solicitacoes_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisores_updated_at 
    BEFORE UPDATE ON supervisores_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON configuracoes_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_solicitacao_updated_at 
    BEFORE UPDATE ON tipos_solicitacao_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE solicitacoes_motoboy ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisores_motoboy ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_motoboy ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_aprovacoes_motoboy ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_motoboy ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_solicitacao_motoboy ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura pública (ajuste conforme necessário)
CREATE POLICY "Permitir leitura pública solicitacoes" ON solicitacoes_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública supervisores" ON supervisores_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública usuarios" ON usuarios_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública historico" ON historico_aprovacoes_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública configuracoes" ON configuracoes_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública tipos" ON tipos_solicitacao_motoboy FOR SELECT USING (true);

-- Políticas para permitir inserção/atualização (ajuste conforme necessário)
CREATE POLICY "Permitir inserção solicitacoes" ON solicitacoes_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização solicitacoes" ON solicitacoes_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção supervisores" ON supervisores_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização supervisores" ON supervisores_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção usuarios" ON usuarios_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização usuarios" ON usuarios_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção historico" ON historico_aprovacoes_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção configuracoes" ON configuracoes_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização configuracoes" ON configuracoes_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção tipos" ON tipos_solicitacao_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização tipos" ON tipos_solicitacao_motoboy FOR UPDATE USING (true);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir tipos de solicitação padrão
INSERT INTO tipos_solicitacao_motoboy (nome, descricao) VALUES
('Combustível', 'Solicitação de vale combustível'),
('Vale Peças', 'Solicitação de vale para peças'),
('Manutenção', 'Solicitação de manutenção'),
('Outros', 'Outras solicitações')
ON CONFLICT DO NOTHING;

-- Inserir configurações padrão
INSERT INTO configuracoes_motoboy (chave, valor, descricao) VALUES
('webhook_url', '', 'URL do webhook para notificações'),
('max_valor_combustivel', '500.00', 'Valor máximo para solicitações de combustível'),
('max_valor_pecas', '1000.00', 'Valor máximo para solicitações de peças'),
('empresa_nome', 'Sua Empresa', 'Nome da empresa'),
('empresa_telefone', '', 'Telefone da empresa'),
('empresa_endereco', '', 'Endereço da empresa')
ON CONFLICT (chave) DO NOTHING;

-- Inserir supervisores de exemplo (opcional)
INSERT INTO supervisores_motoboy (codigo, nome, ativo) VALUES
('SUP001', 'Supervisor Principal', true),
('SUP002', 'Supervisor Secundário', true)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%_motoboy'
ORDER BY table_name;

-- Verificar índices criados
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename LIKE '%_motoboy'
ORDER BY tablename, indexname;

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================
-- ✅ Todas as tabelas foram criadas
-- ✅ Índices foram criados para performance
-- ✅ Triggers de auditoria foram configurados
-- ✅ RLS foi habilitado com políticas básicas
-- ✅ Dados iniciais foram inseridos
-- 
-- Próximo passo: Execute o script 02_criar_buckets_motoboy.sql
-- =====================================================
