# Documentação da API para Desenvolvedores Front-End

Este documento fornece todas as informações necessárias para que desenvolvedores front-end possam consumir a API da Plataforma de Gamificação.

*## 1. Visão Geral

A GamificationPlatform é uma API multi-tenant projetada para permitir que desenvolvedores integrem rapidamente recursos de gamificação (como missões, conquistas, níveis, itens e leaderboards) em suas próprias aplicações.

### Conceitos Principais

- **Tenant**: Um cliente da plataforma. Cada tenant possui seus próprios projetos, jogadores e configurações, totalmente isolados dos outros. A identificação do tenant é feita através do header `x-tenant-id` em todas as requisições.
- **Projeto**: Uma aplicação específica de um tenant. Um tenant pode ter múltiplos projetos (ex: um jogo e um aplicativo web).
- **Player**: O usuário final da aplicação do seu cliente. Cada jogador tem um perfil, progresso, inventário, etc., dentro de um projeto.

## 2. Fluxos de Autenticação

A API possui dois fluxos de autenticação distintos: um para os **Players** (usuários finais) e outro para os **Administradores/Tenants** (seus clientes, que gerenciam os projetos).

### 2.1. Autenticação do Player

Este é o fluxo para logar um usuário final da sua aplicação e obter um token de acesso para interagir com a API de gamificação em nome dele.

#### Endpoints

**`POST /player/auth/register`**

Registra um novo jogador no sistema.

- **Corpo da Requisição (`application/json`)**:
  ```

### Referência da API

Esta seção detalha os principais endpoints de gamificação que o front-end irá consumir. Todos os endpoints listados aqui requerem autenticação via **API Key** (cabeçalhos `x-tenant-id` e `x-api-key`).

---

### Conquistas (Achievements)

O módulo de conquistas permite criar, gerenciar e conceder medalhas ou troféus aos jogadores.

#### `POST /achievements`

Cria uma nova **definição** de conquista para um projeto.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "code": "string (identificador único, ex: 'first_kill')",
  "title": "string (ex: 'Primeiro Abate')",
  "description": "string (opcional)",
  "imageUrl": "string (opcional)",
  "type": "'xp_threshold' | 'counter_threshold'",
  "minXp": "number (obrigatório se type='xp_threshold')",
  "counterName": "string (obrigatório se type='counter_threshold')",
  "counterMin": "number (obrigatório se type='counter_threshold')"
}
```

---

#### `GET /achievements`

Lista as definições de conquistas de um projeto, com paginação.

**Query Parameters:**

*   `projectId`: (Obrigatório) ID do projeto.
*   `limit`: (Opcional) Número de itens por página (padrão: 20, máx: 100).
*   `after`: (Opcional) Cursor para paginação (ID do último item da página anterior).

**Exemplo de Resposta:**

```json
{
  "items": [
    {
      "id": "string",
      "code": "string",
      "title": "string",
      ...
    }
  ],
  "nextCursor": "string | null"
}
```

---

#### `GET /achievements/player`

Lista as conquistas desbloqueadas por um jogador específico, incluindo metadados da definição.

**Query Parameters:**

*   `projectId`: (Obrigatório) ID do projeto.
*   `playerId`: (Obrigatório) ID do jogador.

**Exemplo de Resposta:**

```json
[
  {
    "code": "string",
    "unlockedAt": "date-time",
    "title": "string",
    "description": "string | null",
    "imageUrl": "string | null"
  }
]
```

---

#### `POST /achievements/grant`

Concede manualmente uma conquista a um jogador. Esta ação é idempotente (se o jogador já tiver a conquista, nada acontece).

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "playerId": "string",
  "code": "string (código da conquista a ser concedida)"
}
```

**Exemplo de Resposta:**

```json
{
  "granted": true,
  "code": "string"
}
// ou, se já possuir:
{
  "granted": false,
  "alreadyUnlocked": true,
  "code": "string"
}
```

---

### Itens e Inventário (Items & Inventory)

Este módulo gerencia as definições de itens (ex: poções, moedas, espadas) e o inventário de cada jogador.

#### `POST /items`

Cria ou atualiza a **definição** de um item para um projeto.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "code": "string (identificador único, ex: 'potion_small')",
  "name": "string (ex: 'Poção Pequena')",
  "description": "string (opcional)",
  "imageUrl": "string (opcional)",
  "stackable": "boolean (se o item pode ser acumulado, padrão: true)",
  "type": "string (ex: 'consumable', 'collectible')"
}
```

---

#### `GET /items`

Lista as definições de itens de um projeto.

**Query Parameters:**

