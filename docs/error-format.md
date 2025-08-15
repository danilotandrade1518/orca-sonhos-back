## Formato Padrão de Erros HTTP

Contrato base:

```
HTTP {status}
{
  "errors": [ { "error": string, "message": string } ],
  "traceId": string
}
```

Regras:
1. `errors` nunca vazio.
2. `traceId` == header `x-request-id`.
3. Removido campo `success`.
4. Campo `error` deriva do nome da classe ou código estável futuro.
5. Mensagens sem dados sensíveis (stack apenas em log).

Status principais:
- 400: validação/domínio
- 403: autenticação/autorização
- 404: não encontrado
- 500: erro inesperado

Futuro: i18n, catálogo de códigos, correlação distribuída.
