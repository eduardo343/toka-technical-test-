# Shared - Código Compartido

## 📋 Descripción

Esta carpeta contiene código reutilizable que debe ser compartido entre todos los microservicios. Ayuda a mantener consistencia, evitar duplicación y facilitar la comunicación entre servicios.

## 📁 Estructura

```
shared/
├── dto/        # Data Transfer Objects
├── events/     # Definiciones de eventos
└── utils/      # Utilidades comunes
```

---

## 🎯 DTOs (Data Transfer Objects)

**Ubicación**: `shared/dto/`

**Propósito**: Definir esquemas validados para la transferencia de datos entre servicios.

### Convenciones

```typescript
// user.dto.ts
interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}
```

### Ejemplos de DTOs Recomendados

```
dto/
├── user/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── auth/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── token-response.dto.ts
├── role/
│   ├── create-role.dto.ts
│   └── role-response.dto.ts
└── pagination.dto.ts      # Para respuestas paginadas
```

### Beneficios

- ✅ Validación centralizada
- ✅ Documentación de API automática
- ✅ Type safety en TypeScript
- ✅ Consistencia entre servicios

---

## 📡 Events (Eventos)

**Ubicación**: `shared/events/`

**Propósito**: Definir esquemas para eventos que se publican en RabbitMQ.

### Patrón de Eventos

```typescript
// user.events.ts

interface UserCreatedEvent {
  eventType: 'USER_CREATED';
  userId: string;
  email: string;
  timestamp: Date;
  version: number;
}

interface UserUpdatedEvent {
  eventType: 'USER_UPDATED';
  userId: string;
  changes: Record<string, any>;
  timestamp: Date;
  version: number;
}

interface UserDeletedEvent {
  eventType: 'USER_DELETED';
  userId: string;
  timestamp: Date;
  version: number;
}
```

### Estructura de Eventos Recomendada

```
events/
├── user/
│   ├── user-created.event.ts
│   ├── user-updated.event.ts
│   └── user-deleted.event.ts
├── auth/
│   ├── login-success.event.ts
│   └── logout.event.ts
├── audit/
│   └── audit-log.event.ts
└── event.interface.ts        # Interfaz base
```

### Interfaz Base Recomendada

```typescript
// event.interface.ts

export interface IEvent {
  eventType: string;
  timestamp: Date;
  userId?: string;
  version: number;
  metadata?: Record<string, any>;
}
```

### Consumir Eventos en Servicios

```typescript
// En user-service escuchando eventos

import { UserCreatedEvent } from '@shared/events';

class UserEventListener {
  async onUserCreated(event: UserCreatedEvent) {
    // Lógica de manejo
    console.log(`Usuario creado: ${event.userId}`);
  }
}
```

---

## 🔧 Utils (Utilidades)

**Ubicación**: `shared/utils/`

**Propósito**: Funciones auxiliares comunes reutilizables en múltiples servicios.

### Categorías de Utilidades

#### 1. **Validación**
```typescript
// validators.ts

export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}
```

#### 2. **JWT y Seguridad**
```typescript
// jwt.utils.ts

import jwt from 'jsonwebtoken';

export function generateToken(payload: any, secret: string, expiresIn = '1h'): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string, secret: string): any {
  return jwt.verify(token, secret);
}
```

#### 3. **Logging**
```typescript
// logger.ts

export class Logger {
  static info(message: string, data?: any): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  }

  static error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }

  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  }
}
```

#### 4. **Manejo de Errores**
```typescript
// errors.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} no encontrado`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(401, message);
  }
}
```

#### 5. **Transformación de Datos**
```typescript
// transformers.ts

export function camelCaseToSnakeCase(obj: any): any {
  // Convertir propiedades de camelCase a snake_case
}

export function paginate(items: any[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit
  };
}
```

### Estructura Recomendada de Utils

```
utils/
├── validators.ts       # Validaciones comunes
├── jwt.utils.ts       # Operaciones JWT
├── logger.ts          # Sistema de logging
├── errors.ts          # Clases de error personalizadas
├── transformers.ts    # Transformación de datos
├── constants.ts       # Constantes globales
├── database.ts        # Conexiones y helpers DB
└── http.ts            # Manejo de HTTP
```

---

## 📦 Importar desde Shared

### En TypeScript

```typescript
// En auth-service/src/controllers/auth.controller.ts

import { CreateUserDTO, UserResponseDTO } from '@shared/dto/user';
import { UserCreatedEvent } from '@shared/events/user';
import { isValidEmail, generateToken } from '@shared/utils';

class AuthController {
  createUser(dto: CreateUserDTO) {
    if (!isValidEmail(dto.email)) {
      throw new Error('Email inválido');
    }

    const token = generateToken({ email: dto.email });
    // ...
  }
}
```

### Alias de Importación (tsconfig.json)

Configurar alias para facilitar las importaciones:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../shared/*"]
    }
  }
}
```

---

## ✅ Mejores Prácticas

1. **Mantenga lo compartido pequeño**: Solo código verdaderamente reutilizable
2. **Versione los eventos**: Agregue campo `version` para evolucionar sin romper
3. **Documente los DTOs**: Agregue comentarios JSDoc para cada propiedad
4. **Valide en la entrada**: Los servicios deben validar que reciben lo esperado
5. **No guarde estado**: Las utilidades deben ser funciones puras
6. **Reutilice errores**: Defina errores comunes en `utils/errors.ts`

---

## 🔄 Versioning de Eventos

```typescript
interface UserCreatedEvent {
  eventType: 'USER_CREATED';
  userId: string;
  email: string;
  timestamp: Date;
  version: 1;  // ← Incrementar si cambia la estructura
}

// Versión futura:
// version: 2
// Agregar nuevos campos opcionalmente
```

---

## 📚 Referencias

- [NestJS - Shared Module](https://docs.nestjs.com/modules#shared-modules)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [DTO Pattern](https://en.wikipedia.org/wiki/Data_transfer_object)

---

**Última actualización**: Febrero 2026
