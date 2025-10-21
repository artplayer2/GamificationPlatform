# API Keys (Client)

API Keys permitem que clientes (jogos/apps) autentiquem leituras de métricas e acessem o gateway WebSocket em nome de um `projectId`. As chaves são emitidas e gerenciadas via rotas `Client - API Keys`.

## Conceitos
- Cada chave pertence a um `tenantId` e pode ser associada a um `projectId` específico (ou ficar global ao tenant).
- A chave armazenada no banco é um `hash` (SHA-256) do valor em texto plano; o texto plano é retornado apenas no momento da criação/rotação.
- Campos comuns:
  - `name` (string): nome para identificação
  - `projectId` (opcional): projeto ao qual a chave pertence
  - `roles` (string[]): papéis (ex.: `owner`, `developer`, `analyst`, `service`)
  - `scopes` (string[]): escopos (ex.: `read:*`, `write:events`)
  - `expiresAt` (opcional): data de expiração (ISO 8601)
  - `rateLimitPerMin` (number): limite por minuto da chave (default 600)

## Autenticação (Guard)
Alguns endpoints (ex.: métricas de cliente) e o WebSocket exigem cabeçalhos:
- `x-tenant-id`: obrigatório
- `x-api-key`: obrigatório
- `x-project-id`: obrigatório (REST/WS)

O guard lê os cabeçalhos e valida:
- Existência de `tenantId`, `apiKey` e `projectId`.
- Chave ativa, não expirada, e pertencente ao tenant; aceita chaves vinculas ao `projectId` ou chaves globais (`projectId` nulo).
- Aplica rate-limit por chave: janela de 1 minuto, `rateLimitPerMin` configurável.
- Em sucesso, anexa `req.apiKey = { id, tenantId, projectId, roles, scopes, prefix }`.

Erros comuns (HTTP):
- 401: `Missing tenantId`, `Missing x-api-key`, `Missing x-project-id`, `Invalid or expired API key`
- 429: `API key rate limit exceeded`

## Rotas Client - API Keys
Prefixo: `/v1/client/apikeys` (todas exigem `x-tenant-id`)

- Criar
```bash
curl -s -X POST http://localhost:3000/v1/client/apikeys \
  -H "x-tenant-id: demo" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unity client key",
    "projectId": "<PROJECT_ID>",
    "roles": ["owner"],
    "scopes": ["read:*"],
    "rateLimitPerMin": 600
  }'
# => resposta inclui `plaintextKey` (MOSTRE E GUARDE). Não será exibido novamente.
```

- Listar (opcionalmente por projeto)
```bash
curl -s "http://localhost:3000/v1/client/apikeys?projectId=<PROJECT_ID>" -H "x-tenant-id: demo"
```

- Atualizar metadados (roles/scopes/limites)
```bash
curl -s -X PUT http://localhost:3000/v1/client/apikeys/<KEY_ID> \
  -H "x-tenant-id: demo" \
  -H "Content-Type: application/json" \
  -d '{ "roles": ["developer"], "scopes": ["read:*"] }'
```

- Revogar
```bash
curl -s -X POST http://localhost:3000/v1/client/apikeys/<KEY_ID>/revoke -H "x-tenant-id: demo"
```

- Rotacionar (retorna novo texto plano 1x)
```bash
curl -s -X POST http://localhost:3000/v1/client/apikeys/<KEY_ID>/rotate -H "x-tenant-id: demo"
```

## Uso em WebSocket
Conectar com query string ou headers:
```bash
npx wscat -c "ws://localhost:3000/realtime?x-api-key=<PLAINTEXT_API_KEY>&x-project-id=<PROJECT_ID>&x-tenant-id=demo"
# após conectar, envie:
# {"action":"subscribe","eventTypes":["*"]}
```

Notas:
- Em desenvolvimento, é possível configurar `REALTIME_DEV_API_KEY` para permitir um API key de teste.
- O gateway valida `x-api-key`, `x-project-id` e `x-tenant-id`, e fecha a conexão com códigos específicos se faltar algo (`missing_headers`) ou se o `projectId` for inválido.

## Boas Práticas
- Armazene o `plaintextKey` com segurança no cliente; nunca logue em texto claro no servidor.
- Regule `rateLimitPerMin` conforme a carga esperada do cliente.
- Use `roles` e `scopes` para limitar acesso em futuras superfícies (RBAC/ACL).