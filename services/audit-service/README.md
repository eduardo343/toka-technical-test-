# Audit Service

## 📋 Descripción

Servicio centralizado de auditoría y logging. Registra todas las acciones importantes del sistema para compliance, debugging y análisis de seguridad.

## 🎯 Responsabilidades

- ✅ Registrar acciones de usuarios
- ✅ Almacenar cambios de datos
- ✅ Registrar eventos de seguridad
- ✅ Generar reportes de auditoría
- ✅ Detectar actividades sospechosas
- ✅ Cumplimiento normativo (GDPR, etc)

## 🏗️ Estructura Recomendada

```
audit-service/
├── src/
│   ├── controllers/
│   │   └── audit.controller.ts
│   ├── services/
│   │   ├── audit.service.ts
│   │   ├── logger.service.ts
│   │   └── report.service.ts
│   ├── repositories/
│   │   └── audit.repository.ts
│   ├── listeners/
│   │   └── event.listener.ts     # Escucha RabbitMQ
│   ├── dto/
│   │   ├── audit-query.dto.ts
│   │   └── report.dto.ts
│   ├── entities/
│   │   └── audit-log.entity.ts
│   ├── config/
│   │   └── audit.config.ts
│   ├── app.ts
│   └── server.ts
├── Dockerfile
├── package.json
└── README.md
```

## 💾 Base de Datos

### Tabla: audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,      -- USER_LOGIN, USER_DELETE, ROLE_ASSIGN
  user_id UUID REFERENCES users(id),
  resource_type VARCHAR(100),            -- user, role, document
  resource_id VARCHAR(255),              -- ID del recurso modificado
  action VARCHAR(50) NOT NULL,           -- CREATE, READ, UPDATE, DELETE
  old_values JSONB,                      -- Valores anteriores
  new_values JSONB,                      -- Valores nuevos
  ip_address VARCHAR(45),                -- IPv4 o IPv6
  user_agent TEXT,
  status VARCHAR(50),                    -- success, failure
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB                         -- Datos adicionales
);

CREATE INDEX idx_user_id ON audit_logs(user_id);
CREATE INDEX idx_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_event_type ON audit_logs(event_type);
CREATE INDEX idx_resource ON audit_logs(resource_type, resource_id);
```

### Tabla: security_events
```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,      -- LOGIN_FAILED, TOKEN_REVOKED, PERMISSION_DENIED
  user_id UUID REFERENCES users(id),
  severity VARCHAR(20),                  -- low, medium, high, critical
  description TEXT,
  details JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_severity ON security_events(severity);
CREATE INDEX idx_timestamp ON security_events(timestamp DESC);
```

## 📡 APIs

### GET /audit/logs
```typescript
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- userId: string (filter)
- eventType: string (filter)
- startDate: ISO date (filter)
- endDate: ISO date (filter)
- resourceType: string (filter)
- action: string (filter)

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "eventType": "USER_UPDATED",
      "userId": "uuid",
      "resourceType": "user",
      "resourceId": "uuid",
      "action": "UPDATE",
      "oldValues": { "firstName": "John" },
      "newValues": { "firstName": "Jane" },
      "ipAddress": "192.168.1.1",
      "status": "success",
      "timestamp": "2026-02-13T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75
  }
}
```

### GET /audit/logs/:id
```typescript
Response (200):
{
  "id": "uuid",
  "eventType": "USER_UPDATED",
  ...full audit log details...
}
```

### GET /audit/security-events
```typescript
Query Parameters:
- severity: string (low, medium, high, critical)
- startDate: ISO date
- endDate: ISO date

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "eventType": "LOGIN_FAILED",
      "userId": "uuid",
      "severity": "medium",
      "description": "Intento de login fallido",
      "ipAddress": "192.168.1.100",
      "timestamp": "2026-02-13T10:30:00Z"
    }
  ],
  "total": 42
}
```

### GET /audit/reports/:userId
```typescript
Response (200):
{
  "userId": "uuid",
  "period": "monthly",
  "totalActions": 245,
  "actions": {
    "CREATE": 12,
    "READ": 180,
    "UPDATE": 45,
    "DELETE": 8
  },
  "lastActivity": "2026-02-13T10:30:00Z"
}
```

### POST /audit/export
```typescript
Request:
{
  "format": "csv" | "json" | "pdf",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-02-01T00:00:00Z",
  "filters": {
    "userId": "uuid",
    "eventType": "USER_*"
  }
}

Response (200):
{
  "downloadUrl": "https://bucket.s3.amazonaws.com/reports/audit_2026-01.csv"
}
```

## 📨 Eventos Consumidos

El servicio escucha eventos de RabbitMQ de otros servicios:

```typescript
// USER_CREATED
{
  "eventType": "USER_CREATED",
  "userId": "uuid",
  "email": "user@example.com"
}

// USER_UPDATED
{
  "eventType": "USER_UPDATED",
  "userId": "uuid",
  "changes": { ... }
}

// LOGIN_SUCCESS
{
  "eventType": "LOGIN_SUCCESS",
  "userId": "uuid",
  "ipAddress": "192.168.1.1"
}

