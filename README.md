# Toka Technical Test - Microservicios

## 📋 Descripción General

Proyecto de arquitectura de microservicios diseñado con una estructura moderna y escalable. Incluye múltiples servicios independientes que se comunican entre sí, componentes compartidos y una base de datos distribuida.

## 🏗️ Arquitectura del Proyecto

```
toka-technical-test/
├── frontend/                    # Aplicación frontend (vacío)
├── services/                    # Microservicios principales
│   ├── ai-service/             # Servicio de inteligencia artificial
│   ├── api-gateway/            # Puerta de entrada API (proxy/enrutador)
│   ├── audit-service/          # Servicio de auditoría y logs
│   ├── auth-service/           # Autenticación y autorización
│   ├── role-service/           # Gestión de roles y permisos
│   └── user-service/           # Gestión de usuarios
├── shared/                      # Código compartido entre servicios
│   ├── dto/                    # Data Transfer Objects (esquemas)
│   ├── events/                 # Definición de eventos
│   └── utils/                  # Utilidades comunes
├── docker-compose.yml          # Orquestación de contenedores
└── .env                        # Variables de entorno
```

## 🔧 Infraestructura (Docker Compose)

### Servicios de Base de Datos y Mensajería

| Servicio | Puerto | Propósito |
|----------|--------|-----------|
| **PostgreSQL** | 5432 | Base de datos relacional principal |
| **MongoDB** | 27017 | Base de datos NoSQL (documentos) |
| **Redis** | 6379 | Cache distribuido y sesiones |
| **RabbitMQ** | 5672, 15672 | Message Broker para comunicación asincrónica |
| **Qdrant** | 6333 | Base de datos vectorial (búsqueda semántica) |

### Microservicios

| Servicio | Puerto | Dependencias |
|----------|--------|--------------|
| **auth-service** | 3001 | PostgreSQL, Redis |
| **user-service** | 3002 | PostgreSQL, RabbitMQ |

## 📁 Estructura de Carpetas Detallada

### `/services`
Contiene los microservicios independientes. Cada servicio debe tener su propia estructura:

```
service-example/
├── src/                   # Código fuente
├── tests/                # Tests unitarios e integración
├── Dockerfile            # Configuración de contenedor
├── package.json          # Dependencias (si es Node.js)
└── README.md            # Documentación del servicio
```

### `/shared`
Código reutilizable entre servicios:

- **`dto/`**: Definiciones de Data Transfer Objects para consistencia de datos
- **`events/`**: Esquemas y tipos de eventos para RabbitMQ
- **`utils/`**: Funciones auxiliares comunes (logging, validación, etc.)

## 🔌 Patrones de Comunicación

### Sincrónica
- **API REST**: Entre servicios a través de API Gateway
- **gRPC** (opcional): Para comunicación de alto rendimiento

### Asincrónica
- **RabbitMQ**: Para eventos y mensajería entre servicios
- **Patrón Publish/Subscribe**: Decoupling de servicios

## 🚀 Cómo Empezar

### Requisitos Previos
- Docker y Docker Compose instalados
- Node.js v16+ (si usas TypeScript/JavaScript)

### Iniciar el Proyecto

```bash
# Clonar repositorio
git clone <repository-url>
cd toka-technical-test

# Iniciar todos los servicios
docker-compose up -d

# Verificar estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Parar los Servicios

```bash
docker-compose down
```

## 📝 Convenciones de Desarrollo

### Naming
- **Servicios**: `kebab-case` (ej: `auth-service`)
- **Funciones/Variables**: `camelCase` (ej: `getUserById`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_RETRY_ATTEMPTS`)

### Estructura de Código
- Separación clara de capas (routes, controllers, services, repositories)
- Código limpio y bien documentado
- Validación en puntos de entrada (DTOs)
- Manejo centralizado de errores

### Git
- Commits semánticos (`feat:`, `fix:`, `docs:`, etc.)
- Una rama por feature/bugfix
- Pull requests con descripción detallada

## 🔐 Seguridad

- **Auth Service**: JWT o OAuth2 para autenticación
- **Variables Sensibles**: Usar archivo `.env` (nunca commitear)
- **CORS**: Configurar en API Gateway según necesidad
- **Validación**: Validar todos los inputs en DTOs

## 📊 Monitoreo y Logs

- **RabbitMQ Management**: http://localhost:15672 (usuario: guest, contraseña: guest)
- **PostgreSQL**: puerto 5432 para herramientas externas
- **Redis CLI**: `docker-compose exec redis redis-cli`

## 🧪 Testing

Estructura recomendada:

```
service/tests/
├── unit/           # Tests unitarios
├── integration/    # Tests de integración
└── e2e/           # Tests end-to-end
```

## 📚 Documentación

### Documentación General
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura del sistema, flujos y patrones
- [DOCKER-COMPOSE.md](DOCKER-COMPOSE.md) - Guía completa de infraestructura
- [DEVELOPMENT.md](DEVELOPMENT.md) - Guía de desarrollo local
- [CONTRIBUTING.md](CONTRIBUTING.md) - Cómo contribuir al proyecto
- [shared/README.md](shared/README.md) - DTOs, eventos y utilidades compartidas

### Servicios
- [Auth Service](./services/auth-service/README.md) - Autenticación y autorización
- [User Service](./services/user-service/README.md) - Gestión de usuarios y perfiles
- [API Gateway](./services/api-gateway/README.md) - Punto de entrada y enrutamiento
- [Role Service](./services/role-service/README.md) - Gestión de roles y permisos
- [AI Service](./services/ai-service/README.md) - Inteligencia artificial
- [Audit Service](./services/audit-service/README.md) - Logging y auditoría

## 📄 Licencia

[Aquí va la licencia del proyecto]

## 👥 Contribuciones

[Directrices de contribución]

---

**Última actualización**: Febrero 2026
