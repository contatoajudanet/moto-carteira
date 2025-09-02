# 🔧 Guia de Solução de Problemas

## ❌ Erro: "Erro ao atualizar solicitação"

### **Problema:**
- Erro 400 no Supabase ao tentar atualizar solicitações
- Falha ao aprovar/rejeitar solicitações

### **Solução:**

#### 1. **Verificar a Estrutura da Tabela**
Execute no SQL Editor do Supabase:

```sql
-- Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_motoboy'
ORDER BY ordinal_position;
```

#### 2. **Se a Estrutura Estiver Incorreta, Recriar a Tabela:**
```sql
-- Recriar tabela com estrutura correta
DROP TABLE IF EXISTS solicitacoes_motoboy CASCADE;

CREATE TABLE solicitacoes_motoboy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    fone VARCHAR(20),
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) NOT NULL,
    placa VARCHAR(10) NOT NULL,
    solicitacao VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_combustivel DECIMAL(10,2),
    descricao_pecas TEXT,
    status VARCHAR(100) DEFAULT 'Fase de aprovação',
    aprovacao VARCHAR(20) DEFAULT 'pendente' CHECK (aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
    avisado BOOLEAN DEFAULT true,
    aprovacao_sup VARCHAR(20) DEFAULT 'pendente' CHECK (aprovacao_sup IN ('pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **Inserir Dados de Teste:**
```sql
INSERT INTO solicitacoes_motoboy (data, fone, nome, matricula, placa, solicitacao, valor, valor_combustivel, descricao_pecas, status, aprovacao, avisado, aprovacao_sup) VALUES
    ('2024-01-15', '(11) 99999-1111', 'João Silva Santos', 'M001', 'ABC-1234', 'Combustível', 80.00, 80.00, NULL, 'Fase de aprovação', 'pendente', true, 'pendente');
```

## ❌ Erro: "Failed to load resource: 404" no Webhook

### **Problema:**
- Endpoint do webhook não encontrado
- Falha ao enviar notificações

### **Solução:**

#### 1. **Configurar Webhook Válido:**
Edite o arquivo `src/config/webhook.ts`:

```typescript
export const WEBHOOK_CONFIG = {
  // Substitua por uma URL válida
  url: 'https://webhook.site/SUA-URL-AQUI',
  
  // Em desenvolvimento, usar simulação
  simulateInDevelopment: true,
  
  enabled: true,
};
```

#### 2. **Usar Webhook.site para Testes:**
1. Acesse [webhook.site](https://webhook.site)
2. Copie a URL única gerada
3. Cole no arquivo de configuração

#### 3. **Desabilitar Webhook Temporariamente:**
```typescript
export const WEBHOOK_CONFIG = {
  url: 'https://webhook.site/your-url',
  enabled: false, // Desabilitar temporariamente
  simulateInDevelopment: true,
};
```

## 🔍 **Verificação de Logs:**

### **Console do Navegador:**
- Abra DevTools (F12)
- Vá para Console
- Procure por mensagens de erro ou sucesso

### **Logs Esperados:**
```
📝 Dados para atualização: {id: "...", updateData: {...}}
✅ Solicitação atualizada com sucesso: [...]
📤 Webhook simulado enviado: {...}
```

## 🚀 **Teste de Funcionamento:**

### **1. Testar Atualização Simples:**
```sql
UPDATE solicitacoes_motoboy 
SET aprovacao_sup = 'aprovado'
WHERE id = 'ID-DA-SOLICITACAO';
```

### **2. Verificar Dados:**
```sql
SELECT * FROM solicitacoes_motoboy 
WHERE aprovacao_sup = 'aprovado';
```

## 📞 **Se o Problema Persistir:**

1. **Verificar permissões** da tabela no Supabase
2. **Confirmar RLS (Row Level Security)** está configurado corretamente
3. **Verificar políticas de acesso** da tabela
4. **Testar com usuário admin** do Supabase

## 🔧 **Configuração RLS (Se Necessário):**

```sql
-- Habilitar RLS
ALTER TABLE solicitacoes_motoboy ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (apenas para desenvolvimento)
CREATE POLICY "Allow all operations" ON solicitacoes_motoboy
    FOR ALL USING (true);
```