// PERMISSION_ASSIGNED
{
  "eventType": "PERMISSION_ASSIGNED",
  "userId": "uuid",
  "roleId": "uuid"
}
```

## 🎯 Tipos de Eventos Auditados

### Eventos de Usuario
```
USER_CREATED
USER_UPDATED
USER_DELETED
USER_ACTIVATED
USER_DEACTIVATED
```

### Eventos de Autenticación
```
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT
TOKEN_CREATED
TOKEN_REVOKED
PASSWORD_CHANGED
```

### Eventos de Autorización
```
PERMISSION_GRANTED
PERMISSION_DENIED
PERMISSION_REVOKED
ROLE_ASSIGNED
ROLE_REVOKED
```

### Eventos de Seguridad
```
SUSPICIOUS_ACTIVITY
FAILED_AUTH_ATTEMPT
IP_CHANGE
UNUSUAL_ACCESS_PATTERN
DATA_EXPORT
BULK_OPERATION
```

## 💻 Event Listener (RabbitMQ)

```typescript
// event.listener.ts
import amqp from 'amqplib';

export async function setupEventListener() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();

  // Declarar exchanges y queues
  await channel.assertExchange('events', 'topic', { durable: true });
  
  const queue = await channel.assertQueue('audit-service.events', { durable: true });
  
  // Bindings para eventos de interés
  await channel.bindQueue(queue.queue, 'events', 'user.*');
  await channel.bindQueue(queue.queue, 'events', 'auth.*');
  await channel.bindQueue(queue.queue, 'events', 'permission.*');

  // Procesar mensajes
  channel.consume(queue.queue, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      await auditService.logEvent(event);
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing event:', error);
      channel.nack(msg, false, true);  // Reintentar después
    }
  });
}
```

## 🔍 Análisis de Seguridad

### Detección de Anomalías
```typescript
async function detectAnomalies(userId: string) {
  const recentLogs = await auditRepository.getRecent(userId, 24); // últimas 24 horas

  const patterns = {
    failedLogins: recentLogs.filter(l => l.eventType === 'LOGIN_FAILED').length,
    bulkDeletes: recentLogs.filter(l => l.action === 'DELETE').length,
    unusualIPs: getUniquIPs(recentLogs).length,
    nightAccess: recentLogs.filter(l => isNightTime(l.timestamp)).length
  };

  if (patterns.failedLogins > 5) {
    await recordSecurityEvent({
      eventType: 'SUSPICIOUS_LOGIN_ATTEMPTS',
      severity: 'high',
      userId
    });
  }

  if (patterns.bulkDeletes > 50) {
    await recordSecurityEvent({
      eventType: 'SUSPICIOUS_BULK_OPERATION',
      severity: 'high',
      userId
    });
  }

  return patterns;
}
```

## 📊 Reportes

### Reporte Mensual
```typescript
async function generateMonthlyReport(startDate: Date, endDate: Date) {
  const logs = await auditRepository.getByDateRange(startDate, endDate);

  return {
    period: { startDate, endDate },
    totalEvents: logs.length,
    eventsByType: groupBy(logs, 'eventType'),
    eventsByUser: groupBy(logs, 'userId'),
    eventsByAction: groupBy(logs, 'action'),
    securityIssues: await getSecuritySummary(startDate, endDate),
    topUsers: getTopActiveUsers(logs, 10),
    failureRate: calculateFailureRate(logs)
  };
}
```

### Cumplimiento GDPR
```typescript
// Datos de un usuario para GDPR
async function getUserDataForGDPR(userId: string) {
  return {
    auditLogs: await auditRepository.getByUserId(userId),
    securityEvents: await securityEventsRepository.getByUserId(userId),
    loginHistory: await getLoginHistory(userId),
    dataExports: await getDataExports(userId)
  };
}

// Derecho al olvido
async function deleteUserData(userId: string) {
  // Mantener logs pseudoanonimizados por compliance
  await auditRepository.anonymizeUser(userId);
  await securityEventsRepository.anonymizeUser(userId);
}
```

## 🚀 Ejecución

```bash
npm install
cp .env.example .env
npm run migrate   # Crear tablas
npm run dev
```

## 🔧 Variables de Entorno

```env
PORT=3005
NODE_ENV=development

DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=users_db

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

LOG_LEVEL=info
RETENTION_DAYS=90  # Mantener logs por 90 días

# Alertas
ALERT_THRESHOLD_FAILED_LOGINS=5
ALERT_THRESHOLD_BULK_OPERATIONS=50

# S3 para reportes
S3_BUCKET=audit-reports
S3_REGION=us-east-1
```

## 🧪 Testing

```typescript
describe('Audit Service', () => {
  it('debería registrar evento de usuario', async () => {
    const event = {
      eventType: 'USER_CREATED',
      userId: 'uuid',
      action: 'CREATE'
    };

    await auditService.logEvent(event);
    const logged = await auditRepository.find(event.userId);

    expect(logged.length).toBe(1);
  });
});
```

## 📈 Métricas

- Total de eventos registrados
- Eventos por tipo
- Usuarios más activos
- Intentos de acceso fallidos
- Operaciones sospechosas detectadas
- Tiempo de retención de logs

---

**Última actualización**: Febrero 2026
