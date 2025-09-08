# Configuração do Supabase Realtime

## 🚨 IMPORTANTE: Configurações Necessárias no Supabase

### 1. Habilitar Realtime na Tabela

1. **Acesse o Dashboard do Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login e acesse seu projeto

2. **Navegue para Database > Tables**
   - Clique em "Database" no menu lateral
   - Clique em "Tables"

3. **Configure a Tabela `solicitacoes_motoboy`**
   - Clique no nome da tabela `solicitacoes_motoboy`
   - Vá para a aba "Settings" ou "Configuration"
   - Procure por "Realtime" ou "Real-time"
   - **ATIVE/ENABLE** o Realtime para esta tabela

### 2. Verificar RLS (Row Level Security)

Se você tiver Row Level Security habilitado, pode precisar ajustar as políticas:

```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'solicitacoes_motoboy';

-- Se RLS estiver habilitado, criar política para Realtime
CREATE POLICY "Enable realtime for solicitacoes_motoboy" ON "public"."solicitacoes_motoboy"
FOR ALL USING (true);
```

### 3. Verificar Configurações de Realtime

No Dashboard do Supabase:
1. Vá para **"Settings"** > **"API"**
2. Verifique se o **"Realtime"** está habilitado
3. Anote a **"Realtime URL"** (deve ser algo como `wss://...`)

### 4. Testar a Conexão

Após configurar, você pode testar se está funcionando:

1. Abra o console do navegador (F12)
2. Procure por logs como:
   - `✅ Subscription realtime configurada com sucesso`
   - `📡 Status da subscription: SUBSCRIBED`
   - `🔄 Mudança detectada no Supabase:`

### 5. Troubleshooting

#### Se não funcionar, verifique:

1. **Realtime está habilitado na tabela?**
   - Database > Tables > solicitacoes_motoboy > Settings > Realtime: ON

2. **RLS está bloqueando?**
   - Database > Tables > solicitacoes_motoboy > Settings > RLS: OFF (ou política adequada)

3. **Configurações de API corretas?**
   - Settings > API > Realtime URL está configurada

4. **Logs de erro no console?**
   - Verifique se há erros de conexão WebSocket

### 6. Comandos SQL para Verificar

```sql
-- Verificar se Realtime está habilitado na tabela
SELECT schemaname, tablename, rowsecurity, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime' 
         AND tablename = 'solicitacoes_motoboy'
       ) THEN 'ENABLED' ELSE 'DISABLED' END as realtime_status
FROM pg_tables 
WHERE tablename = 'solicitacoes_motoboy';

-- Verificar publicações Realtime
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### 7. Habilitar Manualmente via SQL (se necessário)

```sql
-- Habilitar Realtime na tabela
ALTER PUBLICATION supabase_realtime ADD TABLE solicitacoes_motoboy;

-- Verificar se foi adicionado
SELECT * FROM pg_publication_tables WHERE tablename = 'solicitacoes_motoboy';
```

## 🔍 Como Verificar se Está Funcionando

1. **No Console do Navegador:**
   - Deve aparecer: `✅ Subscription realtime configurada com sucesso`
   - Status deve ser: `📡 Status da subscription: SUBSCRIBED`

2. **No Header da Aplicação:**
   - Deve mostrar ícone WiFi verde com "Tempo Real"

3. **Teste Prático:**
   - Crie uma nova solicitação
   - Deve aparecer automaticamente na tabela
   - Deve mostrar notificação toast

## 🚨 Problemas Comuns

### "Realtime não está funcionando"
- ✅ Verificar se Realtime está habilitado na tabela
- ✅ Verificar se RLS não está bloqueando
- ✅ Verificar logs de erro no console

### "Conexão WebSocket falha"
- ✅ Verificar se a URL do Supabase está correta
- ✅ Verificar se não há proxy/firewall bloqueando WebSocket
- ✅ Verificar se o projeto Supabase está ativo

### "Dados não atualizam"
- ✅ Verificar se a subscription está ativa
- ✅ Verificar se os eventos estão sendo disparados
- ✅ Verificar se as políticas RLS permitem acesso
