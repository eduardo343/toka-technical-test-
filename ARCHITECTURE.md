# ARCHITECTURE.md - Arquitectura del Sistema

## 🏗️ Visión General

El proyecto **Toka Technical Test** es una arquitectura de **microservicios** basada en eventos. Los servicios se comunican de forma sincrónica (HTTP REST) y asincrónica (RabbitMQ), permitiendo escalabilidad independiente.

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend/Mobile)                 │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTP/HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Puerto 3000)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Autenticación JWT                                     │   │
│  │  • Rate Limiting                                         │   │
│  │  • Enrutamiento a servicios                             │   │
│  │  • Caché de respuestas                                  │   │
│  │  • Error handling centralizado                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─┬────────────────────────────────────────────────────────────────┘
  │
  ├─ HTTP ─► AUTH SERVICE (3001)
  │          ├─ PostgreSQL (credenciales)
  │          └─ Redis (sesiones)
  │
  ├─ HTTP ─► USER SERVICE (3002)
  │          ├─ PostgreSQL (perfiles)
  │          └─ RabbitMQ (eventos)
  │
  ├─ HTTP ─► ROLE SERVICE (3003)
  │          └─ PostgreSQL (roles/permisos)
  │
  ├─ HTTP ─► AI SERVICE (3004)
  │          ├─ Qdrant (vectores)
  │          └─ OpenAI API (LLM)
  │
  └─ HTTP ─► AUDIT SERVICE (3005)
             ├─ PostgreSQL (logs)
             └─ RabbitMQ (eventos)

Comunicación Asincrónica (RabbitMQ):
┌──────────────────────────────────────────────────────────┐
│ Topic Exchange: 'events'                                  │
├──────────────────────────────────────────────────────────┤
│ Routing Keys:                                             │
│  • user.registered    → Consumen: audit, user, role     │
│  • user.updated       → Consumen: audit                  │
│  • user.deleted       → Consumen: audit                  │
│  • login.success      → Consume: audit                   │
│  • permission.changed → Consume: audit                   │
│  • ai.content.generated → Consume: audit                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujos Principales

### 1. Autenticación y Registro

```
Cliente
   │
   ├─ POST /auth/register
   │  │
   │  └──► API Gateway
   │       │
   │       └──► AUTH SERVICE
   │            │
   │            ├─ Validar email (BD)
   │            ├─ Hash contraseña
   │            ├─ Crear usuario (PostgreSQL)
   │            ├─ Generar JWT
   │            │
   │            └─ Publicar evento USER_REGISTERED
   │               │
   │               └──► RabbitMQ
   │                    │
   │                    ├──► AUDIT SERVICE (log)
   │                    ├──► USER SERVICE (crear perfil)
   │                    └──► ROLE SERVICE (asignar role default)
   │
   └──► Retornar { token, user }
```

### 2. Obtener Usuario con Autorización

```
Cliente (con JWT)
   │
   ├─ GET /users/:id
   │  │
   │  └──► API Gateway
   │       │
   │       ├─ Verificar JWT (Auth Service)
   │       ├─ Validar permisos (Role Service)
   │       │
   │       └──► USER SERVICE
   │            │
   │            ├─ Obtener datos de usuario
   │            ├─ Obtener perfil
   │            ├─ Obtener preferencias
   │            │
   │            └──► Retornar datos
   │
   └──► Respuesta al cliente
```

### 3. Generar Contenido con IA

```
Cliente (con JWT)
   │
   ├─ POST /ai/generate
   │  │
   │  └──► API Gateway
   │       │
   │       ├─ Validar token
   │       ├─ Validar permisos (ai:generate)
   │       │
   │       └──► AI SERVICE
   │            │
   │            ├─ Llamar OpenAI API
   │            ├─ Procesar respuesta
   │            ├─ Cachear resultado (Redis)?
   │            │
   │            └─ Publicar evento CONTENT_GENERATED
   │               │
   │               └──► AUDIT SERVICE (log)
   │
   └──► Retornar contenido generado
```

