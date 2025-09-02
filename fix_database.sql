-- Script para verificar e corrigir a estrutura da tabela solicitacoes_motoboy
-- Execute este script se houver problemas com a estrutura da tabela

-- 1. Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_motoboy'
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe e sua estrutura
\d solicitacoes_motoboy;

-- 3. Se houver problemas, recriar a tabela com a estrutura correta
DROP TABLE IF EXISTS solicitacoes_motoboy CASCADE;

CREATE TABLE solicitacoes_motoboy (
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

-- 4. Inserir dados de teste
INSERT INTO solicitacoes_motoboy (data, fone, nome, matricula, placa, solicitacao, valor, valor_combustivel, descricao_pecas, status, aprovacao, avisado, aprovacao_sup) VALUES
    ('2024-01-15', '(11) 99999-1111', 'João Silva Santos', 'M001', 'ABC-1234', 'Combustível', 80.00, 80.00, NULL, 'Fase de aprovação', 'pendente', true, 'pendente'),
    ('2024-01-15', '(11) 88888-2222', 'Maria Oliveira Costa', 'M002', 'DEF-5678', 'Combustível', 65.50, 65.50, NULL, 'Aprovado pelo supervisor', 'aprovado', true, 'aprovado');

-- 5. Verificar se os dados foram inseridos
SELECT * FROM solicitacoes_motoboy;

-- 6. Testar uma atualização
UPDATE solicitacoes_motoboy 
SET aprovacao_sup = 'aprovado', status = 'Aprovado pelo supervisor'
WHERE id = (SELECT id FROM solicitacoes_motoboy LIMIT 1);

-- 7. Verificar o resultado
SELECT * FROM solicitacoes_motoboy;
