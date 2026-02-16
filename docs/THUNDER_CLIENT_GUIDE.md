# Guía Thunder Client

Esta guía prueba el flujo completo usando VS Code + Thunder Client.

## 1. Variables de entorno recomendadas en Thunder Client

Crea un environment llamado `local` con:

- `base_auth` = `http://localhost:3001`
- `base_users` = `http://localhost:3000`
- `base_roles` = `http://localhost:3002`
- `base_audits` = `http://localhost:3003`
- `email` = `demo@toka.com`
- `password` = `secret123`
- `access_token` = `` (vacío inicialmente)

## 2. Requests sugeridos (orden de ejecución)

### 2.1 Register

- Method: `POST`
- URL: `{{base_auth}}/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

Esperado: `201` con `access_token`.

### 2.2 Login

- Method: `POST`
- URL: `{{base_auth}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

Esperado: `201` con `access_token`.

Guardar token en variable `access_token`.

### 2.3 Profile (token validación)

- Method: `GET`
- URL: `{{base_auth}}/auth/profile`
- Headers:
  - `Authorization: Bearer {{access_token}}`

Esperado: `200` con identidad (`userId`, `email`).

### 2.4 Users - list

- Method: `GET`
- URL: `{{base_users}}/users`
- Headers:
  - `Authorization: Bearer {{access_token}}`

Esperado: `200`.

### 2.5 Users - create

- Method: `POST`
- URL: `{{base_users}}/users`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{access_token}}`
- Body:

```json
{
  "email": "new.user@toka.com",
  "name": "New User"
}
```

Esperado: `201`.

### 2.6 Roles - create

- Method: `POST`
- URL: `{{base_roles}}/roles`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{access_token}}`
- Body:

```json
{
  "name": "admin",
  "description": "Administración global"
}
```

Esperado: `201`.

### 2.7 Roles - list

- Method: `GET`
- URL: `{{base_roles}}/roles`
- Headers:
  - `Authorization: Bearer {{access_token}}`

Esperado: `200`.

### 2.8 Audits - list

- Method: `GET`
- URL: `{{base_audits}}/audits?limit=20`
- Headers:
  - `Authorization: Bearer {{access_token}}`

Esperado: `200`, eventos como `user.created.v1`, `auth.login.v1`, `role.created.v1`.

## 3. Pruebas negativas recomendadas

### 3.1 Sin token

Enviar `GET {{base_users}}/users` sin header `Authorization`.

Esperado: `401 Unauthorized`.

### 3.2 Token inválido

Enviar cualquier endpoint protegido con `Authorization: Bearer invalid`.

Esperado: `401 Unauthorized`.

### 3.3 Payload inválido

Enviar login con email inválido.

Esperado: `400 Bad Request`.

## 4. Requests alternativos vía frontend

Si prefieres probar a través del proxy del frontend (Nginx), usa `http://localhost:5173`:

- `POST http://localhost:5173/auth/login`
- `GET http://localhost:5173/users`
- `GET http://localhost:5173/roles`
- `GET http://localhost:5173/audits`

La semántica de headers y bodies es la misma.
