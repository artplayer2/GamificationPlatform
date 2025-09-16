# Gamification Platform API — Starter (NestJS + TypeScript)

Este repositório é um *ponto de partida* mínimo para a plataforma de gamificação. Vamos evoluir junto, passo a passo.

## O que você encontra aqui
- NestJS + TypeScript
- Health check (`GET /v1/health`)
- Middleware de **tenant** (`x-tenant-id`)
- Módulos: **Projects**, **Players**, **Progression (XP)**
- MongoDB via Mongoose
- Dockerfile + docker-compose
- DTOs com class-validator

## Rodando localmente
```bash
cp .env .env
npm i -g @nestjs/cli
npm i
npm run start:dev
```
API em `http://localhost:3000/v1`.

## Rodando com Docker Compose
```bash
cp .env .env
docker compose up --build
```

## Cabeçalho obrigatório
`x-tenant-id: demo` (ou outro valor).

## Rotas exemplo
- `GET /v1/health`
- `POST /v1/projects` → `{ name, features? }`
- `GET /v1/projects`
- `POST /v1/players` → `{ projectId, username }`
- `GET /v1/players/:id`
- `POST /v1/progression/xp` → `{ playerId, amount, reason }`

> Regra provisória de nível: **1 nível a cada 1000 XP**.

## Próximos passos guiados
1. Entender o `main.ts` e `app.module.ts` (como o Nest sobe).
2. Ver o middleware de tenant e por que ele existe.
3. Criar/ler projetos e jogadores (via Postman/Insomnia).
4. Persistir no Mongo e ver as coleções.
5. Escrever testes básicos e adicionar Swagger (OpenAPI).
