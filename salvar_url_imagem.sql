-- SQL Query para salvar a URL da imagem no banco de dados
-- Use este query quando receber a resposta do webhook com a imagem

-- Opção 1: Atualizar uma solicitação específica por ID
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = '{{ $(''Webhook'').item.json.body.data.message.imageMessage.url }}',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE id = 'ID_DA_SOLICITACAO_AQUI';

-- Opção 2: Atualizar pela matrícula do motoboy (mais prático)
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = '{{ $(''Webhook'').item.json.body.data.message.imageMessage.url }}',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE matricula = 'MATRICULA_DO_MOTOBOY_AQUI'
  AND solicitacao ILIKE '%peças%'
  AND status_imagem = 'pendente'
ORDER BY created_at DESC
LIMIT 1;

-- Opção 3: Atualizar pela matrícula e nome (mais seguro)
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = '{{ $(''Webhook'').item.json.body.data.message.imageMessage.url }}',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE matricula = 'MATRICULA_DO_MOTOBOY_AQUI'
  AND nome = 'NOME_DO_MOTOBOY_AQUI'
  AND solicitacao ILIKE '%peças%'
  AND status_imagem = 'pendente'
ORDER BY created_at DESC
LIMIT 1;

-- Opção 4: Query mais robusta com validações
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = '{{ $(''Webhook'').item.json.body.data.message.imageMessage.url }}',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE matricula = 'MATRICULA_DO_MOTOBOY_AQUI'
  AND solicitacao ILIKE '%peças%'
  AND status_imagem = 'pendente'
  AND url_imagem_pecas IS NULL
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'  -- Apenas solicitações dos últimos 7 dias
ORDER BY created_at DESC
LIMIT 1;

-- Verificar se a atualização foi bem-sucedida
SELECT 
    id,
    nome,
    matricula,
    solicitacao,
    url_imagem_pecas,
    data_recebimento_imagem,
    status_imagem,
    updated_at
FROM solicitacoes_motoboy 
WHERE matricula = 'MATRICULA_DO_MOTOBOY_AQUI'
  AND url_imagem_pecas IS NOT NULL
ORDER BY data_recebimento_imagem DESC
LIMIT 1;

-- Comentário:
-- Substitua 'MATRICULA_DO_MOTOBOY_AQUI' pela matrícula real do motoboy
-- A expressão {{ $('Webhook').item.json.body.data.message.imageMessage.url }} será 
-- substituída automaticamente pelo valor real da URL da imagem quando executada