*   `projectId`: (Obrigatório) ID do projeto.

---

#### `GET /items/player`

Lista os itens e suas quantidades no inventário de um jogador.

**Query Parameters:**

*   `projectId`: (Obrigatório) ID do projeto.
*   `playerId`: (Obrigatório) ID do jogador.

**Exemplo de Resposta:**

```json
[
  {
    "code": "potion_small",
    "qty": 5,
    "definition": { ... } // Objeto com os detalhes da definição do item
  },
  {
    "code": "gold_coin",
    "qty": 120,
    "definition": { ... }
  }
]
```

---

#### `POST /items/grant`

Concede uma quantidade de um item a um jogador. Esta ação é idempotente se uma `idempotencyKey` for fornecida.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "playerId": "string",
  "code": "string (código do item)",
  "qty": "number (quantidade a ser concedida)",
  "idempotencyKey": "string (opcional, chave para evitar duplicidade)",
  "reason": "string (opcional, ex: 'reward:daily_login')"
}
```

**Exemplo de Resposta:**

```json
{
  "newQty": 8
}
```

---

#### `POST /items/consume`

Consome uma quantidade de um item do inventário de um jogador. Falhará se o jogador não tiver a quantidade suficiente.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "playerId": "string",
  "code": "string (código do item)",
  "qty": "number (quantidade a ser consumida)",
  "reason": "string (opcional, ex: 'use_in_battle')"
}
```

**Exemplo de Resposta:**

```json
{
  "newQty": 7
}
```

--- 

### Missões (Quests)

Este módulo gerencia as missões que os jogadores podem completar para ganhar recompensas como XP, itens e moedas.

#### `POST /quests`

Cria ou atualiza a **definição** de uma missão para um projeto.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "code": "string (identificador único, ex: 'kill_10_boars')",
  "title": "string (ex: 'Caçador de Javalis')",
  "description": "string (opcional)",
  "rewards": {
    "xp": "number (opcional)",
    "wallet": {
      "gold": "number (opcional)",
      "gems": "number (opcional)"
    },
    "items": [
      {
        "code": "string",
        "qty": "number"
      }
    ]
  }
}
```

---

#### `GET /quests`

Lista as definições de missões de um projeto, com paginação.

**Query Parameters:**

*   `projectId`: (Obrigatório) ID do projeto.
*   `limit`: (Opcional) Número de itens por página.
*   `after`: (Opcional) Cursor para paginação.

---

#### `POST /quests/complete`

Marca uma missão como concluída para um jogador e distribui as recompensas. Esta operação é idempotente.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "playerId": "string",
  "code": "string (código da missão)",
  "idempotencyKey": "string (opcional, para garantir idempotência)"
}
```

**Exemplo de Resposta:**

```json
{
  "processed": true,
  "isNewCompletion": true,
  "rewardsGranted": {
    "xp": 100,
    "wallet": { "gold": 50 },
    "items": [{ "code": "boar_tusk", "qty": 2 }]
  }
}
// ou, se já possuir (idempotência):
{
  "processed": true,
  "isNewCompletion": false,
  "rewardsGranted": null
}
```
json
  {
    "projectId": "string",
    "username": "string",
    "email": "string (opcional)",
    "password": "string (mínimo 6 caracteres)"
  }
  ```

---

## Comunicação em Tempo Real (WebSockets)

A plataforma oferece um gateway de WebSocket para que as aplicações front-end possam receber eventos em tempo real, criando uma experiência de usuário mais dinâmica e reativa. Eventos como ganho de XP, desbloqueio de conquistas e conclusão de missões são transmitidos instantaneamente.

### 1. Conexão

O cliente deve estabelecer uma conexão WebSocket com o seguinte endpoint:

`ws://<host>:<port>/realtime`

**Autenticação na Conexão:**

A autenticação é feita no momento da conexão, enviando as credenciais do projeto. Elas podem ser enviadas de duas maneiras:

**a) Query Parameters (Recomendado para clientes web):**

```
ws://<host>:<port>/realtime?x-api-key=<SUA_API_KEY>&x-project-id=<ID_DO_PROJETO>&x-tenant-id=<ID_DO_TENANT>
```

**b) Cabeçalhos (Headers):**

- `x-api-key`: Sua chave de API.
- `x-project-id`: O ID do projeto.
- `x-tenant-id`: O ID do seu tenant.

Após a conexão bem-sucedida, o servidor enviará uma mensagem de boas-vindas:

```json
{ "type":"hello", "ok": true, "projectId":"<ID_DO_PROJETO>" }
```

### 2. Inscrição em Eventos (Obrigatório)

