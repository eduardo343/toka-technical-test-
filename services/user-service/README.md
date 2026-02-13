# User Service

## 📋 Descripción

Servicio responsable de gestión de perfiles de usuario, datos personales y preferencias. Maneja la creación, lectura, actualización y eliminación de usuarios.

## 🎯 Responsabilidades

- ✅ Crear nuevos usuarios
- ✅ Obtener información de usuario
- ✅ Actualizar perfil de usuario
- ✅ Eliminar usuarios
- ✅ Listar usuarios (con paginación)
- ✅ Buscar usuarios
- ✅ Gestionar preferencias
- ✅ Publicar eventos de cambios

## 🏗️ Estructura Recomendada

```
user-service/
├── src/
│   ├── controllers/         # Controladores HTTP
│   │   └── user.controller.ts
│   ├── services/           # Lógica de negocio
│   │   ├── user.service.ts
│   │   └── profile.service.ts
│   ├── repositories/       # Acceso a datos
│   │   └── user.repository.ts
│   ├── dto/               # DTOs del servicio
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   └── user-response.dto.ts
│   ├── entities/          # Modelos de BD
│   │   └── user.entity.ts
│   ├── events/            # Publicadores de eventos
│   │   └── user-event.publisher.ts
│   ├── middleware/        # Middleware
│   │   └── auth.middleware.ts
│   ├── config/            # Configuración
│   │   └── database.config.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔄 Flujos Principales

### Obtener Usuario
```
GET /users/:id
├─ Validar token JWT
├─ Verificar autorizaciones (es propietario o admin)
├─ Buscar usuario en BD
├─ Retornar datos públicos/privados según permisos
└─ Incluir fotografía y relaciones
```

### Actualizar Usuario
```
PUT /users/:id
├─ Validar token JWT
├─ Validar que sea propietario o admin
├─ Validar datos en DTO
├─ Actualizar en BD
├─ Publicar evento USER_UPDATED
└─ Retornar usuario actualizado
```

### Listar Usuarios
```
GET /users?page=1&limit=10&search=john
├─ Validar autorizaciones
├─ Filtrar por búsqueda
├─ Paginar resultados
├─ Retornar con metadata (total, página, etc)
└─ Incluir solo datos públicos
```

### Eliminar Usuario
```
DELETE /users/:id
├─ Validar token JWT
├─ Verificar que sea propietario o admin
├─ Soft delete (marcar como inactivo) o eliminación física
├─ Publicar evento USER_DELETED
└─ Retornar 204 No Content
```

## 💾 Base de Datos

### Tabla: user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  biography TEXT,
  profile_picture_url VARCHAR(500),
  date_of_birth DATE,
  address VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON user_profiles(user_id);
```

### Tabla: user_preferences
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_newsletter BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'es',
  privacy_level VARCHAR(50) DEFAULT 'private',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📡 APIs

### GET /users/:id
```typescript
Response (200):
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profile": {
    "phone": "+34600123456",
    "biography": "Software Developer",
    "profilePictureUrl": "https://...",
    "dateOfBirth": "1990-01-01",
    "city": "Madrid",
    "country": "Spain",
    "isPublic": true
  },
  "preferences": {
    "notificationsEnabled": true,
    "emailNewsletter": true,
    "theme": "dark",
    "language": "es"
  },
  "createdAt": "2026-02-01T00:00:00Z"
}
```

### GET /users?page=1&limit=10
```typescript
Response (200):
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### PUT /users/:id
```typescript
Request:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "profile": {
    "phone": "+34600654321",
    "biography": "Senior Developer",
    "city": "Barcelona"
  },
  "preferences": {
    "theme": "light",
    "language": "en"
  }
}

Response (200):
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  ...actualized data...
}
```

### DELETE /users/:id
```typescript
Response (204):
// Sin contenido
```

### POST /users/:id/profile-picture
```typescript
Request:
multipart/form-data
file: <image>

