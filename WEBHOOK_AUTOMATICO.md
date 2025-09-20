# Sistema de Webhook Automático para Novas Solicitações

## 📋 Resumo

O sistema foi configurado para disparar automaticamente um webhook sempre que uma nova solicitação for criada no banco de dados. O webhook é enviado para a URL configurada com todos os dados da solicitação.

## 🔧 Configuração

### URL do Webhook
- **URL**: `https://evo-youtube-n8n.3sbind.easypanel.host/webhook-test/7db9b091-45bd-4af6-bdd8-67b65aab2578`
- **Arquivo de configuração**: `src/config/webhook.ts`

### Configurações disponíveis:
```typescript
export const WEBHOOK_CONFIG = {
  url: 'https://evo-youtube-n8n.3sbind.easypanel.host/webhook-test/7db9b091-45bd-4af6-bdd8-67b65aab2578',
  enabled: true,                    // Habilita/desabilita o webhook
  simulateInDevelopment: false,     // Simula em desenvolvimento
  timeout: 10000,                   // Timeout em ms (10 segundos)
  retry: 3                          // Número de tentativas
};
```

## 🚀 Como Funciona

### 1. Criação de Solicitação
Quando uma nova solicitação é criada através de:
- Interface web (Dashboard)
- API direta
- Inserção manual no banco

### 2. Disparo Automático
O sistema automaticamente:
1. Cria a solicitação no banco de dados
2. Dispara o webhook com os dados da solicitação
3. Registra logs de sucesso/erro

### 3. Dados Enviados
O webhook envia um payload JSON com:
```json
{
  "mensagem": "🆕 NOVA SOLICITAÇÃO: Motoboy João Silva (Matrícula: MOT001) criou uma nova solicitação de vale combustível. Status: Fase de aprovação. Valor: R$ 50,00",
  "evento": "nova_solicitacao",
  "dados": {
    "id": "uuid-da-solicitacao",
    "nome": "João Silva",
    "telefone": "11999999999",
    "matricula": "MOT001",
    "placa": "ABC-1234",
    "tipo_solicitacao": "Vale Combustível",
    "valor": "50.00",
    "valor_combustivel": 50.00,
    "descricao_pecas": null,
    "status": "Fase de aprovação",
    "aprovacao_sup": "pendente",
    "data_criacao": "2024-01-15T10:30:00.000Z",
    "supervisor_codigo": "1234",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 📁 Arquivos Modificados

### 1. `src/config/webhook.ts`
- Atualizada a URL do webhook

### 2. `src/lib/webhook.ts`
- Adicionada função `sendNewSolicitationWebhook()`
- Função específica para webhook de nova solicitação

### 3. `src/hooks/use-supabase.ts`
- Modificada função `createSolicitation()`
- Adicionado disparo automático do webhook

### 4. `src/hooks/use-realtime-solicitations.ts`
- Modificada função `createSolicitation()`
- Adicionado disparo automático do webhook

## 🧪 Teste

### SQL de Simulação
Execute o arquivo `simulacao_nova_solicitacao.sql` no SQL Editor do Supabase:

```sql
-- Inserir uma nova solicitação de combustível
INSERT INTO solicitacoes_motoboy (
    data, fone, nome, matricula, placa, solicitacao, valor, 
    valor_combustivel, status, aprovacao, avisado, aprovacao_sup, 
    supervisor_codigo, created_at, updated_at
) VALUES (
    NOW()::text, '11999999999', 'João Silva', 'MOT001', 'ABC-1234',
    'Vale Combustível', '50.00', 50.00, 'Fase de aprovação',
    'pendente', true, 'pendente', '1234', NOW(), NOW()
);
```

### Verificação
1. Execute o SQL no Supabase
2. Verifique os logs do console do navegador
3. Confirme que o webhook foi enviado para a URL configurada

## 🔍 Logs e Monitoramento

### Console do Navegador
```
📤 Enviando webhook de nova solicitação para: https://evo-youtube-n8n.3sbind.easypanel.host/webhook-test/7db9b091-45bd-4af6-bdd8-67b65aab2578
📤 Payload: {mensagem: "...", evento: "nova_solicitacao", dados: {...}}
✅ Webhook de nova solicitação enviado com sucesso: 200
```

### Tratamento de Erros
- Se o webhook falhar, a criação da solicitação não é afetada
- Erros são logados no console
- Sistema continua funcionando normalmente

## ⚙️ Configurações Avançadas

### Desabilitar Webhook
```typescript
// Em src/config/webhook.ts
export const WEBHOOK_CONFIG = {
  // ... outras configurações
  enabled: false, // Desabilita o webhook
};
```

### Alterar URL
```typescript
// Em src/config/webhook.ts
export const WEBHOOK_CONFIG = {
  url: 'https://sua-nova-url.com/webhook',
  // ... outras configurações
};
```

### Timeout e Retry
```typescript
// Em src/config/webhook.ts
export const WEBHOOK_CONFIG = {
  // ... outras configurações
  timeout: 15000,  // 15 segundos
  retry: 5,        // 5 tentativas
};
```

## 🚨 Importante

1. **Não falha a criação**: Se o webhook falhar, a solicitação ainda é criada
2. **Logs detalhados**: Todos os envios são logados no console
3. **Configurável**: Pode ser habilitado/desabilitado facilmente
4. **Timeout**: Evita travamentos com timeout de 10 segundos
5. **Retry**: Sistema tenta reenviar em caso de falha

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme se a URL do webhook está acessível
3. Teste com o SQL de simulação
4. Verifique as configurações em `src/config/webhook.ts`