Após a conexão, o cliente **precisa** se inscrever nos tipos de eventos que deseja ouvir. Sem a inscrição, nenhum evento será enviado.

Para se inscrever, envie a seguinte mensagem JSON para o servidor:

```json
{
  "action": "subscribe",
  "eventTypes": ["*"], // Use ["*"] para todos os eventos
  "since": "string (opcional, timestamp ISO para replay de eventos - não implementado ainda)"
}
```

- `eventTypes`: Um array de strings com os nomes dos eventos. Use `["*"]` para receber todos os eventos do projeto.

O servidor confirmará a inscrição com a mensagem:

```json
{ "type": "subscribed", "eventTypes": ["*"] }
```

### 3. Recebendo Eventos

Uma vez inscrito, o cliente começará a receber mensagens de eventos que correspondem aos tipos inscritos. O formato do evento é o seguinte:

```json
{
  "id": "string (ID do evento)",
  "type": "string (ex: 'player.levelup')",
  "tenantId": "string",
  "projectId": "string",
  "payload": {
    "playerId": "string",
    "level": 16,
    "oldLevel": 15
    // ... outros dados específicos do evento
  },
  "createdAt": "string (timestamp ISO)",
  "channel": "ws"
}
```

### Exemplo de Código Cliente (JavaScript)

```javascript
const projectId = '66d2a1f5e4aabbccddeeff00';
const tenantId = 'demo';
const apiKey = 'dev-api-key'; // Use uma chave de API válida

const query = new URLSearchParams({
  'x-api-key': apiKey,
  'x-project-id': projectId,
  'x-tenant-id': tenantId,
}).toString();

const ws = new WebSocket(`ws://localhost:3000/realtime?${query}`);

ws.onopen = () => {
  console.log('Conectado ao servidor WebSocket.');

  // 2. Inscreva-se nos eventos
  const subscriptionMessage = {
    action: 'subscribe',
    eventTypes: ['*']
  };
  ws.send(JSON.stringify(subscriptionMessage));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'hello') {
    console.log('Recebido HELLO do servidor:', message);
  } else if (message.type === 'subscribed') {
    console.log('Inscrição confirmada:', message);
  } else {
    // É um evento de gamificação!
    console.log('Novo evento recebido:', message);

    // Exemplo: Mostrar uma notificação de level up
    if (message.type === 'player.levelup') {
      alert(`Parabéns! Você alcançou o nível ${message.payload.level}!`);
    }
  }
};

ws.onclose = () => {
  console.log('Desconectado do servidor WebSocket.');
};

