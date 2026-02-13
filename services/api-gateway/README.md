# API Gateway

## 📋 Descripción

Punto de entrada único para todos los clientes. Actúa como enrutador, balanceador de carga y validador central. Implementa autenticación, rate limiting y transformación de solicitudes.

## 🎯 Responsabilidades

- ✅ Enrutamiento a microservicios
- ✅ Validación de autenticación
- ✅ Rate limiting y throttling
- ✅ Transformación de solicitudes/respuestas
- ✅ Caché de respuestas
- ✅ Logging centralizado
- ✅ Manejo de errores global
- ✅ Versionamiento de APIs

## 🏗️ Arquitectura

```
Cliente HTTP
    ↓
[API Gateway - Puerto 3000]
    ├─→ Auth Middleware (validación JWT)
    ├─→ Rate Limiter
    ├─→ Request Logger
    ├─→ Router
    │   ├─→ /auth/* → auth-service:3001
    │   ├─→ /users/* → user-service:3002
    │   ├─→ /roles/* → role-service:3003
    │   ├─→ /ai/* → ai-service:3004
    │   └─→ /audit/* → audit-service:3005
    └─→ Response Handler + Caché
```

## 🔀 Rutas y Enrutamiento

### Estructura de Rutas

```typescript
GET    /health              → Health check del gateway
GET    /v1/docs             → Documentación OpenAPI

// Auth Service
POST   /auth/register       → auth-service:3001
POST   /auth/login          → auth-service:3001
POST   /auth/refresh        → auth-service:3001
POST   /auth/logout         → auth-service:3001

// User Service
GET    /users/:id           → user-service:3002
GET    /users               → user-service:3002
PUT    /users/:id           → user-service:3002
DELETE /users/:id           → user-service:3002
POST   /users/:id/avatar    → user-service:3002

// Role Service
GET    /roles               → role-service:3003
POST   /roles               → role-service:3003
PUT    /roles/:id           → role-service:3003
DELETE /roles/:id           → role-service:3003

// AI Service
POST   /ai/generate         → ai-service:3004
POST   /ai/embed            → ai-service:3004

// Audit Service
GET    /audit/logs          → audit-service:3005
```

## 🏗️ Estructura de Código

```
api-gateway/
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rate-limiter.middleware.ts
│   │   ├── logger.middleware.ts
│   │   └── error-handler.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── roles.routes.ts
│   │   ├── ai.routes.ts
│   │   └── audit.routes.ts
│   ├── services/
│   │   └── gateway.service.ts      # Lógica de enrutamiento
│   ├── cache/
│   │   └── cache.service.ts        # Caché de respuestas
│   ├── config/
│   │   ├── routes.config.ts
│   │   └── services.config.ts      # URLs de servicios
│   ├── app.ts
│   └── server.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Middleware Stack

### Auth Middleware
```typescript
// Validar JWT en requests protegidos
middleware.use((req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/auth/register') {
    return next(); // Sin protección
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});
```

### Rate Limiter
```typescript
middleware.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 requests por ventana
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Demasiadas solicitudes'
}));
```

### Request Logger
```typescript
middleware.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

### Error Handler
```typescript
middleware.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message,
    code: error.code
  });
});
```

## 🌐 Enrutamiento Dinámico

### Service Registry
```typescript
// services.config.ts
export const SERVICES = {
  AUTH: 'http://auth-service:3001',
  USERS: 'http://user-service:3002',
  ROLES: 'http://role-service:3003',
  AI: 'http://ai-service:3004',
  AUDIT: 'http://audit-service:3005'
};

export const ROUTES = {
  '/auth': SERVICES.AUTH,
  '/users': SERVICES.USERS,
  '/roles': SERVICES.ROLES,
  '/ai': SERVICES.AI,
  '/audit': SERVICES.AUDIT
};
```

### Forward Request
```typescript
async forwardRequest(req, res, targetService) {
  try {
    const response = await axios({
      method: req.method,
      url: `${targetService}${req.path}`,
      headers: req.headers,
      data: req.body,
      timeout: 5000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({
      error: 'Servicio no disponible'
    });
  }
}
```

## 💾 Caché

### Strategy Pattern
```typescript
class CacheService {
  // Cachear GET de corta duración
  cacheGetRequest(key, duration = 5 * 60): any {
    const cached = redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheAndReturn(key, fn, duration) {
    const cached = this.cacheGetRequest(key);
    if (cached) return cached;

    const result = await fn();
    redis.setex(key, duration, JSON.stringify(result));
    return result;
  }
}
```

### Invalidación de Caché
```typescript
// Al POST/PUT/DELETE, limpiar caché relacionado
app.put('/users/:id', (req, res, next) => {
  // ... actualizar usuario
  redis.del(`user:${req.params.id}`);
  redis.del('users:list:*');
  next();
});
```

## 📊 Health Check y Monitoring

### Endpoint Health
```typescript
GET /health

Response (200):
{
  "status": "healthy",
  "timestamp": "2026-02-13T10:30:00Z",
  "services": {
    "auth-service": { "status": "up", "responseTime": 125 },
    "user-service": { "status": "up", "responseTime": 98 },
    "role-service": { "status": "down" },
    "ai-service": { "status": "up", "responseTime": 450 },
    "audit-service": { "status": "up", "responseTime": 87 }
  }
}
```

### Monitoreo de Servicios
```typescript
setInterval(async () => {
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const start = Date.now();
      await axios.get(`${url}/health`, { timeout: 1000 });
      const responseTime = Date.now() - start;
      
      updateServiceStatus(name, 'up', responseTime);
    } catch (error) {
      updateServiceStatus(name, 'down');
    }
  }
}, 30000); // cada 30 segundos
```

## 🔀 Manejo de Errores Global

### Error Handler
```typescript
const errorHandler = (error, req, res) => {
  const statusCode = error.response?.status || error.status || 500;
  const message = error.response?.data?.message || error.message;

  res.status(statusCode).json({
    error: {
      message,
      code: error.code,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};
```

### Status Codes Esperados
```
200 - OK
201 - Created
204 - No Content
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
429 - Too Many Requests
500 - Internal Server Error
502 - Bad Gateway
503 - Service Unavailable
```

## 📡 Integración con Servicios

### Configuración en Docker Compose
```yaml
api-gateway:
  build: ./services/api-gateway
  ports:
    - "3000:3000"
  depends_on:
    - auth-service
    - user-service
    - role-service
    - ai-service
    - audit-service
```

### Variables de Entorno
```env
PORT=3000
NODE_ENV=development

# URLs de Servicios (Docker Compose)
AUTH_SERVICE_URL=http://auth-service:3001
USERS_SERVICE_URL=http://user-service:3002
ROLES_SERVICE_URL=http://role-service:3003
AI_SERVICE_URL=http://ai-service:3004
AUDIT_SERVICE_URL=http://audit-service:3005

# Redis para caché
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

## 🧪 Testing

```typescript
describe('API Gateway', () => {
  it('debería enrutar a auth-service', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'pass' });
    
    expect(response.status).toBe(200);
  });

  it('debería rechazar sin token', async () => {
    const response = await request(app)
      .get('/users/123');
    
    expect(response.status).toBe(401);
  });
});
```

## 🚀 Ejecución

```bash
npm install
cp .env.example .env
npm run dev
```

---

**Última actualización**: Febrero 2026
