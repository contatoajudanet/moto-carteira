-- SQL para simular a inclusão de uma nova solicitação
-- Este script pode ser executado no SQL Editor do Supabase para testar o webhook

-- Inserir uma nova solicitação de combustível para TESTE DE WEBHOOK
INSERT INTO solicitacoes_motoboy (
    data,
    fone,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    valor_combustivel,
    descricao_pecas,
    status,
    aprovacao,
    avisado,
    aprovacao_sup,
    supervisor_codigo,
    created_at,
    updated_at
) VALUES (
    CURRENT_DATE, -- data atual (tipo date)
    '554195059996', -- telefone (formato WhatsApp)
    'TESTE WEBHOOK - João Silva', -- nome do motoboy (identificação de teste)
    'TEST001', -- matrícula (identificação de teste)
    'TEST-1234', -- placa (identificação de teste)
    'Vale Combustível', -- tipo de solicitação
    '75.50', -- valor
    75.50, -- valor do combustível
    NULL, -- descrição de peças (não aplicável para combustível)
    'Fase de aprovação', -- status
    'pendente', -- aprovação
    true, -- avisado
    'pendente', -- aprovação supervisora
    'TEST1234', -- código do supervisor (identificação de teste)
    NOW(), -- created_at
    NOW() -- updated_at
);

-- Inserir uma nova solicitação de peças para TESTE DE WEBHOOK
INSERT INTO solicitacoes_motoboy (
    data,
    fone,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    valor_combustivel,
    descricao_pecas,
    status,
    aprovacao,
    avisado,
    aprovacao_sup,
    supervisor_codigo,
    created_at,
    updated_at
) VALUES (
    CURRENT_DATE, -- data atual (tipo date)
    '554195059996', -- telefone (formato WhatsApp)
    'TESTE WEBHOOK - Maria Santos', -- nome do motoboy (identificação de teste)
    'TEST002', -- matrícula (identificação de teste)
    'TEST-5678', -- placa (identificação de teste)
    'Vale Peças', -- tipo de solicitação
    '250.75', -- valor
    NULL, -- valor do combustível (não aplicável para peças)
    'Pastilhas de freio dianteiras + Óleo de motor', -- descrição de peças
    'Fase de aprovação', -- status
    'pendente', -- aprovação
    true, -- avisado
    'pendente', -- aprovação supervisora
    'TEST5678', -- código do supervisor (identificação de teste)
    NOW(), -- created_at
    NOW() -- updated_at
);

-- Verificar as solicitações de teste inseridas
SELECT 
    id,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    status,
    aprovacao_sup,
    supervisor_codigo,
    created_at
FROM solicitacoes_motoboy 
WHERE nome LIKE 'TESTE WEBHOOK%'
ORDER BY created_at DESC;

-- Comentário: 
-- Após executar este SQL, o sistema deve automaticamente disparar 
-- o webhook para a URL configurada com os dados da nova solicitação.
-- Verifique os logs do console do navegador ou do servidor para 
-- confirmar que o webhook foi enviado com sucesso.
