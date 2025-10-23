# Player Authentication & Profile

This document covers player registration, password login, and profile management for `/v1/player/*` routes. These endpoints use Bearer JWTs and do not require `x-tenant-id` when a valid token is present (tenant/project are derived from the token).

## Register
`POST /v1/player/auth/register`

Registers a player by `projectId` using `username` or `email` + `password`. Optional `profile` fields can be included.

Request:
```json
{
  "projectId": "<PROJECT_ID>",
  "username": "the_wizard_77",
  "email": "wizard@example.com",
  "password": "Str0ngPass!",
  "profile": { "displayName": "The Wizard", "country": "BR" }
}
```

Response:
```json
{
  "player": { "id": "...", "username": "the_wizard_77", "email": "wizard@example.com" },
  "projectId": "<PROJECT_ID>"
}
```

## Login (Password)
`POST /v1/player/auth/login/password`

Logs in with `username` or `email` + `password` and returns a Bearer token.

Request:
```json
{ "projectId": "<PROJECT_ID>", "username": "the_wizard_77", "password": "Str0ngPass!" }
```

Response:
```json
{ "tokenType":"Bearer", "accessToken":"<JWT>", "expiresIn":"1h", "player": { "id":"...", "username":"the_wizard_77" }, "projectId":"<PROJECT_ID>" }
```

## Me
`GET /v1/player/me`

Returns the authenticated player summary.

Headers:
```
Authorization: Bearer <JWT>
```

## Profile
- `GET /v1/player/me/profile`
- `PUT /v1/player/me/profile`
- `PUT /v1/player/me/password`

Examples:
```bash
curl -s http://localhost:3000/v1/player/me/profile -H "Authorization: Bearer <JWT>"

curl -s -X PUT http://localhost:3000/v1/player/me/profile \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "profile": { "displayName":"Archmage", "country":"BR" } }'

curl -s -X PUT http://localhost:3000/v1/player/me/password \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "oldPassword": "Str0ngPass!", "newPassword": "EvenStr0nger!" }'
```

## Achievements & Leaderboards
Once authenticated, players can access:
- `GET /v1/player/me/achievements`
- `GET /v1/player/leaderboards/top/xp` (optional `limit`)
- `GET /v1/player/leaderboards/me/xp/rank`

## Swagger Authorization
- Open `http://localhost:3000/v1/docs`.
- Click "Authorize" and provide `Bearer` to test `/v1/player/*` routes.
- For admin/client routes, provide `Tenant` (`x-tenant-id`) and `ApiKey` (`x-api-key`) as required.

## Security Notes
- Passwords are stored as **PBKDF2-SHA256** hashes with random salts; verification uses constant-time comparison.
- `email` is unique per project (sparse unique index) and must not be reused within the same project.
- Player endpoints enforce per-player rate limits (default via `PLAYER_RPS_DEFAULT`).


## Avatar Upload & Public Route

- `POST /v1/player/me/avatar` — upload de avatar (apenas jogador autenticado). Substitui o avatar anterior.
- `GET /v1/public/avatars/:shortKey` — rota pública para servir o avatar por chave curta.

Exemplos:
```bash
# Upload (multipart/form-data)
curl -s -X POST http://localhost:3000/v1/player/me/avatar \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/caminho/para/avatar.png"

# Acesso público por short key
curl -s http://localhost:3000/v1/public/avatars/av_abC12345 -o avatar.png
```

Notas:
- Geração de nomes curtos para links (`av_<chave>`).
- Dimensões e tamanho máximo são validados via variáveis do `.env` (ver `docs/ENV.md`).
- Tipos de imagem aceitos configuráveis (PNG/JPEG/WEBP por padrão).