-- Teste específico para Vale Peças - Execute este SQL no Supabase
-- Este comando irá inserir uma solicitação de Vale Peças e automaticamente disparar o webhook

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
    CURRENT_DATE,
    '554195059996',
    'João Silva Teste',
    'PECAS001',
    'ABC-1234',
    'Vale Peças',
    '150.00',
    NULL,
    'Pastilhas de freio dianteiras + Óleo de motor',
    'Fase de aprovação',
    'pendente',
    true,
    'pendente',
    'PECAS123',
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
    descricao_pecas,
    created_at
FROM solicitacoes_motoboy 
WHERE nome = 'João Silva Teste'
ORDER BY created_at DESC
LIMIT 1;

-- Comentário: 
-- Após executar este SQL, o sistema deve detectar que é uma solicitação de "Vale Peças"
-- e automaticamente disparar o webhook com a mensagem:
-- "Olá João Silva Teste, estamos confirmando seu registro de vale peças, só precisamos que envie uma imagem para armazenar em nosso sistema."
-- 
-- O webhook será enviado para: 554195059996@s.whatsapp.net
