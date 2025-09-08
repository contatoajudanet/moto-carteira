# Informações do Supervisor no Webhook

## 🎯 Visão Geral

Implementada funcionalidade para incluir nome e código do supervisor na mensagem de rejeição de combustível, proporcionando maior transparência e rastreabilidade.

## 🔧 Mudanças Implementadas

### 1. **Webhook Atualizado** (`src/lib/webhook.ts`)
- Parâmetro `supervisor` adicionado à função `sendWebhookNotification()`
- Função `generateWebhookMessage()` atualizada para incluir dados do supervisor
- Lógica específica para combustível vs peças

### 2. **SolicitationTable Modificada** (`src/components/SolicitationTable.tsx`)
- Passa dados do supervisor ao chamar webhook de rejeição
- Verifica se supervisor existe antes de enviar dados

## 📱 Mensagens Atualizadas

### **Combustível Rejeitado - Antes:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor. Motivo: Documentação incompleta
```

### **Combustível Rejeitado - Agora:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor Carlos Santos (Código: 1234). Motivo: Documentação incompleta
```

### **Peças Rejeitadas - Mantido:**
```
❌ SOLICITAÇÃO NEGADA: Olá Maria Santos, sua solicitação de peça foi rejeitada pelo supervisor. Motivo: Valor acima do limite
```

## 🎯 Lógica de Implementação

### **Para Combustível:**
- ✅ Inclui nome e código do supervisor
- ✅ Formato: "pelo supervisor [NOME] (Código: [CODIGO])"
- ✅ Fallback para "pelo supervisor" se dados não disponíveis

### **Para Peças:**
- ✅ Mantém mensagem simples
- ✅ Apenas "pelo supervisor" (sem nome/código)
- ✅ Foco no motivo da rejeição

## 🔄 Exemplos de Uso

### **Cenário 1: Combustível com Supervisor**
**Dados:**
- Motoboy: João Silva
- Supervisor: Carlos Santos (Código: 1234)
- Motivo: "Documentação incompleta"

**Mensagem:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor Carlos Santos (Código: 1234). Motivo: Documentação incompleta
```

### **Cenário 2: Combustível sem Supervisor**
**Dados:**
- Motoboy: João Silva
- Supervisor: Não informado
- Motivo: "Valor acima do limite"

**Mensagem:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor. Motivo: Valor acima do limite
```

### **Cenário 3: Peça Rejeitada**
**Dados:**
- Motoboy: Maria Santos
- Motivo: "Peça não disponível"

**Mensagem:**
```
❌ SOLICITAÇÃO NEGADA: Olá Maria Santos, sua solicitação de peça foi rejeitada pelo supervisor. Motivo: Peça não disponível
```

## 🛠️ Implementação Técnica

### **Função `generateWebhookMessage()` Atualizada:**
```typescript
function generateWebhookMessage(
  nome: string,
  aprovacaoSup: string,
  tipoSolicitacao: string,
  detalhes?: {
    valorPeca?: number;
    lojaAutorizada?: string;
    valorCombustivel?: number;
    motivoRejeicao?: string;
    supervisor?: { nome: string; codigo: string }; // NOVO
  }
): string
```

### **Lógica de Combustível:**
```typescript
if (tipoSolicitacao.toLowerCase().includes('combustível') || 
    tipoSolicitacao.toLowerCase().includes('combustivel')) {
  const supervisorInfo = detalhes?.supervisor 
    ? ` pelo supervisor ${detalhes.supervisor.nome} (Código: ${detalhes.supervisor.codigo})`
    : ' pelo supervisor';
  return `❌ SOLICITAÇÃO NEGADA: Olá ${nome}, sua solicitação de ${tipoSolicitacao.toLowerCase()} foi rejeitada${supervisorInfo}. Motivo: ${motivo}`;
}
```

### **Chamada do Webhook:**
```typescript
webhookSuccess = await sendWebhookNotification(
  solicitationForRejection.nome,
  solicitationForRejection.fone || 'Não informado',
  'rejeitado',
  solicitationForRejection.solicitacao,
  parseFloat(solicitationForRejection.valor || '0'),
  undefined,
  reason,
  solicitationForRejection.supervisor ? {
    nome: solicitationForRejection.supervisor.nome,
    codigo: solicitationForRejection.supervisor.codigo
  } : undefined // NOVO PARÂMETRO
);
```

## 🎯 Benefícios

### **Para os Motoboys:**
- 📱 **Transparência**: Sabem exatamente qual supervisor rejeitou
- 🎯 **Rastreabilidade**: Podem identificar o responsável
- 📞 **Comunicação**: Podem entrar em contato com o supervisor específico

### **Para os Supervisores:**
- 📝 **Responsabilidade**: Ficam identificados nas rejeições
- 🎯 **Prestação de contas**: Motoboys sabem quem rejeitou
- ⚡ **Eficiência**: Comunicação direta com motoboys

### **Para a Administração:**
- 📊 **Auditoria**: Rastreamento completo de rejeições
- 🔍 **Análise**: Identificar padrões por supervisor
- 📈 **Gestão**: Monitorar performance dos supervisores

## 🔍 Monitoramento

### **Logs de Webhook:**
```
📤 Enviando webhook para: [URL]
📤 Payload: { 
  mensagem: "❌ SOLICITAÇÃO NEGADA: Olá João, sua solicitação de combustível foi rejeitada pelo supervisor Carlos Santos (Código: 1234). Motivo: Documentação incompleta",
  nome: "João Silva",
  supervisor_nome: "Carlos Santos",
  supervisor_codigo: "1234",
  motivo_rejeicao: "Documentação incompleta",
  ...
}
✅ Webhook enviado com sucesso: 200
```

### **Estrutura do Payload Atualizada:**
```json
{
  "mensagem": "❌ SOLICITAÇÃO NEGADA: Olá João, sua solicitação de combustível foi rejeitada pelo supervisor Carlos Santos (Código: 1234). Motivo: Documentação incompleta",
  "nome": "João Silva",
  "telefone": "11999999999",
  "aprovacao_sup": "rejeitado",
  "tipo_solicitacao": "Combustível",
  "valor": 50.00,
  "motivo_rejeicao": "Documentação incompleta",
  "supervisor_nome": "Carlos Santos",
  "supervisor_codigo": "1234",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pdf_url": null
}
```

## 🚀 Próximos Passos

1. **Testar** a funcionalidade com diferentes cenários
2. **Validar** se os dados do supervisor estão sendo passados corretamente
3. **Monitorar** feedback dos motoboys sobre a identificação do supervisor
4. **Analisar** se há necessidade de incluir supervisor também para peças
5. **Otimizar** baseado no feedback dos usuários

## 📋 Checklist de Implementação

- ✅ Parâmetro supervisor adicionado ao webhook
- ✅ Função generateWebhookMessage atualizada
- ✅ Lógica específica para combustível implementada
- ✅ Dados do supervisor passados na SolicitationTable
- ✅ Fallback para casos sem supervisor
- ✅ Mensagens diferenciadas para combustível vs peças
- ✅ Logs e monitoramento atualizados