ws.onerror = (error) => {
  console.error('Erro no WebSocket:', error);
};
```

### Lista de Tipos de Eventos Comuns

- `player.created`: Novo jogador registrado.
- `player.xp.added`: Jogador ganhou XP.
- `player.levelup`: Jogador subiu de nível.
- `achievement.unlocked`: Jogador desbloqueou uma conquista.
- `quest.completed`: Jogador completou uma missão.
- `item.granted`: Jogador recebeu um item.
- `item.consumed`: Jogador consumiu um item.
- `wallet.credited`: Moedas foram adicionadas à carteira do jogador.
- `wallet.debited`: Moedas foram removidas da carteira do jogador.
- `store.purchase.succeeded`: Compra na loja bem-sucedida.

- **Resposta de Sucesso (`201 Created`)**:
  ```json
  {
    "tokenType": "Bearer",
    "accessToken": "string (JWT)",
    "player": {
      "id": "string",
      "username": "string",
      "email": "string | null"
    },
    "projectId": "string",
    "expiresIn": "string (ex: '1h')"
  }
  ```

---

**`POST /player/auth/login/password`**

Autentica um jogador existente usando username/email e senha.

- **Corpo da Requisição (`application/json`)**:
  ```json
  {
    "projectId": "string",
    "username": "string (obrigatório se email não for fornecido)",
    "email": "string (obrigatório se username não for fornecido)",
    "password": "string"
  }
  ```
- **Resposta de Sucesso (`201 Created`)**:
  ```json
  {
    "tokenType": "Bearer",
    "accessToken": "string (JWT)",
    "player": {
      "id": "string",
      "username": "string",
      "email": "string | null"
    },
    "projectId": "string",
    "expiresIn": "string (ex: '1h')"
  }
  ```

#### Como Usar o Token de Acesso

Após obter o `accessToken`, o front-end deve enviá-lo em todas as requisições subsequentes para endpoints protegidos do jogador no header `Authorization`.

- **Header**: `Authorization: Bearer <accessToken>`

--- 

### Autenticação do Administrador (Painel) e Aplicações Cliente

Diferente da autenticação do jogador, a autenticação para o **painel de administração do tenant** e para as **aplicações cliente** (ex: seu jogo, seu app) não utiliza um sistema de login com email e senha. Em vez disso, ela é baseada em **Chaves de API (API Keys)**.

Uma API Key é um token secreto que representa uma aplicação ou um painel administrativo. Existem dois níveis de privilégio para uma API Key:

1.  **Admin (`admin`)**: Concede acesso total aos recursos do tenant, incluindo a capacidade de gerenciar projetos, jogadores e outras API Keys. **Este é o tipo de chave que o painel de administração do seu cliente usará.**
2.  **Cliente (`client`)**: Concede acesso limitado, permitindo que a aplicação cliente realize ações em nome dos jogadores (ex: conceder uma conquista, registrar um item no inventário).

**Como usar a API Key:**

Para se autenticar como administrador ou aplicação cliente, você deve enviar duas informações no cabeçalho de cada requisição:

*   `x-tenant-id`: O identificador único do seu tenant (ex: `demo`).
*   `x-api-key`: A chave de API secreta.

```
x-tenant-id: <id_do_seu_tenant>
x-api-key: <sua_api_key>
```

### Gerenciamento de API Keys (Para o Painel de Administração)

Os endpoints a seguir são usados para gerenciar as API Keys de um tenant. Eles devem ser consumidos pelo painel de administração e requerem uma **API Key com privilégios de `admin`** para serem acessados.

---

#### `POST /client/apikeys`

Cria uma nova API Key.

**Corpo da Requisição:**

```json
{
  "projectId": "string (ID do Projeto ao qual a chave pertence)",
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string (opcional)"
}
```

**Exemplo de Resposta (Sucesso):**

```json
{
  "id": "string",
  "key": "string (a chave secreta - salve-a, pois ela não será mostrada novamente)",
  "prefix": "string (os 6 primeiros caracteres da chave, para identificação)",
  "projectId": "string",
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string"
}
```

---

#### `GET /client/apikeys`

Lista todas as API Keys de um tenant. Pode ser filtrado por projeto.

**Query Parameters:**

*   `projectId` (opcional): Filtra as chaves por um ID de projeto específico.

**Exemplo de Resposta (Sucesso):**

```json
[
  {
    "id": "string",
    "prefix": "string",
    "projectId": "string",
    "roles": ["admin" | "client"],
    "scopes": ["string"],
    "description": "string",
    "createdAt": "date-time",
    "revokedAt": "date-time | null"
  }
]
```

---

#### `PUT /client/apikeys/:id`

Atualiza os metadados de uma API Key existente (como `roles`, `scopes` e `description`).

**Corpo da Requisição:**

```json
{
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string"
}
```

---

#### `POST /client/apikeys/:id/revoke`

Revoga (desativa) uma API Key, tornando-a permanentemente inválida.

---

#### `POST /client/apikeys/:id/rotate`

Gera um novo segredo para uma API Key existente. O segredo antigo é invalidado. A resposta conterá a nova chave secreta, que deve ser salva imediatamente.

**Exemplo de Resposta (Sucesso):**

```json
{
  "id": "string",
  "key": "string (a NOVA chave secreta)",
  "prefix": "string (o novo prefixo)",
  ...
}
```

# Frontend

Este diretório contém exemplos e notas para integrar clientes (web/desktop/mobile) com a plataforma.

## Autenticação e Cabeçalhos
- `x-tenant-id`: obrigatório para endpoints de admin/cliente.
- `x-api-key`: obrigatório para endpoints de cliente/admin.
- `Authorization: Bearer <JWT>`: obrigatório para endpoints de jogador.

## Projetos

- Criação de projeto (`POST /v1/projects`)
  - Headers: `x-tenant-id`, `x-api-key` (Admin)
  - Resposta retorna `publicKey` e `plaintextSecret` apenas uma vez; o hash do segredo é armazenado no servidor.
  ```bash
  curl -s -X POST http://localhost:3000/v1/projects \
    -H "x-tenant-id: demo" \
    -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>" \
    -H "Content-Type: application/json" \
    -d '{ "name": "demo", "plan": "free" }'
  ```
  
- Rotação de segredo (`POST /v1/projects/:id/rotate-secret`)
  - Headers: `x-tenant-id`, `x-api-key` (Admin)
  - Resposta retorna o novo `plaintextSecret` apenas uma vez.
  ```bash
  curl -s -X POST http://localhost:3000/v1/projects/<PROJECT_ID>/rotate-secret \
    -H "x-tenant-id: demo" \
    -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
  ```

### Eventos de Projeto

Você pode acompanhar eventos de projeto via WebSocket e/ou Webhooks.

- Tipos:
  - `project.created` — payload: `{ name, plan }`
  - `project.secret.rotated` — payload: `{ publicKey }`
- WebSocket: conecte-se ao gateway e assine eventos do seu projeto.
  - Exemplo (pseudo):
    - Conexão: `ws://localhost:3000/realtime`
    - Headers: `x-tenant-id: demo`, `x-api-key: <PLAINTEXT_ADMIN_API_KEY>`, `x-project-id: <PROJECT_ID>`
    - Mensagem de subscribe: `{"action":"subscribe","eventTypes":["project.created","project.secret.rotated"]}`
