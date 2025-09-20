# Sistema de Recebimento de Imagens para Vale Peças

## 📋 Visão Geral

Este sistema permite que motoboys enviem imagens via WhatsApp quando solicitados para comprovar suas solicitações de Vale Peças. A URL da imagem é automaticamente salva no banco de dados.

## 🗄️ Estrutura do Banco de Dados

### Novos Campos Adicionados:

```sql
-- Campos para armazenar informações da imagem
url_imagem_pecas TEXT                    -- URL da imagem enviada
data_recebimento_imagem TIMESTAMP        -- Quando a imagem foi recebida  
status_imagem TEXT DEFAULT 'pendente'    -- Status: pendente, recebida, processada
```

## 🔄 Fluxo do Sistema

### 1. Solicitação de Vale Peças
- Motoboy cria solicitação de "Vale Peças"
- Sistema dispara webhook com mensagem solicitando imagem
- Status da imagem fica como "pendente"

### 2. Recebimento da Imagem
- Motoboy envia imagem via WhatsApp
- Webhook recebe a URL da imagem
- Sistema atualiza o banco com a URL e marca como "recebida"

### 3. Processamento
- Supervisor pode visualizar a imagem
- Status pode ser alterado para "processada"

## 📤 SQL Query para Salvar URL da Imagem

### Query Principal (Use esta no seu webhook):

```sql
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
```

### Variações do Query:

#### Por ID da Solicitação:
```sql
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = '{{ $(''Webhook'').item.json.body.data.message.imageMessage.url }}',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE id = 'ID_DA_SOLICITACAO_AQUI';
```

#### Por Matrícula e Nome (Mais Seguro):
```sql
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
```

#### Query Robusta com Validações:
```sql
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
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 1;
```

## 🔍 Queries de Consulta

### Buscar Solicitações com Imagem Pendente:
```sql
SELECT 
    id, nome, matricula, placa, solicitacao, valor, descricao_pecas,
    status_imagem, created_at
FROM solicitacoes_motoboy 
WHERE solicitacao ILIKE '%peças%'
  AND status_imagem = 'pendente'
ORDER BY created_at DESC;
```

### Buscar Solicitações com Imagem Recebida:
```sql
SELECT 
    id, nome, matricula, placa, solicitacao, valor, descricao_pecas,
    url_imagem_pecas, data_recebimento_imagem, status_imagem
FROM solicitacoes_motoboy 
WHERE solicitacao ILIKE '%peças%'
  AND status_imagem = 'recebida'
  AND url_imagem_pecas IS NOT NULL
ORDER BY data_recebimento_imagem DESC;
```

### Verificar Imagem de uma Solicitação Específica:
```sql
SELECT 
    id, nome, matricula, solicitacao, url_imagem_pecas,
    data_recebimento_imagem, status_imagem
FROM solicitacoes_motoboy 
WHERE matricula = 'MATRICULA_DO_MOTOBOY_AQUI'
  AND url_imagem_pecas IS NOT NULL
ORDER BY data_recebimento_imagem DESC
LIMIT 1;
```

## 🧪 Teste do Sistema

### 1. Criar Solicitação de Teste:
```sql
INSERT INTO solicitacoes_motoboy (
    data, fone, nome, matricula, placa, solicitacao, valor, 
    descricao_pecas, status, aprovacao, avisado, aprovacao_sup, 
    supervisor_codigo, status_imagem, created_at, updated_at
) VALUES (
    CURRENT_DATE, '554195059996', 'João Silva', 'MOT123', 'ABC-1234',
    'Vale Peças', '200.00', 'Pastilhas de freio + Óleo de motor',
    'Fase de aprovação', 'pendente', true, 'pendente', 'SUP001',
    'pendente', NOW(), NOW()
);
```

### 2. Simular Recebimento de Imagem:
```sql
UPDATE solicitacoes_motoboy 
SET 
    url_imagem_pecas = 'https://example.com/imagem_teste.jpg',
    data_recebimento_imagem = NOW(),
    status_imagem = 'recebida',
    updated_at = NOW()
WHERE matricula = 'MOT123'
  AND status_imagem = 'pendente'
ORDER BY created_at DESC
LIMIT 1;
```

## 📱 Integração com WhatsApp

### Payload do Webhook de Resposta:
```json
{
  "body": {
    "data": {
      "message": {
        "imageMessage": {
          "url": "https://example.com/imagem_recebida.jpg"
        }
      }
    }
  }
}
```

### Expressão para Extrair URL:
```
{{ $('Webhook').item.json.body.data.message.imageMessage.url }}
```

## ⚠️ Considerações Importantes

1. **Segurança**: Sempre valide a matrícula do motoboy antes de salvar
2. **Duplicação**: Use `LIMIT 1` para evitar atualizar múltiplos registros
3. **Validação**: Verifique se a solicitação é realmente de "Vale Peças"
4. **Timestamp**: Use `NOW()` para registrar quando a imagem foi recebida
5. **Status**: Mantenha o controle do status da imagem

## 🔧 Configuração no n8n

1. Configure o webhook para receber respostas do WhatsApp
2. Use a expressão `{{ $('Webhook').item.json.body.data.message.imageMessage.url }}`
3. Execute o SQL UPDATE com a URL extraída
4. Configure validações para garantir que é uma solicitação válida

## 📊 Monitoramento

- Monitore solicitações com `status_imagem = 'pendente'` há muito tempo
- Verifique se as URLs das imagens estão acessíveis
- Acompanhe o tempo entre solicitação e recebimento da imagem

