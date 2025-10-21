# Planos (Admin)

Os Planos definem limites e funcionalidades disponíveis para projetos de um tenant. Eles são gerenciados via rotas administrativas e podem ser vinculados a projetos existentes.

## Estrutura do Plano
Campos conforme o schema (`Plan`):
- `name` (string): nome legível, ex.: "Pro".
- `code` (string): código único, ex.: `free`, `pro`, `enterprise`.
- `limits` (objeto): limites técnicos do plano:
  - `restMaxReqPerMin` (number, padrão 300)
  - `wsMaxClients` (number, padrão 1000)
  - `wsMaxEventTypes` (number, padrão 50)
  - `webhookTimeoutMs` (number, padrão 5000)
  - `webhooksMaxPerMin` (number, padrão 600)
  - `storageMaxEvents` (number, padrão 100000)
  - `storageMaxPlayers` (number, padrão 100000)
- `features` (objeto): funcionalidades ativadas no plano:
  - `realtimeEnabled`, `webhooksEnabled`, `storeEnabled`, `questsEnabled`, `achievementsEnabled`, `inventoryEnabled`, `countersEnabled` (todos booleanos, padrão `true`).

> Observação: Alguns limites já têm equivalentes operacionais (ex.: rate-limit por tenant e por API key). A aplicação dos limites por plano será expandida por middleware específico.

## Rotas Admin - Plans
Prefixo: `POST/GET/PATCH/DELETE /v1/admin/plans`

Todas exigem `x-tenant-id` e `x-api-key` (chave de nível de tenant). No Swagger, use o botão "Authorize" para os esquemas `Tenant` e `ApiKey`.

- Criar plano
```bash
curl -s -X POST http://localhost:3000/v1/admin/plans \
  -H "x-tenant-id: demo" \
  -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro",
    "code": "pro",
    "limits": { "restMaxReqPerMin": 600, "wsMaxClients": 5000 },
    "features": { "realtimeEnabled": true, "webhooksEnabled": true }
  }'
```

- Listar planos
```bash
curl -s http://localhost:3000/v1/admin/plans -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
```

- Obter plano por `id`
```bash
curl -s http://localhost:3000/v1/admin/plans/<PLAN_ID> -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
```

- Atualizar plano
```bash
curl -s -X PATCH http://localhost:3000/v1/admin/plans/<PLAN_ID> \
  -H "x-tenant-id: demo" \
  -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "limits": { "restMaxReqPerMin": 800 } }'
```

- Remover plano
```bash
curl -s -X DELETE http://localhost:3000/v1/admin/plans/<PLAN_ID> -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
```

## Vincular Plano a Projeto (Admin - Projects)
Use a rota administrativa para definir o plano de um projeto por código:

`PATCH /v1/admin/projects/:id/plan`
```bash
curl -s -X PATCH http://localhost:3000/v1/admin/projects/<PROJECT_ID>/plan \
  -H "x-tenant-id: demo" \
  -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "plan": "pro" }'
```

## Boas Práticas
- Padronize códigos de planos simples e estáveis (`free`, `indie`, `studio`, `enterprise`).
- Ajuste `limits` para refletir necessidades reais; mantenha margens de segurança.
- Planeje migração entre planos sem interromper clientes (alterações idempotentes, comunicação via eventos).
## Enforcing de Features e Limites

As seguintes operações agora respeitam o gating por plano do projeto:
- Itens e Inventário: exigem `inventoryEnabled` para criar/listar definições, conceder/consumir itens e consultar inventário.
- Conquistas: exigem `achievementsEnabled` para criar/listar definições, desbloquear e consultar conquistas.
- Quests: exigem `questsEnabled` para criar/listar definições e concluir quests.
- Store: exige `storeEnabled` para criar/listar SKUs e comprar.
- Players: criação de jogador respeita o limite `storageMaxPlayers` do plano.

Quando uma feature está desativada no plano, as rotas retornam erro `403` com mensagem indicando a feature/plano.