- Webhooks: crie uma assinatura com os tipos acima para receber notificações.
  - `POST /v1/webhooks/subscriptions` com `{ projectId, url, secret, eventTypes }`

Boas práticas:
- Nunca registre ou exiba `plaintextSecret` no frontend.
- Armazene o segredo apenas em serviços seguros (vault/manager) no backend.

## Fluxo do Jogador
- Registro/login e obtenção de `Bearer` para chamadas `/v1/player/*`.
- Com Bearer válido, `x-tenant-id` não é necessário nas rotas de jogador.

## Boas Práticas
- Nunca exponha `plaintextSecret` em listagens ou detalhes de projeto.
- Armazene apenas o hash do segredo (SHA-256) no backend.
- Prefira usar `EventsService.log(...)` para cada mudança de estado (inventário, progresso, conquistas, etc.).

---

## Referência da API - Leaderboards

Este módulo permite a criação e consulta de placares de líderes (rankings) para fomentar a competição.

### GET /player/leaderboards/top/xp

Retorna o ranking dos melhores jogadores por XP. Acessível pelo próprio jogador.

- **Método**: `GET`
- **Endpoint**: `/player/leaderboards/top/xp`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Query Params**:
  - `limit` (opcional): Número máximo de jogadores no ranking (padrão: 20, máx: 100).
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "projectId": "66d2a1f5e4aabbccddeeff00",
    "leaderboard": "xp_alltime",
    "items": [
      {
        "rank": 1,
        "id": "66d2b3c4e4aabbccddeeff11",
        "username": "player_one",
        "xp": 1500,
        "level": 15
      },
      {
        "rank": 2,
        "id": "66d2b3c4e4aabbccddeeff12",
        "username": "player_two",
        "xp": 1450,
        "level": 14
      }
    ]
  }
  ```

### GET /client/leaderboards/project/:projectId/top/xp

Retorna o ranking dos melhores jogadores por XP para um projeto. Acessível por aplicações cliente (servidor de jogo, painel).

- **Método**: `GET`
- **Endpoint**: `/client/leaderboards/project/:projectId/top/xp`
- **Autenticação**: API Key
- **Cabeçalhos**:
  - `x-api-key`: Sua chave de API.
  - `x-tenant-id`: O ID do seu tenant.
- **Query Params**:
  - `limit` (opcional): Número máximo de jogadores no ranking (padrão: 20, máx: 100).
- **Resposta de Sucesso**: Idêntica ao endpoint do jogador.

### GET /client/leaderboards/project/:projectId/player/:playerId/xp/rank

Retorna a posição (rank) de um jogador específico no ranking de XP.

- **Método**: `GET`
- **Endpoint**: `/client/leaderboards/project/:projectId/player/:playerId/xp/rank`
- **Autenticação**: API Key
- **Cabeçalhos**:
  - `x-api-key`: Sua chave de API.
  - `x-tenant-id`: O ID do seu tenant.
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "projectId": "66d2a1f5e4aabbccddeeff00",
    "leaderboard": "xp_alltime",
    "rank": 42,
    "player": {
      "id": "66d2b3c4e4aabbccddeeff11",
      "username": "player_one",
      "xp": 1500,
      "level": 15
    },
    "totalPlayers": 258
  }
  ```

---

## Referência da API - Perfil do Jogador (Player Profile)

Endpoints para que o jogador consulte e gerencie seus próprios dados.

### GET /player/me

Retorna o perfil completo do jogador logado, incluindo XP, nível, carteira e outras informações de estado.

- **Método**: `GET`
- **Endpoint**: `/player/me`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "id": "66d2b3c4e4aabbccddeeff11",
    "username": "player_one",
    "email": "player_one@example.com",
    "xp": 1500,
    "level": 15,
    "wallet": {
      "gold": 1200,
      "gems": 50
    },
    "profile": {
      "displayName": "Player One",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }
  ```

### GET /player/me/profile

Retorna os dados de perfil do jogador (username, email, etc.).

- **Método**: `GET`
- **Endpoint**: `/player/me/profile`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "username": "player_one",
    "email": "player_one@example.com",
    "profile": {
      "displayName": "Player One",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }
  ```