---

## 🔌 Patrones de Comunicación

### Comunicación Sincrónica (HTTP/REST)

**Cuándo usar:**
- Consultas que requieren respuesta inmediata
- Operaciones CRUD
- Validaciones

**Ejemplo:**
```typescript
// API Gateway enruta a Auth Service
GET /auth/verify-token → AUTH SERVICE → respuesta inmediata
```

**Ventajas:**
- Simple y directo
- Respuesta inmediata
- Fácil debugging

**Desventajas:**
- Acoplamiento entre servicios
- Si A está caído, B no puede continuar
- Mayor latencia

### Comunicación Asincrónica (RabbitMQ)

**Cuándo usar:**
- Notificaciones
- Logging de eventos
- Operaciones en background
- Desacoplamiento de servicios

**Ejemplo:**
```typescript
// USER SERVICE publica evento
await rabbitmq.publish('events', 'user.created', {
  userId: '123',
  email: 'user@example.com'
});

// AUDIT SERVICE se suscriba y procesa
rabbitmq.subscribe('user.*', (event) => {
  auditService.log(event);
});
```

**Ventajas:**
- Desacoplamiento total
- Escalabilidad independiente
- Tolerancia a fallos

**Desventajas:**
- Eventual consistency
- Más complejo de debuggear
- Requiere idempotencia

---

## 💾 Estrategia de Datos

### PostgreSQL (Datos Relacionales)

**Servicios:**
- auth-service (usuarios, credenciales)
- user-service (perfiles, preferencias)
- role-service (roles, permisos)
- audit-service (logs de auditoría)

**Características:**
- ACID transactions
-FK constraints
- Índices
- Full-text search

### MongoDB (Datos NoSQL)

**Servicios:** (Reservado para expansión)
- Datos semiestructurados
- Crecimiento rápido

### Redis (Cache/Sessions)

**Servicios:**
- auth-service (sesiones, tokens)
- api-gateway (caché de respuestas, rate limiting)

### Qdrant (Vector Database)

**Servicios:**
- ai-service (embeddings, búsqueda semántica)

---

## 🔐 Seguridad

### Autenticación

```
┌─────────────────────────────────────────────────┐
│ Cliente envía credenciales                      │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ AUTH SERVICE verifica en PostgreSQL              │
│ • Email existe                                   │
│ • Contraseña coincide (bcrypt)                  │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Generar JWT con payload:                        │
│ • sub: user_id                                   │
│ • email: user@example.com                       │
│ • roles: ['user']                               │
│ • iat: timestamp                                │
│ • exp: timestamp + 3600s                        │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Cliente guarda token en localStorage/sessionStorage
│ Envía en header: Authorization: Bearer <token> │
└─────────────────────────────────────────────────┘
```

### Autorización

```
┌─────────────────────────────────────────────────┐
│ API Gateway recibe request con JWT              │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Verificar JWT signature                         │
│ ¿Token válido? ✓ o X                           │
│ ¿Ha expirado? X                                 │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Extraer payload: { sub, roles, permissions }  │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Servicio destino valida permisos:              │
│ ¿Tiene permiso users:read?                     │
└────────────────────────────────────────────────┘
```

---

## 📈 Escalabilidad

### Horizontal Scaling

```
Load Balancer (nginx)
    │
    ├─► AUTH SERVICE instance 1
    ├─► AUTH SERVICE instance 2
    └─► AUTH SERVICE instance 3

Todos accediendo al mismo PostgreSQL con conexión pooling
```

### Cache Layer

```
Cliente request
    │
    ▼
API Gateway
    │
    ├─ ¿Existe en Redis? ✓ → Retornar
    │
    └─ No encontrado
       │
       ▼
    USER SERVICE
       │
       ▼
    PostgreSQL
       │
       ▼
    Guardar en Redis (TTL: 5 min)
       │
       ▼
    Retornar a cliente
```

### Database Optimization

