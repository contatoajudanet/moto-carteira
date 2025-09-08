# Funcionalidade de Motivo de Rejeição

## 🎯 Visão Geral

Implementada funcionalidade para solicitar motivo da rejeição quando uma solicitação é negada, incluindo o motivo na mensagem do webhook enviada ao motoboy.

## 🔧 Componentes Implementados

### 1. **RejectionReasonDialog** (`src/components/RejectionReasonDialog.tsx`)
- Dialog modal para solicitar motivo da rejeição
- Campo de texto com limite de 500 caracteres
- Validação obrigatória do motivo
- Interface intuitiva com botões de cancelar e confirmar

### 2. **Webhook Atualizado** (`src/lib/webhook.ts`)
- Função `generateWebhookMessage()` atualizada para incluir motivo
- Parâmetro `motivoRejeicao` adicionado às funções de webhook
- Mensagem de rejeição modificada para incluir o motivo

### 3. **SolicitationTable Modificada** (`src/components/SolicitationTable.tsx`)
- Fluxo de rejeição alterado para abrir dialog de motivo
- Função `handleRejectionWithReason()` para processar rejeição com motivo
- Integração com dialog de motivo de rejeição

## 📱 Fluxo de Rejeição Atualizado

### **Antes:**
1. Supervisor clica em "Rejeitar" (❌)
2. Solicitação é rejeitada imediatamente
3. Webhook enviado com mensagem genérica

### **Agora:**
1. Supervisor clica em "Rejeitar" (❌)
2. **Dialog de motivo é aberto**
3. Supervisor informa o motivo da rejeição
4. Solicitação é rejeitada com motivo
5. Webhook enviado com motivo específico

## 💬 Mensagens Atualizadas

### **Mensagem de Rejeição - Antes:**
```
❌ SOLICITAÇÃO NEGADA: Olá [NOME], sua solicitação de [TIPO] foi rejeitada pelo supervisor. Entre em contato com a administração para mais informações.
```

### **Mensagem de Rejeição - Agora:**
```
❌ SOLICITAÇÃO NEGADA: Olá [NOME], sua solicitação de [TIPO] foi rejeitada pelo supervisor. Motivo: [MOTIVO_INFORMADO]
```

## 🎨 Interface do Dialog

### **Características:**
- **Título**: "Rejeitar Solicitação" com ícone de alerta
- **Descrição**: Mostra nome do motoboy e tipo de solicitação
- **Campo de texto**: Área para informar o motivo (máximo 500 caracteres)
- **Contador**: Mostra caracteres utilizados (ex: 45/500)
- **Botões**: Cancelar (cinza) e Confirmar Rejeição (vermelho)

### **Validações:**
- ✅ Motivo é obrigatório
- ✅ Máximo de 500 caracteres
- ✅ Botão confirmar desabilitado se campo vazio
- ✅ Loading state durante processamento

## 🔄 Exemplos de Uso

### **Cenário 1: Combustível Rejeitado**
**Motivo informado:** "Documentação incompleta - falta comprovante de residência"

**Mensagem enviada:**
```
❌ SOLICITAÇÃO NEGADA: Olá João Silva, sua solicitação de combustível foi rejeitada pelo supervisor. Motivo: Documentação incompleta - falta comprovante de residência
```

### **Cenário 2: Peça Rejeitada**
**Motivo informado:** "Valor acima do limite permitido para o cargo"

**Mensagem enviada:**
```
❌ SOLICITAÇÃO NEGADA: Olá Maria Santos, sua solicitação de peça foi rejeitada pelo supervisor. Motivo: Valor acima do limite permitido para o cargo
```

## 🛠️ Implementação Técnica

### **Funções Principais:**

1. **`handleRejectionWithReason(reason: string)`**
   - Processa a rejeição com motivo
   - Envia webhook com motivo específico
   - Atualiza status da solicitação
   - Exibe notificação de sucesso/erro

2. **`generateWebhookMessage()`** (atualizada)
   - Gera mensagem incluindo motivo da rejeição
   - Fallback para "Motivo não informado" se vazio
   - Suporte para combustível e peças

3. **`sendWebhookNotification()`** (atualizada)
   - Parâmetro `motivoRejeicao` adicionado
   - Passa motivo para função de geração de mensagem

### **Estados Gerenciados:**
- `rejectionDialogOpen`: Controla visibilidade do dialog
- `solicitationForRejection`: Solicitação sendo rejeitada
- `isSubmitting`: Estado de loading durante processamento

## 🎯 Benefícios

### **Para os Motoboys:**
- 📱 **Transparência**: Sabem exatamente por que foram rejeitados
- 🎯 **Orientação**: Podem corrigir o problema específico
- 😊 **Clareza**: Não precisam entrar em contato para saber o motivo

### **Para os Supervisores:**
- 📝 **Documentação**: Motivos ficam registrados
- 🎯 **Precisão**: Podem ser específicos sobre o problema
- ⚡ **Eficiência**: Processo mais rápido e direto

### **Para a Administração:**
- 📊 **Rastreabilidade**: Histórico de motivos de rejeição
- 🔍 **Análise**: Identificar problemas recorrentes
- 📈 **Melhoria**: Dados para otimizar processos

## 🔍 Monitoramento

### **Logs de Webhook:**
```
📤 Enviando webhook para: [URL]
📤 Payload: { 
  mensagem: "❌ SOLICITAÇÃO NEGADA: Olá João, sua solicitação de combustível foi rejeitada pelo supervisor. Motivo: Documentação incompleta",
  nome: "João Silva",
  motivo_rejeicao: "Documentação incompleta",
  ...
}
✅ Webhook enviado com sucesso: 200
```

### **Notificações Toast:**
- **Sucesso**: "Solicitação rejeitada - Webhook enviado para [NOME] com motivo: [MOTIVO]"
- **Erro**: "Erro na notificação - Falha ao enviar webhook, mas status foi atualizado"

## 🚀 Próximos Passos

1. **Testar** a funcionalidade em ambiente de desenvolvimento
2. **Validar** com usuários finais (supervisores)
3. **Monitorar** feedback dos motoboys sobre as mensagens
4. **Analisar** motivos mais comuns de rejeição
5. **Otimizar** baseado nos dados coletados

## 📋 Checklist de Implementação

- ✅ Dialog de motivo de rejeição criado
- ✅ Webhook atualizado para incluir motivo
- ✅ Fluxo de rejeição modificado
- ✅ Mensagens padronizadas implementadas
- ✅ Validações e tratamento de erros
- ✅ Interface responsiva e intuitiva
- ✅ Logs e monitoramento implementados
