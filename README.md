# Toka Technical Test

Sistema de microservicios desarrollado con **NestJS** y **TypeScript** que implementa autenticación JWT y gestión de usuarios.

## 📋 Descripción del Proyecto

Este proyecto es una prueba técnica que demuestra la implementación de una arquitectura de microservicios con las siguientes características:

- **Autenticación segura** con JWT y bcrypt
- **Gestión de usuarios** con operaciones CRUD
- **Arquitectura modular** con NestJS
- **Infraestructura containerizada** con Docker Compose

## 🏗️ Arquitectura del Proyecto

```
toka-technical-test/
├── services/
│   ├── user-service/                 # Microservicio de usuarios (puerto 3000)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── users/
│   │   │       ├── users.module.ts
│   │   │       ├── users.controller.ts
│   │   │       ├── users.service.ts
│   │   │       ├── dto/
│   │   │       │   ├── create-user.dto.ts
│   │   │       │   └── update-user.dto.ts
│   │   │       └── entities/
│   │   │           └── user.entity.ts
│   │   ├── test/
│   │   ├── .env
│   │   └── package.json
│   │
│   └── auth-service/                 # Microservicio de autenticación (puerto 3001)
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   └── auth/
│       │       ├── auth.module.ts
│       │       ├── auth.controller.ts
│       │       ├── auth.service.ts
│       │       ├── strategies/
│       │       │   └── jwt.strategy.ts
│       │       ├── guards/
│       │       │   └── jwt-auth.guard.ts
│       │       ├── dto/
│       │       │   ├── login.dto.ts
│       │       │   └── register.dto.ts
│       │       └── entities/
│       │           └── user.entity.ts
│       ├── test/
│       ├── .env
│       └── package.json
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| NestJS | 11.x | Framework backend |
| TypeScript | 5.7.x | Lenguaje de programación |
| TypeORM | 0.3.x | ORM para base de datos |
| PostgreSQL | 15 | Base de datos relacional |
| MongoDB | 7 | Base de datos NoSQL |
| Redis | 7 | Cache y sesiones |
| RabbitMQ | 3 | Message broker |
| Qdrant | latest | Base de datos vectorial |
| JWT | - | Autenticación |
| bcrypt | 6.x | Hash de contraseñas |

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js >= 18
- Docker y Docker Compose
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd toka-technical-test
```

### 2. Levantar la infraestructura con Docker

```bash
docker-compose up -d
```

Esto iniciará los siguientes servicios:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL | 5433 | Base de datos principal |
| MongoDB | 27017 | Base de datos NoSQL |
| Redis | 6379 | Cache |
| RabbitMQ | 5672, 15672 | Message broker (15672 = panel admin) |
| Qdrant | 6333 | Base de datos vectorial |

### 3. Instalar dependencias e iniciar servicios

**Auth Service:**
```bash
cd services/auth-service
npm install
npm run start:dev
```

**User Service:**
```bash
cd services/user-service
npm install
npm run start:dev
```

## 📡 API Endpoints

### Auth Service (Puerto 3001)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar usuario | `{ email, password }` |
| POST | `/auth/login` | Iniciar sesión | `{ email, password }` |
| GET | `/auth/profile` | Obtener perfil (protegido) | Header: `Authorization: Bearer <token>` |

### User Service (Puerto 3000)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| GET | `/users` | Listar usuarios | - |
| GET | `/users/:id` | Obtener usuario | - |
| POST | `/users` | Crear usuario | `{ email, name }` |
| PATCH | `/users/:id` | Actualizar usuario | `{ email?, name? }` |
| DELETE | `/users/:id` | Eliminar usuario | - |

## 🔐 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para la autenticación:

1. **Registro**: El usuario se registra con email y contraseña. La contraseña se hashea con bcrypt.
2. **Login**: El usuario inicia sesión y recibe un token JWT.
3. **Rutas protegidas**: Se envía el token en el header `Authorization: Bearer <token>`.

### Ejemplo de uso:

```bash
# Registrar usuario
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Acceder a ruta protegida
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <tu-token-jwt>"
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📁 Estructura de Módulos NestJS

Cada microservicio sigue la estructura modular de NestJS:

```
service/
├── src/
│   ├── main.ts              # Punto de entrada
│   ├── app.module.ts        # Módulo raíz
│   └── <module>/            # Módulo de funcionalidad
│       ├── <module>.module.ts
│       ├── <module>.controller.ts
│       ├── <module>.service.ts
│       ├── dto/             # Data Transfer Objects
│       ├── entities/        # Entidades TypeORM
│       ├── guards/          # Guards de autenticación
│       └── strategies/      # Estrategias de Passport
└── .env                     # Variables de entorno
```

## 🔧 Variables de Entorno

Puedes configurar las siguientes variables (actualmente hardcodeadas para desarrollo):

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=toka_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
```

## 📝 Comandos Útiles

```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build
npm run start:prod

# Linting
npm run lint

# Formateo de código
npm run format

# Docker - levantar servicios
docker-compose up -d

# Docker - detener servicios
docker-compose down

# Docker - ver logs
docker-compose logs -f
```

## 📄 Licencia

Este proyecto está bajo la licencia UNLICENSED.
