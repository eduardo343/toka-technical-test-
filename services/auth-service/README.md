# Auth Service

## 📋 Descripción

Servicio encargado de autenticación, autorización y gestión de tokens. Este es el punto central para validar identidad de usuarios y emitir tokens JWT.

## 🎯 Responsabilidades

- ✅ Autenticación de usuarios (login)
- ✅ Registro de nuevos usuarios
- ✅ Generación y validación de tokens JWT
- ✅ Gestión de sesiones
- ✅ Refresh de tokens
- ✅ Logout
- ✅ Cambio de contraseña
- ✅ Recuperación de contraseña

## 🏗️ Estructura Recomendada

```
auth-service/
├── src/
│   ├── controllers/          # Controladores HTTP
│   │   └── auth.controller.ts
│   ├── services/            # Lógica de negocio
│   │   ├── auth.service.ts
│   │   └── token.service.ts
│   ├── repositories/        # Acceso a datos
│   │   └── auth.repository.ts
│   ├── dto/                # Data Transfer Objects locales
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── token-response.dto.ts
│   ├── middleware/         # Middleware personalizado
│   │   └── auth.middleware.ts
│   ├── guards/             # Guards de seguridad
│   │   └── jwt.guard.ts
│   ├── config/             # Configuración
│   │   └── auth.config.ts
│   ├── constants/          # Constantes del servicio
│   │   └── auth.constants.ts
│   ├── app.ts              # Aplicación principal
│   └── server.ts           # Servidor
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── docker-compose.test.yml
├── package.json
├── tsconfig.json
├── .env.example
└── README.md               # Este archivo
```

## 🔄 Flujos Principales

### Login
```
POST /auth/login
├─ Validar credenciales (email + password)
├─ Buscar usuario en BD
├─ Verificar contraseña
├─ Validar si está activo
├─ Generar JWT token
├─ Guardar sesión en Redis
└─ Retornar token + refresh token
```

### Register
```
POST /auth/register
├─ Validar email no exista
├─ Validar contraseña fuerte
├─ Hash de contraseña
├─ Crear usuario en BD
├─ Generar JWT inicial
└─ Publicar evento USER_CREATED
```

### Token Refresh
```
POST /auth/refresh
├─ Validar refresh token
├─ Verificar en Redis
├─ Generar nuevo access token
└─ Retornar nuevo token
```

## 💾 Base de Datos

### Tabla: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Seguridad

### JWT Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234571490,
    "roles": ["user"]
  },
  "signature": "..."
}
```

### Contraseñas
- **Hash**: bcrypt (saltRounds: 10)
- **Requisitos**: 
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos un número
  - Al menos un carácter especial

## 📡 APIs

### POST /auth/register
```typescript
Request:
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!"
}

Response (201):
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 3600
}
```

### POST /auth/login
```typescript
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John"
  },
  "expiresIn": 3600
}
```

### POST /auth/refresh
```typescript
Request:
{
  "refreshToken": "refresh_token"
}

Response (200):
{
  "accessToken": "new_jwt_token",
  "expiresIn": 3600
}
```

### POST /auth/logout
```typescript
Request Headers:
Authorization: Bearer jwt_token

Response (204):
// Sin contenido
```

### POST /auth/verify-token
```typescript
Request:
{
  "token": "jwt_token"
}

Response (200):
{
  "valid": true,
  "payload": { ... }
}
```

## 🔗 Integraciones

### PostgreSQL
- Almacenar usuarios y contraseñas
- Almacenar tokens de refresh

### Redis
- Cache de sesiones activas
- Blacklist de tokens revocados
- Rate limiting para login

## 📨 Eventos Publicados

```typescript
// USER_REGISTERED
{
  "eventType": "USER_REGISTERED",
  "userId": "uuid",
  "email": "user@example.com",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}

// LOGIN_SUCCESS
{
  "eventType": "LOGIN_SUCCESS",
  "userId": "uuid",
  "email": "user@example.com",
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}
```

## 🛡️ Middleware Recomendado

### Auth Middleware
```typescript
// Verificar JWT en requests protegidos
middleware.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  
  try {
    req.user = verify(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});
```

### Rate Limiting
```typescript
// Limitar intentos de login
app.post('/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5                       // 5 intentos máximo
}), loginController);
```

## 🧪 Testing

### Unit Tests
```typescript
describe('AuthService', () => {
  it('debería registrar un nuevo usuario', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const result = await authService.register(dto);
    expect(result.email).toBe(dto.email);
  });
});
```

### Integration Tests
- Crear usuario → Login → Refresh token
- Validar token con Redis
- Logout y verificar blacklist

## 🚀 Ejecución

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
npm run migrate

# Iniciar en desarrollo
npm run dev

# Tests
npm run test

# Build
npm run build

# Producción
npm run start
```

## 📊 Métricas Recomendadas

- Tasa de registros exitosos
- Tasa de logins fallidos
- Tokens generados/refrescados
- Tiempo de respuesta de autenticación
- Intentos de tokens inválidos

## 🔗 Dependencias Típicas

```json
{
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "pg": "^8.10.0",
  "redis": "^4.6.0",
  "dotenv": "^16.0.0",
  "joi": "^17.9.0"
}
```

## ⚙️ Variables de Entorno Recomendadas

```env
# Servidor
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=3600
REFRESH_TOKEN_EXPIRATION=86400

# Base de datos
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=users_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Seguridad
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

**Última actualización**: Febrero 2026
