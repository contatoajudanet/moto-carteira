-- Schema do banco de dados para o sistema Motoboy Fuel Buddy
-- Todas as tabelas terminam com _motoboy conforme solicitado

-- Tabela principal de solicitações
CREATE TABLE IF NOT EXISTS solicitacoes_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    fone VARCHAR(20),
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) NOT NULL,
    placa VARCHAR(10) NOT NULL,
    solicitacao VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_combustivel DECIMAL(10,2),
    descricao_pecas TEXT,
    status VARCHAR(100) DEFAULT 'Fase de aprovação',
    aprovacao VARCHAR(20) DEFAULT 'pendente' CHECK (aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
    avisado BOOLEAN DEFAULT true,
    aprovacao_sup VARCHAR(20) DEFAULT 'pendente' CHECK (aprovacao_sup IN ('pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS usuarios_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'supervisor', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de motoboys cadastrados
CREATE TABLE IF NOT EXISTS motoboys_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    placa_veiculo VARCHAR(10),
    modelo_veiculo VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de aprovações
CREATE TABLE IF NOT EXISTS historico_aprovacoes_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    solicitacao_id UUID REFERENCES solicitacoes_motoboy(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios_motoboy(id),
    acao VARCHAR(50) NOT NULL, -- 'aprovado', 'rejeitado', 'status_alterado'
    valor_anterior TEXT,
    valor_novo TEXT,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tipos de solicitação
CREATE TABLE IF NOT EXISTS tipos_solicitacao_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos de solicitação padrão
INSERT INTO tipos_solicitacao_motoboy (nome, descricao) VALUES
    ('Combustível', 'Solicitação de vale combustível'),
    ('Vale Peças', 'Solicitação de vale para compra de peças'),
    ('Manutenção', 'Solicitação de manutenção do veículo'),
    ('Outros', 'Outros tipos de solicitação')
ON CONFLICT (nome) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO configuracoes_motoboy (chave, valor, descricao) VALUES
    ('limite_combustivel_diario', '100.00', 'Limite diário para vale combustível por motoboy'),
    ('limite_pecas_mensal', '500.00', 'Limite mensal para vale peças por motoboy'),
    ('notificacao_email', 'true', 'Habilitar notificações por email'),
    ('notificacao_sms', 'false', 'Habilitar notificações por SMS')
ON CONFLICT (chave) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON solicitacoes_motoboy(data);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_matricula ON solicitacoes_motoboy(matricula);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao ON solicitacoes_motoboy(aprovacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao_sup ON solicitacoes_motoboy(aprovacao_sup);
CREATE INDEX IF NOT EXISTS idx_motoboys_matricula ON motoboys_motoboy(matricula);
CREATE INDEX IF NOT EXISTS idx_historico_solicitacao ON historico_aprovacoes_motoboy(solicitacao_id);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_solicitacoes_updated_at 
    BEFORE UPDATE ON solicitacoes_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motoboys_updated_at 
    BEFORE UPDATE ON motoboys_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON configuracoes_motoboy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para registrar histórico de alterações
CREATE OR REPLACE FUNCTION registrar_historico_aprovacao()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Registrar mudanças na aprovação
        IF OLD.aprovacao != NEW.aprovacao THEN
            INSERT INTO historico_aprovacoes_motoboy (solicitacao_id, acao, valor_anterior, valor_novo)
            VALUES (NEW.id, 'status_alterado', OLD.aprovacao, NEW.aprovacao);
        END IF;
        
        -- Registrar mudanças na aprovação supervisora
        IF OLD.aprovacao_sup != NEW.aprovacao_sup THEN
            INSERT INTO historico_aprovacoes_motoboy (solicitacao_id, acao, valor_anterior, valor_novo)
            VALUES (NEW.id, 'aprovacao_sup_alterada', 
                   CASE WHEN OLD.aprovacao_sup THEN 'Aprovado' ELSE 'Pendente' END,
                   CASE WHEN NEW.aprovacao_sup THEN 'Aprovado' ELSE 'Pendente' END);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para registrar histórico
CREATE TRIGGER trigger_historico_aprovacao
    AFTER UPDATE ON solicitacoes_motoboy
    FOR EACH ROW EXECUTE FUNCTION registrar_historico_aprovacao();

-- Comentários nas tabelas
COMMENT ON TABLE solicitacoes_motoboy IS 'Tabela principal de solicitações dos motoboys';
COMMENT ON TABLE usuarios_motoboy IS 'Usuários do sistema com diferentes níveis de acesso';
COMMENT ON TABLE motoboys_motoboy IS 'Cadastro de motoboys da empresa';
COMMENT ON TABLE historico_aprovacoes_motoboy IS 'Histórico de todas as alterações nas solicitações';
COMMENT ON TABLE configuracoes_motoboy IS 'Configurações do sistema';
COMMENT ON TABLE tipos_solicitacao_motoboy IS 'Tipos de solicitação disponíveis no sistema';
