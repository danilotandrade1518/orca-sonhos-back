# Azure AD B2C – Setup e Integração com OrçaSonhos

Este guia descreve como configurar o Microsoft Entra ID B2C (Azure AD B2C) para autenticar a SPA do OrçaSonhos e proteger a API.

Recomendação: separe app registrations por ambiente e por papel (SPA vs API).

- SPA (dev): `orcasonhos-spa-dev`
- SPA (prod): `orcasonhos-spa-prod` (ou `orcasonhos-prod-app` se já existir)
- API (resource): `orcasonhos-api`

## 1) Criar/validar o App da API (resource)

1. Crie um registro de aplicativo chamado `orcasonhos-api` (tipo: accounts in any identity provider… B2C tenant).
2. Em "Expose an API":
   - Defina a Application ID URI (ex.: `api://<APP_ID_GUID>`). O portal pode sugerir `api://<clientId>`.
   - Adicione scopes, por exemplo:
     - `Access.Read` – Consumo de rotas GET
     - `Access.Write` – Consumo de rotas de mutação
     - `Access.ReadWrite` – Agregador se preferir simplificar o frontend
3. Em "Token configuration": inclua `email` (opcional) e mantenha `sub` como identificador principal.

Anote:

- `CLIENT_ID` da API (GUID)
- `Application ID URI` (ex.: `api://<GUID>`) – isso costuma ser o valor para `aud` do access token. Em alguns cenários o `aud` será o próprio `CLIENT_ID` GUID; confira o payload do token emitido.

## 2) Criar/validar o App da SPA (cliente)

1. Crie o app `orcasonhos-spa-dev` (e outro para prod).
2. Em "Authentication":
   - Plataforma: Single-page application (SPA)
   - Redirect URIs (dev): `http://localhost:5173/auth/callback`
   - Logout URL (dev): `http://localhost:5173/`
   - Marque Authorization Code Flow com **PKCE** (Implicit OFF)
3. Em "API permissions":
   - Adicione permissões delegadas para os scopes expostos por `orcasonhos-api` (ex.: `Access.ReadWrite`).

Anote:

- `CLIENT_ID` da SPA (GUID) – usado no frontend (MSAL/OIDC), não no backend.

## 3) User flows (policies)

Crie (ou confirme) um fluxo B2C, por ex.: `B2C_1_signupsignin`.

- Configure identity providers (e-mail local, Google, etc.).
- Em "Application claims": inclua `email`, `given_name` (opcional).

A URL base do AUTHORITY é:

```
https://<TENANT_SHORT>.b2clogin.com/<TENANT_NAME>.onmicrosoft.com
```

O AUTHORITY completo no frontend deve incluir a policy:

```
https://<TENANT_SHORT>.b2clogin.com/<TENANT_NAME>.onmicrosoft.com/<POLICY_ID>
```

## 4) Descobrir JWKS/Issuer para configurar o backend

Cada policy expõe um documento `.well-known` OIDC específico. Exemplo:

```
https://<TENANT_SHORT>.b2clogin.com/<TENANT_NAME>.onmicrosoft.com/<POLICY_ID>/v2.0/.well-known/openid-configuration
```

Do JSON retornado, copie:

- `issuer` → `AUTH_ISSUER`
- `jwks_uri` → `AUTH_JWKS_URI`
- Para `AUTH_AUDIENCE`, use o valor que o access token emitido usa no claim `aud`. Em geral:
  - `api://<CLIENT_ID_API>` (se você setou Application ID URI assim)
  - ou o próprio GUID do app da API

## 5) Variáveis de ambiente do backend

Preencha `.env` usando os valores acima:

```
AUTH_REQUIRED=true
AUTH_JWKS_URI=<jwks_uri da policy>
AUTH_ISSUER=<issuer da policy>
AUTH_AUDIENCE=<aud esperado nos tokens (api://... ou GUID)>
AUTH_USER_ID_CLAIM=sub
```

## 6) CORS

Habilite CORS apenas para as origens necessárias:

```
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:5173,https://app.seudominio.com
```

## 7) Teste de ponta a ponta

- Faça login na SPA (MSAL/OIDC) e obtenha um access token para o recurso `orcasonhos-api` com o(s) scope(s) definidos.
- Chame a API com `Authorization: Bearer <token>`.
- Use o endpoint `/me` para validar o usuário decodificado.

## 8) Boas práticas adicionais

- Access tokens curtos (5–15 min) e refresh tokens com rotação.
- Armazenar tokens da SPA somente em memória (evite localStorage).
- Monitorar métricas `auth_success`/`auth_fail` (já expostas pela API).
- Ter registros separados por ambiente para SPA e API (dev/prod) evita mistura de URLs.

## 9) Problemas comuns

- 401/403 por `Issuer mismatch` → `AUTH_ISSUER` não bate com a policy usada no login.
- 401 por `Audience mismatch` → `AUTH_AUDIENCE` diferente do `aud` do token. Ajuste para o valor real.
- 401 `JWKS key not found` → token assinado por outro policy/issuer; valide o `.well-known` correto ou aguarde propagação de chaves.

---

Com isso, a autenticação no backend funcionará 100% alinhada ao fluxo de SPA + PKCE e às melhores práticas do B2C.