### PATCH /player/me/profile

Atualiza o perfil do jogador.

- **Método**: `PATCH`
- **Endpoint**: `/player/me/profile`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Corpo da Requisição**:
  ```json
  {
    "displayName": "The Legendary Player One",
    "avatarUrl": "https://example.com/new_avatar.png"
  }
  ```
- **Resposta de Sucesso** (`200 OK`): Retorna o perfil atualizado.

### POST /player/me/change-password

Permite que o jogador altere sua própria senha.

- **Método**: `POST`
- **Endpoint**: `/player/me/change-password`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Corpo da Requisição**:
  ```json
  {
    "oldPassword": "current-secret-password",
    "newPassword": "new-stronger-password"
  }
  ```
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "success": true
  }
  ```

---

### Autenticação do Administrador (Painel) e Aplicações Cliente

Diferente da autenticação do jogador, a autenticação para o **painel de administração do tenant** e para as **aplicações cliente** (ex: seu jogo, seu app) não utiliza um sistema de login com email e senha. Em vez disso, ela é baseada em **Chaves de API (API Keys)**.

Uma API Key é um token secreto que representa uma aplicação ou um painel administrativo. Existem dois níveis de privilégio para uma API Key:

1.  **Admin (`admin`)**: Concede acesso total aos recursos do tenant, incluindo a capacidade de gerenciar projetos, jogadores e outras API Keys. **Este é o tipo de chave que o painel de administração do seu cliente usará.**
2.  **Cliente (`client`)**: Concede acesso limitado, permitindo que a aplicação cliente realize ações em nome dos jogadores (ex: conceder uma conquista, registrar um item no inventário).

**Como usar a API Key:**

Para se autenticar como administrador ou aplicação cliente, você deve enviar duas informações no cabeçalho de cada requisição:

*   `x-tenant-id`: O identificador único do seu tenant (ex: `demo`).
*   `x-api-key`: A chave de API secreta.

```
x-tenant-id: <id_do_seu_tenant>
x-api-key: <sua_api_key>
```

### Gerenciamento de API Keys (Para o Painel de Administração)

Os endpoints a seguir são usados para gerenciar as API Keys de um tenant. Eles devem ser consumidos pelo painel de administração e requerem uma **API Key com privilégios de `admin`** para serem acessados.

---

#### `POST /client/apikeys`

Cria uma nova API Key.

**Corpo da Requisição:**

```json
{
  "projectId": "string (ID do Projeto ao qual a chave pertence)",
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string (opcional)"
}
```

**Exemplo de Resposta (Sucesso):**

```json
{
  "id": "string",
  "key": "string (a chave secreta - salve-a, pois ela não será mostrada novamente)",
  "prefix": "string (os 6 primeiros caracteres da chave, para identificação)",
  "projectId": "string",
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string"
}
```

---

#### `GET /client/apikeys`

Lista todas as API Keys de um tenant. Pode ser filtrado por projeto.

**Query Parameters:**

*   `projectId` (opcional): Filtra as chaves por um ID de projeto específico.

**Exemplo de Resposta (Sucesso):**

```json
[
  {
    "id": "string",
    "prefix": "string",
    "projectId": "string",
    "roles": ["admin" | "client"],
    "scopes": ["string"],
    "description": "string",
    "createdAt": "date-time",
    "revokedAt": "date-time | null"
  }
]
```

---

#### `PUT /client/apikeys/:id`

Atualiza os metadados de uma API Key existente (como `roles`, `scopes` e `description`).

**Corpo da Requisição:**

```json
{
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string"
}
```

---

#### `POST /client/apikeys/:id/revoke`

Revoga (desativa) uma API Key, tornando-a permanentemente inválida.

---

#### `POST /client/apikeys/:id/rotate`

Gera um novo segredo para uma API Key existente. O segredo antigo é invalidado. A resposta conterá a nova chave secreta, que deve ser salva imediatamente.

**Exemplo de Resposta (Sucesso):**

```json
{
  "id": "string",
  "key": "string (a NOVA chave secreta)",
  "prefix": "string (o novo prefixo)",
  ...
}
```

--- 

### Missões (Quests)

Este módulo gerencia as missões que os jogadores podem completar para ganhar recompensas como XP, itens e moedas.

#### `POST /quests`

Cria ou atualiza a **definição** de uma missão para um projeto.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "code": "string (identificador único, ex: 'kill_10_boars')",
  "title": "string (ex: 'Caçador de Javalis')",
  "description": "string (opcional)",
  "rewards": {
    "xp": "number (opcional)",
    "wallet": {
      "gold": "number (opcional)",
      "gems": "number (opcional)"
    },
    "items": [
      {
        "code": "string",
        "qty": "number"
      }
    ]
  }
}
```

