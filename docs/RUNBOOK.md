# Runbook Operativo

## 1. Prerrequisitos

- Docker + Docker Compose
- Node.js 20+ (si ejecutar servicios/frontend fuera de Docker)
- npm 10+

## 2. Arranque completo con Docker

Desde la raíz del repo:

```bash
cd /Users/alan/toka-technical-test
docker compose up -d --build --remove-orphans
```

Verificar estado:

```bash
docker compose ps
```

Verificar servicios detectados por compose:

```bash
docker compose config --services
```

## 3. Verificaciones rápidas de plataforma

### OIDC disponible

```bash
curl http://localhost:3001/.well-known/openid-configuration
curl http://localhost:3001/.well-known/jwks.json
```

### RabbitMQ disponible

- UI: [http://localhost:15672](http://localhost:15672)
- Usuario/Password: `guest` / `guest`

### Frontend disponible

- URL: [http://localhost:5173](http://localhost:5173)

## 4. Flujo funcional mínimo (cURL)

### 4.1 Register

```bash
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@toka.com","password":"secret123"}'
```

### 4.2 Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@toka.com","password":"secret123"}'
```

Guardar `access_token` en `ACCESS_TOKEN`.

### 4.3 Endpoints protegidos

```bash
curl http://localhost:3000/users -H "Authorization: Bearer $ACCESS_TOKEN"
curl http://localhost:3002/roles -H "Authorization: Bearer $ACCESS_TOKEN"
curl http://localhost:3003/audits -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 5. Variables de entorno relevantes

### `auth-service`

Requeridas:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_NAME`
- `DB_PASSWORD` o `DB_PASS`

Opcionales clave:

- `PORT` (default `3001`)
- `JWT_EXPIRES_IN` (default `1h`)
- `RMQ_URL` (default `amqp://guest:guest@localhost:5672`)
- `RMQ_QUEUE` (default `user_events`)
- `AUDIT_EVENTS_QUEUE` (default `audit_events`)
- `OIDC_ISSUER` (default `http://localhost:3001`)
- `OIDC_AUDIENCE` (default `toka-api`)
- `OAUTH_CLIENT_ID` (default `toka-internal-client`)
- `OAUTH_CLIENT_SECRET` (default `toka-internal-secret`)
- `DB_MIGRATIONS_RUN` (default `true`)

### `user-service`

Requeridas:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_NAME`
- `DB_PASSWORD` o `DB_PASS`

Opcionales clave:

- `PORT` (default `3000`)
- `RMQ_URL` (default `amqp://guest:guest@localhost:5672`)
- `RMQ_QUEUE` (default `user_events`)
- `OIDC_ISSUER` (default `http://localhost:3001`)
- `OIDC_AUDIENCE` (default `toka-api`)
- `DB_MIGRATIONS_RUN` (default `true`)

### `role-service`

Requeridas:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_NAME`
- `DB_PASSWORD` o `DB_PASS`

Opcionales clave:

- `PORT` (default `3002`)
- `RMQ_URL` (default `amqp://guest:guest@localhost:5672`)
- `AUDIT_EVENTS_QUEUE` (default `audit_events`)
- `OIDC_ISSUER` (default `http://localhost:3001`)
- `OIDC_AUDIENCE` (default `toka-api`)
- `DB_MIGRATIONS_RUN` (default `true`)

### `audit-service`

Requeridas:

- `MONGO_URI`

Opcionales clave:

- `PORT` (default `3003`)
- `RMQ_URL` (default `amqp://guest:guest@localhost:5672`)
- `AUDIT_EVENTS_QUEUE` (default `audit_events`)
- `OIDC_ISSUER` (default `http://localhost:3001`)
- `OIDC_AUDIENCE` (default `toka-api`)

### `frontend`

Ver `frontend/.env.example`:

- `VITE_AUTH_API_URL`
- `VITE_USER_API_URL`
- `VITE_ROLE_API_URL`
- `VITE_AUDIT_API_URL`

En este proyecto se recomienda vacías para usar proxy (`Vite` en dev o `Nginx` en Docker).

## 6. Testing y build

### Backend

```bash
cd services/auth-service && npm ci && npm run test:cov && npm run build
cd services/user-service && npm ci && npm run test:cov && npm run build
cd services/role-service && npm ci && npm run test:cov && npm run build
cd services/audit-service && npm ci && npm run test:cov && npm run build
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
npm run test:run
npm run test:coverage
```

### Script local equivalente a CI backend

```bash
./scripts/backend-ci-local.sh
```

## 7. Operación diaria

### Ver logs por servicio

```bash
docker compose logs -f auth-service
docker compose logs -f user-service
docker compose logs -f role-service
docker compose logs -f audit-service
docker compose logs -f frontend
```

### Reiniciar un servicio

```bash
docker compose restart auth-service
```

### Rebuild de un servicio

```bash
docker compose up -d --build auth-service
```

### Apagar stack

```bash
docker compose down
```

## 8. Troubleshooting

### `container name already in use` (ej. `toka_mongo`)

```bash
docker rm -f toka_mongo
docker compose up -d --build --remove-orphans
```

### Orphan containers

```bash
docker compose up -d --remove-orphans
```

### `401 Unauthorized` en `user-service`, `role-service`, `audit-service`

Checklist:

- Token emitido por `auth-service`.
- Header `Authorization: Bearer <token>` presente.
- Coincidencia `OIDC_ISSUER` y `OIDC_AUDIENCE` entre servicios.

### Servicio no expone endpoint esperado

1. Confirmar estado:

```bash
docker compose ps
```

2. Revisar logs:

```bash
docker compose logs --tail=200 <service-name>
```
