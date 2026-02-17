# API Reference

Base URLs locales:

- Auth: `http://localhost:3001`
- Users: `http://localhost:3000`
- Roles: `http://localhost:3002`
- Audits: `http://localhost:3003`
- AI (objetivo): `http://localhost:3004`

## 1. Auth Service (`auth-service`)

### `POST /auth/register`

Registra credencial y publica evento `user.created.v1`.

Body:

```json
{
  "email": "demo@toka.com",
  "password": "secret123"
}
```

Reglas:

- `email`: formato válido.
- `password`: mínimo 6 caracteres.

Respuesta esperada (`201`):

```json
{
  "user": {
    "id": "uuid",
    "email": "demo@toka.com"
  },
  "access_token": "jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Errores comunes:

- `409` usuario ya existe.
- `400` body inválido.

### `POST /auth/login`

Body:

```json
{
  "email": "demo@toka.com",
  "password": "secret123"
}
```

Respuesta esperada (`201`):

```json
{
  "access_token": "jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Errores comunes:

- `401` credenciales inválidas.
- `400` body inválido.

### `POST /oauth/token`

#### Password grant

Body:

```json
{
  "grant_type": "password",
  "client_id": "toka-internal-client",
  "client_secret": "toka-internal-secret",
  "username": "demo@toka.com",
  "password": "secret123",
  "scope": "openid profile email"
}
```

#### Client credentials grant

Body:

```json
{
  "grant_type": "client_credentials",
  "client_id": "toka-internal-client",
  "client_secret": "toka-internal-secret",
  "scope": "openid audit:read roles:write"
}
```

Respuesta esperada (`201`):

```json
{
  "access_token": "jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Errores comunes:

- `401` client credentials inválidas.
- `400` grant_type o payload inválido.

### `GET /auth/profile`

Requiere `Authorization: Bearer <token>`.

Respuesta esperada (`200`):

```json
{
  "userId": "uuid",
  "email": "demo@toka.com"
}
```

### `GET /.well-known/openid-configuration`

Metadata OIDC del issuer.

### `GET /.well-known/jwks.json`

JWKS pública para validación de firmas.

## 2. User Service (`user-service`)

Todos los endpoints requieren Bearer token válido.

### `GET /users`

Lista usuarios.

### `POST /users`

Body:

```json
{
  "email": "user@toka.com",
  "name": "User Name"
}
```

Reglas:

- `email` válido.
- `name` mínimo 2 caracteres.

### `GET /users/:id`

- `id` debe ser UUID válido.

### `PATCH /users/:id`

Body (parcial):

```json
{
  "name": "Nuevo Nombre"
}
```

### `DELETE /users/:id`

Elimina usuario por UUID.

## 3. Role Service (`role-service`)

Todos los endpoints requieren Bearer token válido.

### `GET /roles`

Lista roles.

### `POST /roles`

Body:

```json
{
  "name": "admin",
  "description": "Administración global"
}
```

Reglas:

- `name` mínimo 2 caracteres.
- `description` opcional.

### `GET /roles/:id`

### `PATCH /roles/:id`

Body (parcial):

```json
{
  "description": "Permisos ampliados"
}
```

### `DELETE /roles/:id`

## 4. Audit Service (`audit-service`)

Todos los endpoints requieren Bearer token válido.

### `GET /audits`

Query params:

- `limit` opcional, entero entre `1` y `200`.

Ejemplo:

```bash
curl "http://localhost:3003/audits?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 5. AI Service (`ai-service`)

Base URL local:

- `http://localhost:3004`

Endpoints implementados:

- `GET /ai/health`
- `POST /ai/ingest/users`
- `POST /ai/ask`
- `POST /ai/evaluate`

### `POST /ai/ingest/users`

Body opcional:

```json
{
  "limit": 50
}
```

Indexa usuarios del `user-service` en Qdrant.

### `POST /ai/ask`

Body:

```json
{
  "question": "¿Qué endpoint crea usuarios?",
  "topK": 5
}
```

Ver detalle técnico en `docs/AI_RAG.md`.

## 6. Errores transversales

- `400 Bad Request`: DTO inválido / datos mal formados.
- `401 Unauthorized`: token ausente, expirado o inválido.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: entidad duplicada (por ejemplo, usuario existente).

## 7. Frontend API routing

En modo Docker, el frontend usa Nginx como reverse proxy:

- `/auth`, `/oauth`, `/.well-known` -> `auth-service:3001`
- `/users` -> `user-service:3000`
- `/roles` -> `role-service:3002`
- `/audits` -> `audit-service:3003`
- `/ai` -> `ai-service:3004`

Por eso desde browser se usa `http://localhost:5173/...`.
