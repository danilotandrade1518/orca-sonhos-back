# ADR 0010 - Adoção de Fluxo de Autenticação SPA (Authorization Code + PKCE)

## Status

Accepted (20-08-2025)

## Contexto

O projeto OrçaSonhos necessita oferecer autenticação de usuários para o frontend (SPA) consumindo a API backend. Já possuímos:

- Validador de JWT (`JwtValidator`) com cache de JWKS e tolerância de clock skew.
- Endpoint `/me` para introspecção do usuário autenticado.
- Métricas de autenticação (sucesso/falha) instrumentadas.

As alternativas avaliadas:

1. **Sessão Server-Side (Backend-Managed Auth)**: Backend implementa `/auth/login`, `/auth/callback`, armazena refresh tokens ou sessão (Redis / memória) e fornece cookie `HttpOnly`.
2. **SPA Pública com Authorization Code + PKCE direto contra IdP**: Frontend realiza todo o fluxo OAuth2/OIDC e envia somente `access_token` em cada requisição.
3. **Token Implicit / Hybrid Flow**: Descartado por não ser recomendado para SPAs modernas (risco de exposição de tokens na URL e ausência de PKCE).

Requisitos principais:

- Simplicidade e rapidez para o MVP.
- Segurança adequada (mitigar interceptação de authorization code, minimizar ataque XSS).
- Escalabilidade horizontal do backend sem estado de sessão.

## Decisão

Adotar **Fluxo Authorization Code + PKCE** diretamente no frontend (SPA) com o backend permanecendo **stateless**. O backend apenas valida o `access_token` recebido via header `Authorization: Bearer <token>` e não mantém sessão própria.

## Detalhes da Implementação

- Frontend gera `code_verifier` e `code_challenge (S256)`.
- Redireciona para `/authorize` do IdP (ex: Azure AD B2C) com parâmetros: `response_type=code`, `code_challenge`, `code_challenge_method=S256`, `client_id`, `redirect_uri`, `scope`, `state`.
- Recebe `code` e troca por `access_token` (e opcional `refresh_token`) diretamente via `POST /token` do IdP usando `code_verifier`.
- Armazena tokens somente em memória (evitando `localStorage`) reduzindo impacto de XSS.
- Em cada requisição à API: `Authorization: Bearer <access_token>`.
- Backend valida assinatura, issuer, audience, exp/nbf, `sub` e algoritmo esperado. Usa cache JWKS já existente.
- Logout: SPA limpa tokens em memória e redireciona para endpoint de logout do IdP (se aplicável).

## Justificativa

| Critério                       | SPA + PKCE            | Sessão Backend                                           |
| ------------------------------ | --------------------- | -------------------------------------------------------- |
| Complexidade Inicial           | Baixa                 | Alta (estado, storage, endpoints)                        |
| Escalabilidade                 | Excelente (stateless) | Exige escalonar store de sessão                          |
| Segurança (Interceptação Code) | Protegida via PKCE    | Protegida, porém mais código                             |
| XSS Persistência Tokens        | Mitigável (memória)   | Mitigado via cookies HttpOnly, mas demanda backend extra |
| Time-to-Market                 | Rápido                | Mais lento                                               |

## Consequências

### Positivas

- Menos código e menor superfície de bugs no backend.
- Deploys e escalonamento simplificados.
- Reaproveita infra e código já existente (JwtValidator, métricas, /me).

### Negativas / Trade-offs

- Renovação de tokens é responsabilidade da SPA (silent auth ou refresh rotativo se habilitado no IdP).
- Logout pode não invalidar imediatamente o token já emitido (dependente de exp curto).
- Requer disciplina no frontend para armazenar tokens apenas em memória.

## Riscos e Mitigações

| Risco                                     | Mitigação                                                            |
| ----------------------------------------- | -------------------------------------------------------------------- |
| XSS expõe tokens em memória               | Segregar código, CSP estrita, evitar libs vulneráveis, tokens curtos |
| Falha na renovação causa quedas de sessão | UX clara de reautenticação e silent auth fallback                    |
| Necessidade futura de revogação imediata  | Evoluir para backend-managed exchange (ver Próximos Passos)          |

## Métricas / Observabilidade

- Continuar monitorando contadores de `auth_success`, `auth_fail` e razões categorizadas.
- Futuro: dashboard com taxa de falhas por issuer / audience / motivo.

## Alternativas Futuras (Evolução)

1. Introduzir backend session & refresh para reduzir lógica no frontend (quando suportar multi-cliente ou requisitos de revogação imediata).
2. Implementar cookie `HttpOnly` + `SameSite=Strict` em fluxo de troca server-side.
3. Adicionar serviço de autorização refinada com caching de claims / roles.

## Decisões Relacionadas

- ADR-0007 (Infra inicial com Azure AD B2C e Key Vault).
- Seção 15 em `visao-arquitetural-backend.md` descreve fluxo completo.

## Estado de Implementação

- Backend já pronto (validação JWT + /me + métricas).
- Frontend deve implementar geração PKCE, fluxo OAuth, armazenamento em memória e envio do header Authorization.

## Próximos Passos

1. Documentar no repositório do frontend o utilitário PKCE (code_verifier/challenge, state anti-CSRF).
2. Configurar tempos de expiração de access token curtos (5–15 min) e refresh rotativo (se habilitado) no IdP.
3. Definir métricas adicionais de latência de validação JWT (timer).
4. Planejar evolução para backend-managed se surgirem requisitos de revogação imediata ou múltiplos tipos de client.

---

Decisão adotada para simplificar MVP mantendo boas práticas modernas de segurança para SPAs.
