# Modal de Rejeição com Dados do Supervisor

## 🎯 Visão Geral

Implementada funcionalidade para solicitar nome e código do supervisor no modal de rejeição, já que o sistema não possui login/sessão para identificar automaticamente quem está rejeitando a solicitação.

## 🔧 Mudanças Implementadas

### 1. **RejectionReasonDialog Atualizado** (`src/components/RejectionReasonDialog.tsx`)
- Campos adicionados para nome e código do supervisor
- Validação obrigatória dos três campos (motivo, nome, código)
- Interface responsiva com layout em grid

### 2. **SolicitationTable Modificada** (`src/components/SolicitationTable.tsx`)
- Função `handleRejectionWithReason` atualizada para receber dados do supervisor
- Lógica diferenciada para combustível (com supervisor) vs peças (sem supervisor)
- Passa dados do supervisor para o webhook

## 📱 Interface do Modal

### **Layout Atualizado:**
```
┌─────────────────────────────────────┐
│ Rejeitar Solicitação               │
├─────────────────────────────────────┤
│ Nome do Supervisor *    Código *    │
│ [Carlos Santos    ]    [1234    ]   │
├─────────────────────────────────────┤
│ Motivo da Rejeição *                │
│ [Documentação incompleta...     ]   │
│ [                                 ]   │
│ [                                 ]   │
│ 45/500 caracteres                   │
├─────────────────────────────────────┤
│ [Cancelar]    [Confirmar Rejeição]  │
└─────────────────────────────────────┘
```

### **Campos Obrigatórios:**
- ✅ **Nome do Supervisor** (máximo 100 caracteres)
- ✅ **Código do Supervisor** (máximo 20 caracteres)
- ✅ **Motivo da Rejeição** (máximo 500 caracteres)

## 🔄 Fluxo Atualizado

### **Para Combustível:**
1. Supervisor clica em "Rejeitar" (❌)
2. **Modal abre** com campos:
   - Nome do Supervisor
   - Código do Supervisor
   - Motivo da Rejeição
3. Supervisor preenche todos os campos
4. Sistema envia webhook com dados do supervisor
5. Mensagem inclui nome e código do supervisor

### **Para Peças:**
1. Supervisor clica em "Rejeitar" (❌)
2. **Modal abre** com campos:
   - Nome do Supervisor
   - Código do Supervisor
   - Motivo da Rejeição
3. Supervisor preenche todos os campos
4. Sistema envia webhook (sem dados do supervisor na mensagem)
5. Mensagem simples sem identificação do supervisor

## 💬 Mensagens Resultantes

### **Combustível Rejeitado:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor Carlos Santos (Código: 1234). Motivo: Documentação incompleta
```

### **Peça Rejeitada:**
```
❌ SOLICITAÇÃO NEGADA: Olá Maria Santos, sua solicitação de peça foi rejeitada pelo supervisor. Motivo: Valor acima do limite
```

## 🛠️ Implementação Técnica

### **Interface Atualizada:**
```typescript
interface RejectionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { 
    reason: string; 
    supervisorName: string; 
    supervisorCode: string 
  }) => void;
  motoboyName: string;
  solicitationType: string;
}
```

### **Estados Gerenciados:**
```typescript
const [reason, setReason] = useState('');
const [supervisorName, setSupervisorName] = useState('');
const [supervisorCode, setSupervisorCode] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
```

### **Validação:**
```typescript
const handleConfirm = async () => {
  if (!reason.trim() || !supervisorName.trim() || !supervisorCode.trim()) {
    return; // Todos os campos são obrigatórios
  }
  // ... resto da lógica
};
```

### **Chamada do Webhook:**
```typescript
// Para combustível
webhookSuccess = await sendWebhookNotification(
  solicitationForRejection.nome,
  solicitationForRejection.fone || 'Não informado',
  'rejeitado',
  solicitationForRejection.solicitacao,
  parseFloat(solicitationForRejection.valor || '0'),
  undefined,
  data.reason,
  {
    nome: data.supervisorName,
    codigo: data.supervisorCode
  }
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

## 🔍 Validações Implementadas

### **Campos Obrigatórios:**
- ✅ Nome do supervisor não pode estar vazio
- ✅ Código do supervisor não pode estar vazio
- ✅ Motivo da rejeição não pode estar vazio

### **Limites de Caracteres:**
- ✅ Nome: máximo 100 caracteres
- ✅ Código: máximo 20 caracteres
- ✅ Motivo: máximo 500 caracteres

### **Botão de Confirmação:**
- ✅ Desabilitado se qualquer campo estiver vazio
- ✅ Loading state durante processamento
- ✅ Validação em tempo real

## 📱 Exemplos de Uso

### **Cenário 1: Combustível Rejeitado**
**Dados informados:**
- Nome: "Carlos Santos"
- Código: "1234"
- Motivo: "Documentação incompleta - falta comprovante de residência"

**Mensagem enviada:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor Carlos Santos (Código: 1234). Motivo: Documentação incompleta - falta comprovante de residência
```

### **Cenário 2: Peça Rejeitada**
**Dados informados:**
- Nome: "Maria Oliveira"
- Código: "5678"
- Motivo: "Valor acima do limite permitido"

**Mensagem enviada:**
```
❌ SOLICITAÇÃO NEGADA: Olá Pedro Costa, sua solicitação de peça foi rejeitada pelo supervisor. Motivo: Valor acima do limite permitido
```

## 🚀 Próximos Passos

1. **Testar** a funcionalidade em ambiente de desenvolvimento
2. **Validar** com usuários finais (supervisores)
3. **Monitorar** feedback dos motoboys sobre a identificação do supervisor
4. **Analisar** se há necessidade de incluir supervisor também para peças
5. **Otimizar** baseado no feedback dos usuários

## 📋 Checklist de Implementação

- ✅ Campos de supervisor adicionados ao modal
- ✅ Validação obrigatória implementada
- ✅ Interface responsiva criada
- ✅ Lógica diferenciada para combustível vs peças
- ✅ Webhook atualizado para receber dados do supervisor
- ✅ Mensagens personalizadas implementadas
- ✅ Estados de loading e validação funcionando
- ✅ Limpeza de campos após confirmação