---

#### `GET /quests`

Lista as definições de missões de um projeto, com paginação.

**Query Parameters:**

*   `projectId`: (Obrigatório) ID do projeto.
*   `limit`: (Opcional) Número de itens por página.
*   `after`: (Opcional) Cursor para paginação.

---

#### `POST /quests/complete`

Marca uma missão como concluída para um jogador e distribui as recompensas. Esta operação é idempotente.

**Corpo da Requisição:**

```json
{
  "projectId": "string",
  "playerId": "string",
  "code": "string (código da missão)",
  "idempotencyKey": "string (opcional, para garantir idempotência)"
}
```

**Exemplo de Resposta:**

```json
{
  "processed": true,
  "isNewCompletion": true,
  "rewardsGranted": {
    "xp": 100,
    "wallet": { "gold": 50 },
    "items": [{ "code": "boar_tusk", "qty": 2 }]
  }
}
// ou, se já possuir (idempotência):
{
  "processed": true,
  "isNewCompletion": false,
  "rewardsGranted": null
}
```

---

## Referência da API - Leaderboards

Este módulo permite a criação e consulta de placares de líderes (rankings) para fomentar a competição.

### GET /player/leaderboards/top/xp

Retorna o ranking dos melhores jogadores por XP. Acessível pelo próprio jogador.

- **Método**: `GET`
- **Endpoint**: `/player/leaderboards/top/xp`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Query Params**:
  - `limit` (opcional): Número máximo de jogadores no ranking (padrão: 20, máx: 100).
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "projectId": "66d2a1f5e4aabbccddeeff00",
    "leaderboard": "xp_alltime",
    "items": [
      {
        "rank": 1,
        "id": "66d2b3c4e4aabbccddeeff11",
        "username": "player_one",
        "xp": 1500,
        "level": 15
      },
      {
        "rank": 2,
        "id": "66d2b3c4e4aabbccddeeff12",
        "username": "player_two",
        "xp": 1450,
        "level": 14
      }
    ]
  }
  ```

### GET /client/leaderboards/project/:projectId/top/xp

Retorna o ranking dos melhores jogadores por XP para um projeto. Acessível por aplicações cliente (servidor de jogo, painel).

- **Método**: `GET`
- **Endpoint**: `/client/leaderboards/project/:projectId/top/xp`
- **Autenticação**: API Key
- **Cabeçalhos**:
  - `x-api-key`: Sua chave de API.
  - `x-tenant-id`: O ID do seu tenant.
- **Query Params**:
  - `limit` (opcional): Número máximo de jogadores no ranking (padrão: 20, máx: 100).
- **Resposta de Sucesso**: Idêntica ao endpoint do jogador.

### GET /client/leaderboards/project/:projectId/player/:playerId/xp/rank

Retorna a posição (rank) de um jogador específico no ranking de XP.

- **Método**: `GET`
- **Endpoint**: `/client/leaderboards/project/:projectId/player/:playerId/xp/rank`
- **Autenticação**: API Key
- **Cabeçalhos**:
  - `x-api-key`: Sua chave de API.
  - `x-tenant-id`: O ID do seu tenant.
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "projectId": "66d2a1f5e4aabbccddeeff00",
    "leaderboard": "xp_alltime",
    "rank": 42,
    "player": {
      "id": "66d2b3c4e4aabbccddeeff11",
      "username": "player_one",
      "xp": 1500,
      "level": 15
    },
    "totalPlayers": 258
  }
  ```

---

## Referência da API - Perfil do Jogador (Player Profile)

Endpoints para que o jogador consulte e gerencie seus próprios dados.

### GET /player/me

Retorna o perfil completo do jogador logado, incluindo XP, nível, carteira e outras informações de estado.

- **Método**: `GET`
- **Endpoint**: `/player/me`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "id": "66d2b3c4e4aabbccddeeff11",
    "username": "player_one",
    "email": "player_one@example.com",
    "xp": 1500,
    "level": 15,
    "wallet": {
      "gold": 1200,
      "gems": 50
    },
    "profile": {
      "displayName": "Player One",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }
  ```

### GET /player/me/profile

Retorna os dados de perfil do jogador (username, email, etc.).

- **Método**: `GET`
- **Endpoint**: `/player/me/profile`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "username": "player_one",
    "email": "player_one@example.com",
    "profile": {
      "displayName": "Player One",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }
  ```

