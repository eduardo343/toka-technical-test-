# Toka Technical Test

Prueba técnica backend basada en microservicios con NestJS, PostgreSQL y RabbitMQ.

## Objetivo

Implementar un sistema de autenticación y perfiles de usuario con:

- separación por bounded context (`auth-service` y `user-service`)
- consistencia eventual por eventos
- configuración por entorno validada
- infraestructura local reproducible con Docker Compose

## Arquitectura

```
clients -> auth-service (HTTP + JWT) -> PostgreSQL (toka_db)
                  |
                  | emits user.created.v1
                  v
             RabbitMQ (queue: user_events)
                  |
                  v
          user-service (HTTP + RMQ consumer) -> PostgreSQL (toka_users)
```

### Bounded Contexts

- `auth-service`: ownership de credenciales, hash de contraseña y emisión de evento de alta.
- `user-service`: ownership de perfil (`email`, `name`) y CRUD de usuarios.

No hay lectura/escritura directa entre bases de datos entre servicios.

## Estructura

```
toka-technical-test/
├── docker-compose.yml
├── infrastructure/
│   └── postgres/init/01-create-user-service-db.sql
└── services/
    ├── auth-service/
    │   ├── src/
    │   │   ├── app.module.ts
    │   │   ├── config/env.validation.ts
    │   │   ├── data-source.ts
    │   │   ├── migrations/
    │   │   └── auth/
    │   └── .env.example
    └── user-service/
        ├── src/
        │   ├── app.module.ts
        │   ├── config/env.validation.ts
        │   ├── data-source.ts
        │   ├── migrations/
        │   └── users/
        └── .env.example
```

## Stack

- NestJS 11
- TypeORM 0.3
- PostgreSQL 15
- RabbitMQ 3 (management)
- Redis 7
- MongoDB 7
- Qdrant

## Levantar infraestructura

```bash
docker compose up -d
```

Si tu volumen de PostgreSQL ya existía antes de agregar el script de init, resetea volumen para crear `toka_users`:

```bash
docker compose down -v
docker compose up -d
```

## Variables de entorno

### auth-service (`services/auth-service/.env`)

| Variable | Ejemplo |
| --- | --- |
| `PORT` | `3001` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5433` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME` | `toka_db` |
| `DB_MIGRATIONS_RUN` | `true` |
| `JWT_SECRET` | `replace-with-secure-value` |
| `JWT_EXPIRES_IN` | `1h` |
| `RMQ_URL` | `amqp://guest:guest@localhost:5672` |
| `RMQ_QUEUE` | `user_events` |

### user-service (`services/user-service/.env`)

| Variable | Ejemplo |
| --- | --- |
| `PORT` | `3000` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5433` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME` | `toka_users` |
| `DB_MIGRATIONS_RUN` | `true` |
| `RMQ_URL` | `amqp://guest:guest@localhost:5672` |
| `RMQ_QUEUE` | `user_events` |

## Ejecutar servicios

```bash
# auth-service
cd services/auth-service
npm install
npm run migration:run
npm run start:dev
```

```bash
# user-service
cd services/user-service
npm install
npm run migration:run
npm run start:dev
```

## Endpoints

### auth-service (`http://localhost:3001`)

- `POST /auth/register` body: `{ "email": "user@test.com", "password": "secret123" }`
- `POST /auth/login` body: `{ "email": "user@test.com", "password": "secret123" }`
- `GET /auth/profile` header: `Authorization: Bearer <token>`

### user-service (`http://localhost:3000`)

- `GET /users`
- `GET /users/:id`
- `POST /users` body: `{ "email": "user@test.com", "name": "Alan" }`
- `PATCH /users/:id` body: `{ "name": "Nuevo Nombre" }`
- `DELETE /users/:id`

## Contrato de eventos

- exchange/pattern principal: `user.created.v1`
- patrón legacy soportado en consumidor: `user.created`
- payload:

```json
{
  "id": "uuid",
  "email": "user@test.com",
  "name": "optional",
  "occurredAt": "2026-02-16T10:00:00.000Z"
}
```

## Flujo E2E esperado

1. Cliente registra usuario en `auth-service`.
2. `auth-service` guarda credencial y publica `user.created.v1`.
3. `user-service` consume el evento y materializa el perfil.
4. Cliente inicia sesión y usa JWT contra rutas protegidas.

## Calidad técnica aplicada

- `synchronize: false` y migraciones iniciales por servicio.
- Validación de variables de entorno al bootstrap.
- Cola de RabbitMQ durable.
- Manejo de conflictos (`email` duplicado) con `409 Conflict`.
- Separación explícita de ownership de datos entre servicios.

## Backlog recomendado (senior)

1. Outbox pattern en `auth-service` para garantizar entrega de eventos.
2. OpenTelemetry + correlation-id para trazabilidad distribuida.
3. Health checks (`/health`) y readiness/liveness para despliegue.
4. Contract tests para payloads RMQ versionados.
5. CI pipeline con lint, test, build y migration check.
