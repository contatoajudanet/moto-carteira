# Como usar a API de PDF no n8n

## Endpoint
```
POST https://motoboy-fuel-buddy.vercel.app/api/generate-pdf
```

## Payload JSON
```json
{
  "nome": "João Silva",
  "telefone": "(11) 99999-9999",
  "tipoSolicitacao": "Combustível",
  "valor": 50.00,
  "descricao": "Abastecimento de gasolina",
  "status": "Aprovado pelo supervisor",
  "aprovacaoSup": "aprovado",
  "dataCriacao": "2024-01-15T10:30:00Z"
}
```

## Configuração no n8n

1. **HTTP Request Node**
   - Method: POST
   - URL: `https://motoboy-fuel-buddy.vercel.app/api/generate-pdf`
   - Headers: `Content-Type: application/json`
   - Body: JSON com os dados da solicitação

2. **File Operations Node** (opcional)
   - Salvar o PDF retornado
   - Enviar por email
   - Fazer upload para storage

## Exemplo de Workflow
```
Trigger → Process Data → HTTP Request (PDF) → File Operations → Notification
```

## Campos Obrigatórios
- `nome`: Nome do motoboy
- `telefone`: Telefone de contato
- `tipoSolicitacao`: "Combustível" ou "Vale Peças"

## Campos Opcionais
- `valor`: Valor numérico (para combustível)
- `descricao`: Descrição das peças
- `status`: Status atual da solicitação
- `aprovacaoSup`: "pendente", "aprovado" ou "rejeitado"
- `dataCriacao`: Data de criação (ISO string)

## Teste da API
Para testar se a API está funcionando, você pode usar:

```bash
curl -X POST https://motoboy-fuel-buddy.vercel.app/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "telefone": "(11) 99999-9999",
    "tipoSolicitacao": "Combustível",
    "valor": 25.50,
    "status": "Pendente",
    "aprovacaoSup": "pendente",
    "dataCriacao": "2024-01-15T10:30:00Z"
  }'
```
