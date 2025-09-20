-- Exemplo prático de como usar o SQL para salvar URL da imagem
-- Este é um exemplo real que você pode adaptar

-- 1. Primeiro, vamos simular uma solicitação de Vale Peças
INSERT INTO solicitacoes_motoboy (
    data,
    fone,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    descricao_pecas,
    status,
    aprovacao,
    avisado,
    aprovacao_sup,
    supervisor_codigo,
    status_imagem,
    created_at,
    updated_at
) VALUES (
    CURRENT_DATE,
    '554195059996',
    'João Silva',
    'MOT123',
    'ABC-1234',
    'Vale Peças',
    '200.00',
    'Pastilhas de freio + Óleo de motor',
    'Fase de aprovação',
    'pendente',
    true,
    'pendente',
    'SUP001',
    'pendente',
    NOW(),
    NOW()
);

-- 2. Agora vamos simular o recebimento da imagem via webhook
-- (Esta query seria executada automaticamente quando o webhook receber a imagem)
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = 'https://example.com/imagem_recebida.jpg',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE matricula = 'MOT123'
  AND solicitacao ILIKE '%peças%'
  AND status_imagem = 'pendente'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Verificar o resultado
SELECT 
    id,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    descricao_pecas,
    url_imagem_pecas,
    data_recebimento_imagem,
    status_imagem,
    created_at,
    updated_at
FROM solicitacoes_motoboy 
WHERE matricula = 'MOT123'
ORDER BY created_at DESC;

-- 4. Query para buscar todas as solicitações de peças com imagem pendente
SELECT 
    id,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    descricao_pecas,
    status_imagem,
    created_at
FROM solicitacoes_motoboy 
WHERE solicitacao ILIKE '%peças%'
  AND status_imagem = 'pendente'
ORDER BY created_at DESC;

-- 5. Query para buscar todas as solicitações de peças com imagem recebida
SELECT 
    id,
    nome,
    matricula,
    placa,
    solicitacao,
    valor,
    descricao_pecas,
    url_imagem_pecas,
    data_recebimento_imagem,
    status_imagem
FROM solicitacoes_motoboy 
WHERE solicitacao ILIKE '%peças%'
  AND status_imagem = 'recebida'
  AND url_imagem_pecas IS NOT NULL
ORDER BY data_recebimento_imagem DESC;

