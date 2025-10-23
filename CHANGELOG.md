# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Add secure project secret management:
  - `POST /v1/projects` returns `publicKey` and `plaintextSecret` only once
  - `POST /v1/projects/:id/rotate-secret` returns new `plaintextSecret` only once
  - Store only `secretKey` hash (`sha256`) server-side
- Emit audit events for project lifecycle:
  - `project.created` with payload `{ name, plan }`
  - `project.secret.rotated` with payload `{ publicKey }`
- Update documentation:
  - Root `README.md`: Project Secrets section with endpoints, events, and best practices
  - `docs/frontend/README.md`: Projetos + Eventos de Projeto with WS/Webhooks examples
  - `docs/REST.md` and `docs/API_HEADERS.md` already include examples and headers for project secrets
- Build validation: successful compile after integrating `EventsService` and fixing service class scope

- Swagger: add named `ClientBearer` auth scheme and apply to client controllers
- Environment: document `CLIENT_JWT_SECRET`, `CLIENT_JWT_EXPIRES_IN`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `PUBLIC_URL` in `docs/ENV.md`
- Tests: add `jest.config.js` and unit tests for `ClientAuthService` and `ClientAuthGuard`
- Fixes: resolve TypeScript build errors by typing `_id` in `Tenant`/`TenantUser` schemas and ensuring numeric `expiresIn` in `ClientAuthModule`

- Rate Limit & Redis:
  - Redis-backed counters for tenant/player/IP with lazy client creation
  - Fails-open when Redis is unreachable (allows traffic, logs warning)
  - Document `REDIS_URL` (preferido) e `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
  - Notes on password encoding in URL (`@` -> `%40`)
  - Add `TENANT_RPS_DEFAULT` e `PLAYER_RPS_DEFAULT` guidance in `docs/ENV.md`
- Docs updates:
  - `docs/ENV.md`: seção completa sobre Redis, exemplos e testes
  - `docs/SETUP.md`: passos para configurar Redis e testar 429
  - `README.md`: seção "Rate Limit & Redis" com link para ENV.md
  - `docs/TROUBLESHOOTING.md`: problemas comuns de Redis e soluções

## [0.1.0] - 2024-10-23
- Initial public structure of modules (projects, players, progression, etc.)
- Events pipeline (Mongo, WebSocket, Webhooks) and basic canonical types
- Admin/Client API Keys, Player Auth, and example REST/WS docs

- Player Avatars:
  - Add S3-backed avatar upload for authenticated players (`POST /v1/player/me/avatar`)
  - Public streaming route to serve avatars by short key (`GET /v1/public/avatars/:shortKey`)
  - Replace previous avatar on upload and update `profile.avatarUrl`
- Environment:
  - Document S3 credentials and avatar limits in `docs/ENV.md`
- Swagger:
  - Add multipart/form-data template for avatar upload route
- Modules:
  - New `AvatarsModule` (schema/service/controller) imported into `PlayerAuthModule`
- Build:
  - Integrate `@aws-sdk/client-s3` and `image-size`; configure `multer` memory storage