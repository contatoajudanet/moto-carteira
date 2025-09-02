# Motoboy Fuel Buddy

Sistema de gerenciamento de solicitações de combustível e vale peças para motoboys.

## 🚀 Funcionalidades

- ✅ Cadastro de solicitações de combustível e vale peças
- ✅ Campo específico para valor de combustível
- ✅ Descrição detalhada para peças
- ✅ Status personalizável (campo de texto livre)
- ✅ Campo "Avisado" fixo como true para todas as solicitações
- ✅ Aprovação supervisora com toggle visual (verde/vermelho/neutro)
- ✅ **Webhook automático** para notificações de aprovação/rejeição
- ✅ Integração completa com Supabase
- ✅ Interface responsiva e moderna

## 🔔 **Sistema de Notificações Automáticas**

O sistema dispara automaticamente webhooks para o endpoint configurado sempre que uma solicitação é aprovada ou rejeitada pelo supervisor.

### **Webhook Endpoint:**
```
https://evo-youtube-n8n.3sbind.easypanel.host/webhook-test/3ea5325b-9c68-4fcb-9b75-8d3301f1a896
```

### **Payload Enviado:**
```json
{
  "mensagem": "✅ AUTORIZADO! Olá João, sua solicitação de Combustível no valor de R$ 80.00 foi APROVADA pelo supervisor. Você pode retirar o vale ou realizar a compra.",
  "nome": "João Silva Santos",
  "telefone": "(11) 99999-1111",
  "aprovacao_sup": "aprovado"
}
```

### **Mensagens Automáticas:**
- **✅ APROVADO**: Informa que o motoboy pode retirar o vale/realizar compra
- **❌ REJEITADO**: Informa que foi negado e deve entrar em contato
- **⏳ PENDENTE**: Não dispara webhook (apenas mudança de status)

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Estado**: React Hooks
- **Formulários**: React Hook Form + Zod

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd motoboy-fuel-buddy
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Supabase**
   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute o script SQL em `database_schema.sql` no SQL Editor do Supabase
   - Copie as credenciais do projeto

4. **Configure as variáveis de ambiente**
   Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

5. **Execute o projeto**
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

O sistema cria automaticamente as seguintes tabelas no Supabase:

- **`solicitacoes_motoboy`** - Tabela principal de solicitações
- **`usuarios_motoboy`** - Usuários do sistema
- **`motoboys_motoboy`** - Cadastro de motoboys
- **`historico_aprovacoes_motoboy`** - Histórico de alterações
- **`configuracoes_motoboy`** - Configurações do sistema
- **`tipos_solicitacao_motoboy`** - Tipos de solicitação

## 📱 Como Usar

### Criar Nova Solicitação
1. Clique em "Nova Solicitação"
2. Preencha os dados obrigatórios
3. Para solicitações de combustível, adicione o valor específico
4. Para vale peças, descreva as peças necessárias
5. Defina o status personalizado
6. Salve a solicitação

### Gerenciar Solicitações
- Use os filtros para visualizar solicitações por status
- Altere o status de aprovação usando o dropdown
- Use o toggle de aprovação supervisora (verde = aprovado, cinza = pendente)
- O campo "Avisado" é automaticamente definido como true

## 🔐 Configurações de Segurança

- Todas as tabelas terminam com `_motoboy` para evitar conflitos
- Triggers automáticos para auditoria de alterações
- Índices otimizados para performance
- Validações de dados no nível do banco

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Deploy no Vercel/Netlify
1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o Supabase está configurado corretamente
2. Confirme se as tabelas foram criadas
3. Verifique as variáveis de ambiente
4. Abra uma issue no repositório

## 🔄 Atualizações

- **v1.0.0**: Sistema base com integração Supabase
- **v1.1.0**: Campos específicos para combustível e peças
- **v1.2.0**: Status personalizável e aprovação supervisora visual

## 📄 Licença

Este projeto está sob a licença MIT.