Response (200):
{
  "id": "uuid",
  "profilePictureUrl": "https://s3.bucket.com/profiles/uuid.jpg"
}
```

### GET /users/search?q=john
```typescript
Response (200):
{
  "results": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  ],
  "total": 5
}
```

## 📨 Eventos Publicados

```typescript
// USER_CREATED
{
  "eventType": "USER_CREATED",
  "userId": "uuid",
  "email": "user@example.com",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}

// USER_UPDATED
{
  "eventType": "USER_UPDATED",
  "userId": "uuid",
  "changes": {
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}

// USER_DELETED
{
  "eventType": "USER_DELETED",
  "userId": "uuid",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}
```

## 🔗 Eventos Consumidos

```typescript
// USER_REGISTERED (desde auth-service)
{
  "eventType": "USER_REGISTERED",
  "userId": "uuid",
  "email": "user@example.com"
}

// Acción: Crear entrada en user_profiles
```

## 🎯 DTOs Principales

### CreateUserDTO
```typescript
interface CreateUserDTO {
  email: string;           // email@example.com
  firstName: string;       // 1-100 caracteres
  lastName: string;        // 1-100 caracteres
}
```

### UpdateUserDTO
```typescript
interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  profile?: {
    phone?: string;
    biography?: string;
    dateOfBirth?: Date;
    city?: string;
    country?: string;
  };
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notificationsEnabled?: boolean;
  };
}
```

### UserResponseDTO
```typescript
interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Autorización

### Niveles de Acceso

```typescript
// Obtener usuario - puede el propietario o admin
GET /users/:id
- userId en token === :id -> PERMITIDO
- rol admin -> PERMITIDO
- otro -> DENEGADO

// Actualizar usuario - solo propietario o admin
PUT /users/:id
- userId en token === :id -> PERMITIDO
- rol admin -> PERMITIDO
- otro -> DENEGADO

// Eliminar usuario - solo propietario o admin
DELETE /users/:id
- userId en token === :id -> PERMITIDO
- rol admin -> PERMITIDO
- otro -> DENEGADO

// Listar usuarios - solo admin o datos públicos
GET /users
- admin -> VER TODO
- usuario normal -> VER SOLO PÚBLICOS
```

## 🔗 Integraciones

### Auth Service
- Validar tokens JWT
- Autorizar operaciones

### RabbitMQ
- Publicar eventos USER_CREATED, USER_UPDATED, USER_DELETED
- Consumir USER_REGISTERED

### PostgreSQL
- Almacenar perfiles y preferencias

### S3/Cloud Storage (opcional)
- Guardar fotos de perfil

## 🧪 Testing

```typescript
describe('UserService', () => {
  it('debería obtener un usuario por ID', async () => {
    const user = await userService.getUserById(userId);
    expect(user.id).toBe(userId);
  });

  it('debería actualizar perfil de usuario', async () => {
    const dto = { firstName: 'Jane' };
    const result = await userService.updateUser(userId, dto);
    expect(result.firstName).toBe('Jane');
  });
});
```

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

## 💾 Conexión a Auth Service

```typescript
// Verificar token
import { verifyToken } from '@shared/utils';

class UserController {
  async getUser(req, res) {
    try {
      const user = verifyToken(req.headers.authorization);
      // ...
    } catch (error) {
      res.status(401).json({ error: 'No autorizado' });
    }
  }
}
```

## 📊 Métricas Recomendadas

- Total de usuarios activos
- Usuarios registrados por día
- Tasa de actualización de perfiles
- Usuarios eliminados
- Tiempo de respuesta de APIs

## 🔧 Variables de Entorno

```env
PORT=3002
NODE_ENV=development

DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=users_db

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

AUTH_SERVICE_URL=http://auth-service:3001

# Almacenamiento
S3_BUCKET=profiles-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=
S3_SECRET_KEY=

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

**Última actualización**: Febrero 2026
