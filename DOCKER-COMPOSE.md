# Docker Compose - Infraestructura

## 📝 Descripción

Este archivo define toda la infraestructura de servicios necesarios para el proyecto Toka Technical Test. Incluye bases de datos, sistemas de mensajería y los microservicios principales.

## 🗄️ Bases de Datos

### PostgreSQL (5432)
```yaml
image: postgres:15
environment:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  POSTGRES_DB: users_db
```

**Propósito**: Base de datos relacional principal para usuarios, roles y auditoría.

**Conexión**:
```
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: postgres
Base de datos: users_db
```

**Herramientas recomendadas**: pgAdmin, DBeaver, psql

---

### MongoDB (27017)
```yaml
image: mongo:7
```

**Propósito**: Base de datos NoSQL para almacenamiento flexible de documentos.

**Conexión**:
```
URL: mongodb://localhost:27017
```

---

### Redis (6379)
```yaml
image: redis:7
```

**Propósito**:
- Cache distribuido
- Almacenamiento de sesiones
- Rate limiting
- Pub/Sub en tiempo real

**Conexión**:
```
Host: localhost
Puerto: 6379
```

---

### Qdrant (6333)
```yaml
image: qdrant/qdrant
```

**Propósito**: Base de datos vectorial especializada en búsqueda semántica y embeddings.

**Panel Web**: http://localhost:6333

**Casos de uso**:
- Búsqueda semántica
- Recomendaciones basadas en IA
- Clustering de documentos

---

## 📨 Mensajería

### RabbitMQ (5672, 15672)
```yaml
image: rabbitmq:3-management
```

**Propósito**: Message Broker para comunicación asincrónica entre servicios.

**Puertos**:
- **5672**: Puerto AMQP (para aplicaciones)
- **15672**: Panel de Management Web

**Acceso al Panel**:
```
URL: http://localhost:15672
Usuario: guest
Contraseña: guest
```

**Casos de uso**:
- Notificaciones
- Procesamiento en background
- Eventos de auditoría
- Comunicación desacoplada entre servicios

---

## 🔧 Microservicios

### auth-service (3001)
```yaml
build: ./services/auth-service
ports:
  - "3001:3001"
depends_on:
  - postgres
  - redis
```

**Funcionalidad**: Autenticación, autorización y validación de tokens JWT.

**Dependencias internas**:
- PostgreSQL: Almacenar credenciales y datos de usuario
- Redis: Cache de tokens y sesiones

---

### user-service (3002)
```yaml
build: ./services/user-service
ports:
  - "3002:3002"
depends_on:
  - postgres
  - rabbitmq
```

**Funcionalidad**: Gestión de usuarios, perfiles y datos personales.

**Dependencias internas**:
- PostgreSQL: Almacenar datos de usuarios
- RabbitMQ: Publicar eventos de usuario (creación, actualización, eliminación)

---

## 🚀 Comandos Útiles

### Iniciar servicios
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f
docker-compose logs -f auth-service
docker-compose logs -f user-service
```

### Parar servicios
```bash
docker-compose down
```

### Recrear servicios
```bash
docker-compose up -d --build
```

### Ejecutar comando en contenedor
```bash
docker-compose exec postgres psql -U postgres -d users_db
docker-compose exec redis redis-cli
```

### Eliminar volúmenes (limpiar datos)
```bash
docker-compose down -v
```

---

## 📊 Flujo de Datos

```
Cliente HTTP
    ↓
API Gateway (puerto 3000)
    ↓
    ├→ auth-service (3001) → PostgreSQL + Redis
    ├→ user-service (3002) → PostgreSQL + RabbitMQ
    ├→ role-service → PostgreSQL
    ├→ ai-service → Qdrant
    └→ audit-service → PostgreSQL + RabbitMQ
```

---

## ✅ Checklist de Startup

- [ ] PostgreSQL iniciado y accesible en puerto 5432
- [ ] MongoDB iniciado en puerto 27017
- [ ] Redis iniciado en puerto 6379
- [ ] RabbitMQ iniciado (AMQP: 5672, Management: 15672)
- [ ] Qdrant iniciado en puerto 6333
- [ ] auth-service construido y corriendo en puerto 3001
- [ ] user-service construido y corriendo en puerto 3002

---

## 🔗 Variables de Entorno

Ver archivo `.env` para la configuración específica de cada servicio.

Variables comunes esperadas:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=users_db
REDIS_HOST=redis
RABBITMQ_HOST=rabbitmq
QDRANT_URL=http://qdrant:6333
```

---

**Última actualización**: Febrero 2026