- **Índices:** En campos frecuentemente consultados
- **Connection Pooling:** PostgreSQL
- **Read Replicas:** Para consultas de lectura
- **Sharding:** Si es necesario en el futuro

---

## 🔄 Ciclo de Vida de una Request

```
1. INGRESO
   Cliente → API Gateway:3000

2. AUTENTICACIÓN
   API Gateway valida JWT
   ├─ Válido → Continuar
   └─ Inválido → Error 401

3. AUTORIZACIÓN
   Role Service valida permisos
   ├─ Permitido → Continuar
   └─ Denegado → Error 403

4. RATE LIMITING
   ├─ Bajo límite → Continuar
   └─ Límite excedido → Error 429

5. ENRUTAMIENTO
   API Gateway enruta a servicio destino

6. PROCESAMIENTO
   Servicio procesa la request

7. EVENTOS
   Publicar evento a RabbitMQ si corresponde

8. RESPUESTA
   API Gateway retorna respuesta

9. CACHÉ
   Guardar en Redis si es GET

10. AUDITORÍA
    AUDIT SERVICE registra la operación
```

---

## 🎯 Principios de Diseño

### Separation of Concerns
- Cada servicio tiene responsabilidad única y clara
- No se comparten BD entre servicios
- Comunicación definida

### Eventual Consistency
- Los servicios no garantizan consistencia inmediata
- RabbitMQ entrega eventos de forma eventual
- DTOs aseguran formato consistente

### Fault Isolation
- Error en un servicio no afecta otros
- Timeouts previenen cascada de fallos
- Circuit breakers implementados

### Single Responsibility
```
auth-service    → Autenticación únicamente
user-service    → Gestión de perfiles únicamente
role-service    → Gestión de roles únicamente
ai-service      → Inteligencia artificial únicamente
audit-service   → Logging de eventos únicamente
```

---

## 🚨 Manejo de Fallos

### Timeouts
```typescript
// Si un servicio tarda > 5s, timeout
const response = await axios.get(url, { timeout: 5000 });
```

### Retry Logic
```typescript
// Reintentar con backoff exponencial
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    return await callService();
  } catch (error) {
    const delay = Math.pow(2, attempt) * 1000;
    await sleep(delay);  // 1s, 2s, 4s
  }
}
```

### Circuit Breaker
```typescript
// Si 5 fallos consecutivos, "abrir" circuito
// Rechazar requests durante X tiempo
// Después "semi-abierto" para reintentar
```

### Fallback
```typescript
try {
  return await getUserFromCache();
} catch {
  return await getUserFromDB();
}
```

---

## 📊 Monitoreo y Observabilidad

### Logs Estructurados
```json
{
  "timestamp": "2026-02-13T10:30:00Z",
  "service": "user-service",
  "level": "error",
  "message": "Usuario no encontrado",
  "userId": "123",
  "statusCode": 404,
  "duration": 145
}
```

### Métricas
- Requests por segundo
- Latencia (p50, p95, p99)
- Tasa de error (5xx responses)
- Queue depth (RabbitMQ)

### Tracing
- Request ID propagado entre servicios
- Permite seguir request completa
- Identificar cuellos de botella

---

## 🔄 Mejora Continua

### Versioning de APIs
```
GET /v1/users/:id      → Versión 1
GET /v2/users/:id      → Versión 2 (cambios breaking)
```

### Feature Flags
```typescript
if (featureFlags.isEnabled('new-ai-model')) {
  // Usar nuevo modelo
} else {
  // Usar modelo anterior
}
```

### Canary Releases
```
100% requests → Versión anterior
10% requests → Nueva versión (5% usuarios)
   ↓ (después validación)
50% requests → Nueva versión
   ↓ (después validación)
100% requests → Nueva versión
```

---

## 📚 Referencias

- [Microservices Pattern](https://microservices.io/)
- [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture)
- [12 Factor App](https://12factor.net/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Última actualización**: Febrero 2026
