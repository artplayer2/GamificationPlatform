# Setup

## Requirements
- Node.js 18+
- MongoDB 6+
- npm

## Install
```bash
npm install
```

## Run (dev)
```bash
npm run start:dev
# http://localhost:3000/v1
# Swagger: http://localhost:3000/v1/docs
```

## Build & Run (prod)
```bash
npm run build
# Option A (Nest CLI):
npm run start
# Option B (Node on compiled output):
node dist/src/main.js
```

> Nota: se você já estiver com um servidor rodando (porta 3000 ocupada), encerre o processo antes de iniciar outro. Em Windows:
> `netstat -ano | findstr LISTENING | findstr :3000` e depois `taskkill /PID <PID> /F`.
