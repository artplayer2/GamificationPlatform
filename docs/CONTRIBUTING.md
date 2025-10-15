# Contributing & Commits

- Conventional Commits:
  - `feat(module): ...`
  - `fix(module): ...`
  - `docs(module): ...`
  - `refactor(module): ...`
  - `chore(module): ...`
- DTOs with `class-validator` + Swagger `@ApiProperty` in **English** with examples.
- Always validate `tenantId` and `projectId` early.
- Ensure idempotency on critical ops.
- Every domain action should log an **event** (persist + WS + webhooks).