### PATCH /player/me/profile

Atualiza o perfil do jogador.

- **Método**: `PATCH`
- **Endpoint**: `/player/me/profile`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Corpo da Requisição**:
  ```json
  {
    "displayName": "The Legendary Player One",
    "avatarUrl": "https://example.com/new_avatar.png"
  }
  ```
- **Resposta de Sucesso** (`200 OK`): Retorna o perfil atualizado.

### POST /player/me/change-password

Permite que o jogador altere sua própria senha.

- **Método**: `POST`
- **Endpoint**: `/player/me/change-password`
- **Autenticação**: Token JWT do Player
- **Cabeçalhos**:
  - `Authorization: Bearer <token>`
  - `x-tenant-id`: O ID do seu tenant.
- **Corpo da Requisição**:
  ```json
  {
    "oldPassword": "current-secret-password",
    "newPassword": "new-stronger-password"
  }
  ```
- **Resposta de Sucesso** (`200 OK`):
  ```json
  {
    "success": true
  }
  ```

---

### Autenticação do Administrador (Painel) e Aplicações Cliente

Diferente da autenticação do jogador, a autenticação para o **painel de administração do tenant** e para as **aplicações cliente** (ex: seu jogo, seu app) não utiliza um sistema de login com email e senha. Em vez disso, ela é baseada em **Chaves de API (API Keys)**.

Uma API Key é um token secreto que representa uma aplicação ou um painel administrativo. Existem dois níveis de privilégio para uma API Key:

1.  **Admin (`admin`)**: Concede acesso total aos recursos do tenant, incluindo a capacidade de gerenciar projetos, jogadores e outras API Keys. **Este é o tipo de chave que o painel de administração do seu cliente usará.**
2.  **Cliente (`client`)**: Concede acesso limitado, permitindo que a aplicação cliente realize ações em nome dos jogadores (ex: conceder uma conquista, registrar um item no inventário).

**Como usar a API Key:**

Para se autenticar como administrador ou aplicação cliente, você deve enviar duas informações no cabeçalho de cada requisição:

*   `x-tenant-id`: O identificador único do seu tenant (ex: `demo`).
*   `x-api-key`: A chave de API secreta.

```
x-tenant-id: <id_do_seu_tenant>
x-api-key: <sua_api_key>
```

### Gerenciamento de API Keys (Para o Painel de Administração)

Os endpoints a seguir são usados para gerenciar as API Keys de um tenant. Eles devem ser consumidos pelo painel de administração e requerem uma **API Key com privilégios de `admin`** para serem acessados.

---

#### `POST /client/apikeys`

Cria uma nova API Key.

**Corpo da Requisição:**

```json
{
  "projectId": "string (ID do Projeto ao qual a chave pertence)",
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string (opcional)"
}
```

**Exemplo de Resposta (Sucesso):**

```json
{
  "id": "string",
  "key": "string (a chave secreta - salve-a, pois ela não será mostrada novamente)",
  "prefix": "string (os 6 primeiros caracteres da chave, para identificação)",
  "projectId": "string",
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string"
}
```

---

#### `GET /client/apikeys`

Lista todas as API Keys de um tenant. Pode ser filtrado por projeto.

**Query Parameters:**

*   `projectId` (opcional): Filtra as chaves por um ID de projeto específico.

**Exemplo de Resposta (Sucesso):**

```json
[
  {
    "id": "string",
    "prefix": "string",
    "projectId": "string",
    "roles": ["admin" | "client"],
    "scopes": ["string"],
    "description": "string",
    "createdAt": "date-time",
    "revokedAt": "date-time | null"
  }
]
```

---

#### `PUT /client/apikeys/:id`

Atualiza os metadados de uma API Key existente (como `roles`, `scopes` e `description`).

**Corpo da Requisição:**

```json
{
  "roles": ["admin" | "client"],
  "scopes": ["string"],
  "description": "string"
}
```

---

#### `POST /client/apikeys/:id/revoke`

Revoga (desativa) uma API Key, tornando-a permanentemente inválida.

---

#### `POST /client/apikeys/:id/rotate`

Gera um novo segredo para uma API Key existente. O segredo antigo é invalidado. A resposta conterá a nova chave secreta, que deve ser salva imediatamente.

**Exemplo de Resposta (Sucesso):**

```json
{
  "id": "string",
  "key": "string (a NOVA chave secreta)",
  "prefix": "string (o novo prefixo)",
  ...
}
```

-Este documento está em construção.**