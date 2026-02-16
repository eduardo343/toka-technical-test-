# Toka Technical Test

Prueba técnica backend con arquitectura de microservicios sobre NestJS, PostgreSQL, MongoDB, RabbitMQ y Redis.

## Alcance implementado

- 4 microservicios backend:
  - `auth-service`
  - `user-service`
  - `role-service`
  - `audit-service`
- Comunicación síncrona por REST y asíncrona por eventos con RabbitMQ.
- Autenticación distribuida con OAuth2/OIDC (issuer central en `auth-service`).
- Logging estructurado en JSON en todos los servicios.
- Dockerización por microservicio + `docker-compose.yml` levantando infraestructura y microservicios.
- Persistencia multi-DB:
  - PostgreSQL (`auth-service`, `user-service`, `role-service`)
  - MongoDB (`audit-service`)
  - Redis en infraestructura.

## Arquitectura de alto nivel

```text
Clients
  |
  | OAuth2 / OIDC token issuance
  v
auth-service (3001) -------------------------------> RabbitMQ (5672)
  |  \                                                 |   |   |
  |   \ REST Bearer token (RS256)                     |   |   +--> auth.login.v1
  |    -------------------------------------------    |   +------> role.created.v1
  |                                                |   +----------> user.created.v1
  v                                                v
user-service (3000)                          audit-service (3003, MongoDB)
role-service (3002)

PostgreSQL:
- toka_db    (auth)
- toka_users (user)
- toka_roles (role)
```

## Estructura por microservicio (evidencia DDD/Clean)

### `role-service`

- `src/domain/role/*` -> entidades, contratos (puertos), eventos de dominio.
- `src/application/roles/use-cases/*` -> casos de uso.
- `src/infrastructure/persistence/typeorm/*` -> adaptadores de persistencia.
- `src/infrastructure/messaging/*` -> adaptadores de mensajería.
- `src/infrastructure/auth/*` -> validación de JWT/OIDC.
- `src/interfaces/http/*` -> controladores y DTOs.

### `audit-service`

- `src/domain/audit/*` -> modelo y contrato de repositorio.
- `src/application/audit/use-cases/*` -> casos de uso.
- `src/infrastructure/persistence/mongo/*` -> repositorio Mongo.
- `src/infrastructure/messaging/*` -> consumidores de eventos.
- `src/infrastructure/auth/*` -> validación de JWT/OIDC.
- `src/interfaces/http/*` -> endpoints REST.

`auth-service` y `user-service` mantienen separación por módulos y ownership de datos; el diseño más explícito de Clean/DDD está reflejado en `role-service` y `audit-service`.

## OAuth2/OIDC distribuido

Issuer: `auth-service`.

Endpoints OIDC/OAuth2:

- `POST /oauth/token`
  - `grant_type=password`
  - `grant_type=client_credentials`
- `GET /.well-known/openid-configuration`
- `GET /.well-known/jwks.json`

Validación en servicios consumidores (`user`, `role`, `audit`):

- algoritmo `RS256`
- `issuer` esperado (`OIDC_ISSUER`)
- `audience` esperada (`OIDC_AUDIENCE`)
- guard `JwtAuthGuard` en endpoints protegidos.

## Eventos asíncronos

Patrones de evento:

- `user.created.v1`
- `role.created.v1`
- `auth.login.v1`

Colas:

- `user_events` (consumida por `user-service`)
- `audit_events` (consumida por `audit-service`)

## Logging estructurado JSON

Cada servicio incluye:

- `src/shared/logging/json-logger.service.ts`
- `src/shared/logging/request-logger.middleware.ts`

Campos emitidos en logs:

- `timestamp`
- `level`
- `service`
- `context`
- `message`
- `trace` (cuando aplica)
- `type`, `method`, `path`, `statusCode`, `durationMs` para access logs HTTP.

## Docker

### Dockerfiles por microservicio

- `services/auth-service/Dockerfile`
- `services/user-service/Dockerfile`
- `services/role-service/Dockerfile`
- `services/audit-service/Dockerfile`

### Compose full stack

`docker-compose.yml` levanta:

- Infraestructura:
  - `postgres`
  - `mongodb`
  - `redis`
  - `rabbitmq`
  - `qdrant`
- Microservicios:
  - `auth-service`
  - `user-service`
  - `role-service`
  - `audit-service`

## Ejecución local

### 1) Levantar todo

```bash
docker compose up -d --build
```

Si aparecen contenedores huérfanos por cambios de compose:

```bash
docker compose up -d --build --remove-orphans
```

### 2) Verificar estado de contenedores

```bash
docker compose ps
```

### 3) Verificar OAuth/OIDC

Token por password grant:

```bash
curl -X POST http://localhost:3001/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{
    "grant_type": "password",
    "client_id": "toka-internal-client",
    "client_secret": "toka-internal-secret",
    "username": "admin@test.com",
    "password": "secret123"
  }'
```

Metadata OIDC:

```bash
curl http://localhost:3001/.well-known/openid-configuration
```

JWKS:

```bash
curl http://localhost:3001/.well-known/jwks.json
```

### 4) Verificar endpoints protegidos

Con `ACCESS_TOKEN`:

```bash
curl http://localhost:3000/users -H "Authorization: Bearer $ACCESS_TOKEN"
curl http://localhost:3002/roles -H "Authorization: Bearer $ACCESS_TOKEN"
curl http://localhost:3003/audits -H "Authorization: Bearer $ACCESS_TOKEN"
```

Sin token deben responder `401`.

## Variables de entorno (resumen)

### `auth-service`

- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- OAuth/OIDC: `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_KEY_ID`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`
- Mensajería: `RMQ_URL`, `RMQ_QUEUE`, `AUDIT_EVENTS_QUEUE`

### `user-service`, `role-service`, `audit-service`

- Validación de token: `OIDC_ISSUER`, `OIDC_AUDIENCE`
- Colas RMQ según servicio.
- DB según servicio (Postgres o Mongo).

Ver ejemplos completos en cada `.env.example`.

## Endpoints principales

### auth-service (`:3001`)

- `POST /auth/register`
- `POST /auth/login`
- `POST /oauth/token`
- `GET /auth/profile` (protegido)
- `GET /.well-known/openid-configuration`
- `GET /.well-known/jwks.json`

### user-service (`:3000`)

- `GET /users` (protegido)
- `GET /users/:id` (protegido)
- `POST /users` (protegido)
- `PATCH /users/:id` (protegido)
- `DELETE /users/:id` (protegido)

### role-service (`:3002`)

- `GET /roles` (protegido)
- `GET /roles/:id` (protegido)
- `POST /roles` (protegido)
- `PATCH /roles/:id` (protegido)
- `DELETE /roles/:id` (protegido)

### audit-service (`:3003`)

- `GET /audits` (protegido)

