# REST API (Quick Examples)

All requests (except health/docs) must include the tenant header:
```
x-tenant-id: demo
```

## Create Project
`POST /v1/projects`
```json
{ "name": "demo", "plan": "free" }
```

## Create Player
`POST /v1/players`
```json
{ "projectId": "<PROJECT_ID>", "username": "the_wizard_77" }
```

## Award XP
`POST /v1/progression/xp`
```json
{ "playerId": "<PLAYER_ID>", "amount": 250, "reason": "quest:starter", "idempotencyKey": "xp-00001-abc" }
```

## Wallet Credit/Debit
`POST /v1/inventory/wallet/credit`
```json
{ "playerId": "<PLAYER_ID>", "currency": "soft", "amount": 100, "idempotencyKey": "op-123456", "reason": "purchase:small_pack" }
```
`POST /v1/inventory/wallet/debit`
```json
{ "playerId": "<PLAYER_ID>", "currency": "hard", "amount": 10, "idempotencyKey": "op-123457", "reason": "store:buy_item" }
```

## Items Consume
`POST /v1/items/consume`
```json
{ "projectId":"<PROJECT_ID>", "code":"potion_small", "playerId":"<PLAYER_ID>", "qty":1, "idempotencyKey":"item-consume-001", "reason":"use_in_battle" }
```

## Store Purchase
`POST /v1/store/purchase`
```json
{ "projectId":"<PROJECT_ID>", "skuCode":"bundle_potions_small", "playerId":"<PLAYER_ID>", "qty":1, "idempotencyKey":"order-0001-a", "reason":"promo:launch" }
```
