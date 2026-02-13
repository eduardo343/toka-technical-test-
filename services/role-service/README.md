# Role Service

## 📋 Descripción

Servicio de gestión de roles y permisos. Define qué acciones pueden realizar los usuarios basándose en sus roles asignados.

## 🎯 Responsabilidades

- ✅ Crear roles
- ✅ Asignar permisos a roles
- ✅ Asignar roles a usuarios
- ✅ Validar permisos
- ✅ Listar roles y permisos
- ✅ Revocar accesos

## 🏗️ Estructura Recomendada

```
role-service/
├── src/
│   ├── controllers/
│   │   └── role.controller.ts
│   ├── services/
│   │   ├── role.service.ts
│   │   └── permission.service.ts
│   ├── repositories/
│   │   └── role.repository.ts
│   ├── dto/
│   │   ├── create-role.dto.ts
│   │   └── assign-role.dto.ts
│   ├── entities/
│   │   ├── role.entity.ts
│   │   └── permission.entity.ts
│   ├── config/
│   │   └── permissions.config.ts
│   ├── app.ts
│   └── server.ts
├── Dockerfile
├── package.json
└── README.md
```

## 🗂️ Base de Datos

### Tabla: roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,  -- true para admin, user, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: permissions
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL,  -- users, roles, audit
  action VARCHAR(100) NOT NULL,    -- create, read, update, delete
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: role_permissions
```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### Tabla: user_roles
```sql
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);
```

## 🔑 Roles Predefinidos

```typescript
export enum DefaultRoles {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}
```

### Admin
- Acceso completo a todo
- Puede crear/editar/eliminar roles
- Puede auditar logs

### Moderator
- Gestionar usuarios
- Ver logs de auditoría
- No puede modificar roles

### User
- Acceso a su perfil
- Acceso a datos públicos
- Sin permisos administrativos

### Guest
- Acceso anónimo
- Solo lectura de datos públicos

## 📋 Permisos Predefinidos

```typescript
export enum Permissions {
  // Users
  'users:read' = 'Leer usuarios',
  'users:create' = 'Crear usuarios',
  'users:update' = 'Actualizar usuarios',
  'users:delete' = 'Eliminar usuarios',
  
  // Roles
  'roles:read' = 'Leer roles',
  'roles:create' = 'Crear roles',
  'roles:update' = 'Actualizar roles',
  'roles:delete' = 'Eliminar roles',
  
  // Audit
  'audit:read' = 'Leer logs de auditoría',
  'audit:delete' = 'Eliminar logs',
  
  // AI
  'ai:generate' = 'Usar IA generativa',
  'ai:advanced' = 'Usar IA avanzada'
}
```

## 📡 APIs

### GET /roles
```typescript
Response (200):
{
  "data": [
    {
      "id": "uuid",
      "name": "admin",
      "description": "Administrador del sistema",
      "permissions": [
        "users:read", "users:create", "users:update", "users:delete",
        "roles:read", "roles:create", ...
      ]
    }
  ],
  "total": 4
}
```

### POST /roles
```typescript
Request:
{
  "name": "editor",
  "description": "Editor de contenido",
  "permissions": ["users:read", "audit:read"]
}

Response (201):
{
  "id": "uuid",
  "name": "editor",
  "description": "Editor de contenido",
  "permissions": ["users:read", "audit:read"]
}
```

### PUT /roles/:id
```typescript
Request:
{
  "description": "Editor senior de contenido",
  "permissions": ["users:read", "users:update", "audit:read"]
}

Response (200):
{
  "id": "uuid",
  "name": "editor",
  ...updated data...
}
```

### DELETE /roles/:id
```typescript
Response (204):
```

### POST /users/:userId/roles/:roleId
```typescript
Request:
{
  "assignedAt": "2026-02-13T10:30:00Z",
  "expiresAt": "2027-02-13T10:30:00Z"  // opcional
}

Response (200):
{
  "userId": "uuid",
  "roleId": "uuid",
  "assignedAt": "2026-02-13T10:30:00Z"
}
```

### DELETE /users/:userId/roles/:roleId
```typescript
Response (204):
```

### GET /users/:userId/permissions
```typescript
Response (200):
{
  "userId": "uuid",
  "permissions": [
    "users:read",
    "users:update",
    "audit:read"
  ]
}
```

## 🔐 Validación de Permisos

### Middleware Guard
```typescript
// permission.guard.ts
export function requirePermission(permission: string) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Permiso denegado',
        required: permission
      });
    }
    
    next();
  };
}

// Uso:
app.delete('/users/:id', requirePermission('users:delete'), deleteUser);
```

### Service Validation
```typescript
async hasPermission(userId: string, permission: string): Promise<boolean> {
  const userRoles = await this.getUserRoles(userId);
  const permissions = await this.getRolePermissions(userRoles);
  return permissions.includes(permission);
}
```

## 📨 Eventos Publicados

```typescript
// ROLE_CREATED
{
  "eventType": "ROLE_CREATED",
  "roleId": "uuid",
  "name": "editor",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}

// PERMISSION_ASSIGNED
{
  "eventType": "PERMISSION_ASSIGNED",
  "userId": "uuid",
  "roleId": "uuid",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}

// PERMISSION_REVOKED
{
  "eventType": "PERMISSION_REVOKED",
  "userId": "uuid",
  "roleId": "uuid",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}
```

## 🚀 Ejecución

```bash
npm install
cp .env.example .env
npm run migrate   # Crear roles y permisos predefinidos
npm run dev
```

## 🔧 Variables de Entorno

```env
PORT=3003
NODE_ENV=development

DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=users_db

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
```

---

**Última actualización**: Febrero 2026
