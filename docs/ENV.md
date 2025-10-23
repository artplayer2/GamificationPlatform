# Environment Variables

```
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/gamification
TENANT_HEADER=x-tenant-id

# REST auth (if used)
API_KEY=dev-api-key

# WS auth
REALTIME_DEV_API_KEY=dev-api-key
REALTIME_MAX_EVENTTYPES=50
REALTIME_MAX_CLIENTS=1000

# Webhooks
WEBHOOK_TIMEOUT_MS=5000

# Player Auth
PLAYER_JWT_SECRET=dev-player-secret
PLAYER_JWT_EXPIRES=1h
TENANT_RPS_DEFAULT=300
PLAYER_RPS_DEFAULT=300

# Client Auth
CLIENT_JWT_SECRET=dev-client-secret
CLIENT_JWT_EXPIRES_IN=1h

# Email
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@example.com
RESEND_API_KEY=
PUBLIC_URL=http://localhost:3000

# Redis (Rate Limit)
# Preferir `REDIS_URL` no formato: redis://:senha@host:porta/db
# Exemplo:
# REDIS_URL=redis://:minhaSenhaForte@localhost:6379/0
# Alternativa por host/porta/senha:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=minhaSenhaForte
```

## Notas sobre Redis e Rate Limit
- O middleware de rate-limit usa Redis para contadores por tenant, player e IP.
- Se o Redis estiver indisponível, o sistema falha em modo aberto (não bloqueia) e registra aviso.
- Cliente Redis é criado de forma preguiçosa: conecta no primeiro uso.
- Variáveis:
  - Preferir `REDIS_URL` com senha: `redis://:SENHA@HOST:PORTA/DB`.
  - Se a senha tiver `@`, codifique como `%40` (ex.: `Luminalab%402025`).
  - Alternativa: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- Limites padrão:
  - `TENANT_RPS_DEFAULT`: requisições por minuto por tenant.
  - `PLAYER_RPS_DEFAULT`: requisições por minuto por player.

### Exemplos
```
# URL com senha contendo '@' (codificar como %40)
REDIS_URL=redis://:Luminalab%402025@redis.luminalab.ai:6379/0

# Sem URL (host/porta/senha)
REDIS_HOST=redis.luminalab.ai
REDIS_PORT=6379
REDIS_PASSWORD=Luminalab@2025
```

### Como testar rate-limit
- Defina `TENANT_RPS_DEFAULT=1` temporariamente no `.env`.
- Faça duas chamadas seguidas ao mesmo endpoint com os mesmos headers.
- Esperado: primeira `401/200` conforme auth; segunda `429 Too Many Requests`.
- Revertir `TENANT_RPS_DEFAULT` para `300` após testes.

## Notas sobre JWT do Cliente
- `CLIENT_JWT_EXPIRES_IN`: use valor numérico em segundos (ex.: `3600`).
- Se definido como string (ex.: `1h`), o módulo usa `3600` por padrão.

## Avatar & S3

Adicione estas variáveis para habilitar upload de avatar em provedor compatível com S3.

```
# S3 (compatível)
S3_BUCKET=avatars-bucket
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000          # opcional (ex.: MinIO)
S3_ACCESS_KEY_ID=dev-access-key
S3_SECRET_ACCESS_KEY=dev-secret-key
S3_FORCE_PATH_STYLE=true                   # true para MinIO/compatíveis

# Limites de Avatar
PLAYER_AVATAR_ALLOWED_SIZES=128x128,256x256,512x512
PLAYER_AVATAR_ALLOWED_MIME_TYPES=image/png,image/jpeg,image/webp
PLAYER_AVATAR_MAX_SIZE_MB=1
```

Notas:
- `PLAYER_AVATAR_ALLOWED_SIZES`: lista de pares `LARGURAxALTURA` aceitos. Use tamanhos quadrados comuns.
- `PLAYER_AVATAR_MAX_SIZE_MB`: tamanho máximo do arquivo. Use valores baixos (1–2MB).
- `PLAYER_AVATAR_ALLOWED_MIME_TYPES`: tipos aceitos; recomenda-se PNG, JPEG ou WEBP.
- `S3_ENDPOINT` e `S3_FORCE_PATH_STYLE=true` são úteis para provedores como MinIO.
- A URL pública do avatar segue `PUBLIC_URL` + `/v1/public/avatars/<shortKey>`.
