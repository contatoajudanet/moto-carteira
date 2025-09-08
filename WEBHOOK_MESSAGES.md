# Mensagens Padronizadas do Webhook

## 📋 Visão Geral

As mensagens do webhook foram padronizadas para garantir consistência e clareza nas comunicações com os motoboys, especialmente para casos de rejeição.

## 🔧 Mensagens Implementadas

### ✅ **APROVAÇÃO - Combustível**
```
✅ AUTORIZADO: Motoboy [NOME] está autorizado a retirar [TIPO_SOLICITACAO].
```

### ✅ **APROVAÇÃO - Peças**
```
🔧 AUTORIZADO! Olá [NOME], sua solicitação de peça foi APROVADA pelo supervisor. Você pode retirar a peça na loja [LOJA] no valor de R$ [VALOR].
```

### ❌ **REJEIÇÃO - Padrão (Combustível e Peças)**
```
❌ SOLICITAÇÃO NEGADA: Olá [NOME], sua solicitação de [TIPO_SOLICITACAO] foi rejeitada pelo supervisor. Entre em contato com a administração para mais informações.
```

## 🎯 Características das Mensagens

### **Mensagens de Aprovação:**
- **Combustível**: Direta e objetiva
- **Peças**: Inclui detalhes específicos (loja, valor)
- **Tom**: Positivo e informativo

### **Mensagens de Rejeição:**
- **Padronizadas**: Mesma estrutura para ambos os tipos
- **Educadas**: Uso de "Olá [NOME]"
- **Informativa**: Explica que foi rejeitada pelo supervisor
- **Orientativa**: Indica para entrar em contato com a administração
- **Tom**: Respeitoso e profissional

## 🔄 Função Centralizada

### `generateWebhookMessage()`
```typescript
function generateWebhookMessage(
  nome: string,
  aprovacaoSup: string,
  tipoSolicitacao: string,
  detalhes?: {
    valorPeca?: number;
    lojaAutorizada?: string;
    valorCombustivel?: number;
  }
): string
```

**Benefícios:**
- ✅ Consistência nas mensagens
- ✅ Fácil manutenção
- ✅ Reutilização de código
- ✅ Padronização automática

## 📱 Exemplos de Uso

### **Cenário 1: Combustível Aprovado**
```
✅ AUTORIZADO: Motoboy João Silva está autorizado a retirar combustível.
```

### **Cenário 2: Combustível Rejeitado**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor. Entre em contato com a administração para mais informações.
```

### **Cenário 3: Peça Aprovada**
```
🔧 AUTORIZADO! Olá Maria Santos, sua solicitação de peça foi APROVADA pelo supervisor. Você pode retirar a peça na loja Auto Peças Central no valor de R$ 150,00.
```

### **Cenário 4: Peça Rejeitada**
```
❌ SOLICITAÇÃO NEGADA: Olá Maria Santos, sua solicitação de peça foi rejeitada pelo supervisor. Entre em contato com a administração para mais informações.
```

## 🎨 Elementos Visuais

### **Emojis Utilizados:**
- ✅ **Verde**: Aprovação de combustível
- 🔧 **Laranja**: Aprovação de peças
- ❌ **Vermelho**: Rejeição (ambos os tipos)

### **Formatação:**
- **Negrito**: Para palavras-chave importantes
- **Pontuação**: Consistente e profissional
- **Quebras de linha**: Para melhor legibilidade

## 🔧 Implementação Técnica

### **Arquivo:** `src/lib/webhook.ts`

### **Funções Atualizadas:**
1. `sendWebhookNotification()` - Para combustível
2. `sendPecasWebhookNotification()` - Para peças
3. `generateWebhookMessage()` - Função centralizada (NOVA)

### **Mudanças Principais:**
- ✅ Mensagens de rejeição padronizadas
- ✅ Função centralizada para geração de mensagens
- ✅ Consistência entre tipos de solicitação
- ✅ Tom mais profissional e respeitoso

## 🚀 Benefícios

### **Para os Motoboys:**
- 📱 Mensagens claras e consistentes
- 🎯 Informações específicas quando aprovado
- 📞 Orientação clara quando rejeitado
- 😊 Tom respeitoso e profissional

### **Para a Administração:**
- 🔧 Fácil manutenção das mensagens
- 📊 Consistência na comunicação
- 🎨 Padronização visual
- ⚡ Reutilização de código

## 🔍 Monitoramento

### **Logs de Webhook:**
```
📤 Enviando webhook para: [URL]
📤 Payload: { mensagem: "...", nome: "...", ... }
✅ Webhook enviado com sucesso: 200
```

### **Estrutura do Payload:**
```json
{
  "mensagem": "❌ SOLICITAÇÃO NEGADA: Olá João, sua solicitação de combustível foi rejeitada pelo supervisor. Entre em contato com a administração para mais informações.",
  "nome": "João Silva",
  "telefone": "11999999999",
  "aprovacao_sup": "rejeitado",
  "tipo_solicitacao": "Combustível",
  "valor": 50.00,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pdf_url": null
}
```

## 🎯 Próximos Passos

1. **Testar** as novas mensagens em ambiente de desenvolvimento
2. **Validar** com usuários finais
3. **Monitorar** feedback dos motoboys
4. **Ajustar** se necessário baseado no feedback
