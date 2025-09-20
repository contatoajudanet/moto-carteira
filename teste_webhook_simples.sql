-- Teste simples para webhook - Execute este SQL no Supabase
-- Este comando irá inserir uma solicitação e automaticamente disparar o webhook

INSERT INTO solicitacoes_motoboy (
    data,
    fone,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    valor_combustivel,
    status,
    aprovacao,
    avisado,
    aprovacao_sup,
    supervisor_codigo,
    created_at,
    updated_at
) VALUES (
    CURRENT_DATE,
    '554195059996',
    'TESTE WEBHOOK REALTIME',
    'REALTIME001',
    'REAL-1234',
    'Vale Combustível',
    '100.00',
    100.00,
    'Fase de aprovação',
    'pendente',
    true,
    'pendente',
    'REALTIME123',
    NOW(),
    NOW()
);

-- Verificar se foi inserido
SELECT 
    id,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    created_at
FROM solicitacoes_motoboy 
WHERE nome = 'TESTE WEBHOOK REALTIME'
ORDER BY created_at DESC
LIMIT 1;
