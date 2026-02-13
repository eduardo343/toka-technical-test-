# Guía de Desarrollo

## 🚀 Primeros Pasos

### Requisitos Previos

- **Node.js**: v16.x o superior
- **Docker & Docker Compose**: Última versión
- **Git**: Para control de versiones
- **IDE**: VS Code (recomendado)

### Configuración Inicial

1. **Clonar repositorio**
   ```bash
   git clone <repository-url>
   cd toka-technical-test
   ```

2. **Instalar dependencias globales**
   ```bash
   npm install -g typescript @nestjs/cli
   ```

3. **Iniciar infraestructura**
   ```bash
   docker-compose up -d
   ```

4. **Iniciar servicios en desarrollo**
   ```bash
   # En diferentes terminals
   cd services/auth-service && npm install && npm run dev
   cd services/user-service && npm install && npm run dev
   cd services/api-gateway && npm install && npm run dev
   # etc...
   ```

---

## 📁 Estructura de Directorios

### Crear un Nuevo Servicio

```bash
mkdir services/my-service
cd services/my-service
npm init -y

# Instalar dependencias base
npm install express typescript dotenv
npm install -D ts-node @types/node typescript

# Crear estructura
mkdir src tests
touch Dockerfile docker-compose.test.yml tsconfig.json .env.example
```

### Estructura Mínima de Servicio

```
my-service/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── dto/
│   ├── middleware/
│   ├── config/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── docker-compose.test.yml
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔧 Configuración de TypeScript

**tsconfig.json** recomendado:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../../shared/*"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 📝 Convenciones de Código

### Nombres

- **Clases**: `PascalCase` (ej: `UserController`)
- **Interfaces**: `PascalCase` prefijo con `I` (ej: `IUserService`)
- **Funciones**: `camelCase` (ej: `getUserById`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_RETRIES`)
- **Variables**: `camelCase` (ej: `isActive`)
- **Archivos**: `kebab-case.ts` (ej: `user.controller.ts`)

### Estructura de Archivos

```typescript
// 1. Imports (order: built-in, third-party, local)
import { Request, Response } from 'express';
import axios from 'axios';
import { UserService } from '@/services/user.service';

// 2. Interfaces y tipos
interface IUser {
  id: string;
  email: string;
}

// 3. Constantes
const DEFAULT_PAGE_SIZE = 20;

// 4. Clase/función principal
export class UserController {
  constructor(private userService: UserService) {}

  // Métodos: public primero, luego private
  async getUser(req: Request, res: Response) {
    // ...
  }

  private validateInput(data: any): boolean {
    // ...
  }
}

// 5. Exports al final
export { UserController };
```

### Documentación

```typescript
/**
 * Obtiene un usuario por su ID
 * 
 * @param userId - ID único del usuario
 * @returns Promise<IUser> - Datos del usuario
 * @throws {NotFoundError} - Si el usuario no existe
 * 
 * @example
 * const user = await userService.getUserById('123');
 */
async getUserById(userId: string): Promise<IUser> {
  // Implementación
}
```

---

## 🔄 Flujo de Desarrollo

### 1. Crear Feature

```bash
# Crear rama
git checkout -b feature/user-authentication

# Hacer cambios
# ...

# Commit
git add .
git commit -m "feat: implementar autenticación de usuarios"
```

### 2. Mensajes de Commit

Usar formato semántico:

```
feat:     Nueva funcionalidad
fix:      Corrección de bug
docs:     Cambios en documentación
style:    Cambios de formato (sin lógica)
refactor: Refactorización de código
test:     Agregar o actualizar tests
chore:    Tareas de build, dependencias, etc
```

Ejemplo:
```
feat(auth-service): agregar validación de contraseña fuerte
fix(user-service): corregir paginación de usuarios
docs: actualizar README de API Gateway
```

### 3. Crear Pull Request

```bash
git push origin feature/user-authentication
```

Descripción del PR:

```markdown
## Descripción
Implementa autenticación JWT en el servicio de autenticación.

## Cambios
- [x] Generar tokens JWT
- [x] Validar tokens
- [x] Refresh de tokens

## Testing
- [x] Tests unitarios (85% coverage)
- [x] Tests de integración
- [ ] Tests e2e

## Checklist
- [x] Documentación actualizada
- [x] Código reviewable
- [x] Sin hardcoded secrets
- [x] Error handling adecuado
```

---

## 🧪 Testing

### Unit Tests

```typescript
// user.service.spec.ts
import { UserService } from './user.service';
import { UserRepository } from '@/repositories';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;
    
    service = new UserService(repository);
  });

  describe('getUserById', () => {
    it('debería retornar un usuario', async () => {
      const userId = '123';
      const user = { id: userId, email: 'test@example.com' };

      repository.findById.mockResolvedValue(user);

      const result = await service.getUserById(userId);

      expect(result).toEqual(user);
      expect(repository.findById).toHaveBeenCalledWith(userId);
    });

    it('debería lanzar NotFoundError si usuario no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getUserById('invalid'))
        .rejects
        .toThrow('Usuario no encontrado');
    });
  });
});
```

### Integration Tests

```typescript
// user.controller.integration.spec.ts
import request from 'supertest';
import app from '@/app';

describe('UserController - Integration', () => {
  it('debería crear un usuario', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Tests específicos
npm run test -- user.service.spec.ts

# E2E
npm run test:e2e
```

---

## 🐛 Debugging

### VS Code

Agregar a `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Auth Service Debug",
      "program": "${workspaceFolder}/services/auth-service/src/server.ts",
      "restart": true,
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Logging

```typescript
// logger.ts
export class Logger {
  static info(module: string, message: string, data?: any) {
    console.log(`[INFO] [${module}] ${message}`, data);
  }

  static error(module: string, message: string, error: Error) {
    console.error(`[ERROR] [${module}] ${message}`, error.message);
  }

  static debug(module: string, message: string, data?: any) {
    if (process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] [${module}] ${message}`, data);
    }
  }
}

// Uso:
Logger.info('UserService', 'Usuario creado', { userId: '123' });
```

---

## 📦 Dependencias Comunes

### Node.js/Express

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "joi": "^17.9.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### Base de Datos

```json
{
  "dependencies": {
    "pg": "^8.10.0",
    "typeorm": "^0.3.0",
    "mongodb": "^6.0.0",
    "mongoose": "^7.0.0"
  }
}
```

### Utilidades

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "axios": "^1.4.0",
    "amqplib": "^0.10.0",
    "redis": "^4.6.0"
  }
}
```

---

## 🔒 Seguridad

### Variables de Entorno

Nunca commitear credenciales:

```bash
# .env (local - nunca commitear)
DB_PASSWORD=securePassword123

# .env.example (públic - para documentación)
DB_PASSWORD=change_me_in_production
```

### Validación de Entrada

```typescript
import Joi from 'joi';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required()
});

async function createUser(req, res) {
  const { error, value } = createUserSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details });
  }

  // Procesar value validado
}
```

### Secrets Management

```typescript
// No hacer esto:
const apiKey = 'sk-123456789';  // ❌ NUNCA

// Hacer esto:
const apiKey = process.env.OPENAI_API_KEY;  // ✅ BIEN
```

---

## 🚀 Deployment

### Build

```bash
npm run build
```

### Docker

```dockerfile
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Environment Variables en Producción

```bash
# Usar secrets management de tu plataforma (AWS Secrets, etc)
# NO usar .env en producción
```

---

## 📚 Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Microservices Patterns](https://microservices.io/patterns/index.html)

---

**Última actualización**: Febrero 2026
