# Troubleshooting - Solución de Problemas

## 🔴 Problemas Comunes

### Docker & Docker Compose

#### Puerto ya en uso
```bash
❌ Error: docker: Error response from daemon: 
   Ports are not available: exposing port TCP 0.0.0.0:5432

✅ Solución:
# Listar contenedores en ejecución
docker-compose ps

# Detener contenedores específicos
docker-compose stop postgres

# O encontrar proceso en el puerto
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Matar proceso
kill -9 <PID>
```

#### Contenedor no inicia
```bash
❌ Error: 
   postgres_1 exited with code 1

✅ Solución:
# Ver logs del contenedor
docker-compose logs postgres

# Eliminar volúmenes persistentes y reiniciar
docker-compose down -v
docker-compose up -d
```

#### Base de datos corrupta
```bash
❌ Error:
   FATAL: could not locate a valid checkpoint record

✅ Solución:
# Eliminar datos persistentes y recrear
docker-compose down -v
docker-compose up -d

# Ejecutar migraciones
npm run migrate
```

---

### Node.js & npm

#### Dependencias conflictivas
```bash
❌ Error:
   npm ERR! peer dep missing: express@^4.18.0

✅ Solución:
# Limpiar cache
npm cache clean --force

# Eliminar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# O forzar
npm install --legacy-peer-deps
```

#### Módulo no encontrado
```bash
❌ Error:
   Cannot find module '@shared/utils'

✅ Solución:
# Verificar tsconfig.json paths
# Los paths deben ser relativos correctos

# Limpiar y recompilar
npm run build
npm run dev

# Alternativa: usar rutas relativas
import { Logger } from '../../../shared/utils';
```

#### TypeScript errors
```bash
❌ Error:
   Property 'unknown' does not exist on type

✅ Solución:
# Verificar tipos
npm run type-check

# Actualizar @types
npm install @types/node@latest

# Forzar recompilar
rm -rf dist
npm run build
```

---

### Base de Datos

#### Conexión rechazada
```bash
❌ Error:
   Error: connect ECONNREFUSED 127.0.0.1:5432

✅ Solución:
# Verificar que PostgreSQL está visible
docker-compose exec postgres psql -U postgres -d postgres -c "SELECT 1;"

# Verificar variables de entorno
echo $DB_HOST
echo $DB_PORT

# En Docker Compose, usar nombre del servicio
DB_HOST=postgres  # NO localhost
```

#### User/Password incorrecto
```bash
❌ Error:
   FATAL: password authentication failed for user "postgres"

✅ Solución:
# Verificar credenciales en docker-compose.yml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres

# Resetear credenciales
docker-compose down -v
# Editar docker-compose.yml
docker-compose up -d postgres
```

#### Tabla no existe
```bash
❌ Error:
   relation "users" does not exist

✅ Solución:
# Ejecutar migraciones
npm run migrate

# O crear tabla manualmente
docker-compose exec postgres psql -U postgres -d users_db -c "
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);"
```

---

### RabbitMQ

#### No se conecta
```bash
❌ Error:
   Error: ECONNREFUSED 127.0.0.1:5672

✅ Solución:
# Verificar RabbitMQ está corriendo
docker-compose ps rabbitmq

# Verificar puerto
docker-compose logs rabbitmq | grep 5672

# Acceder a Management UI
http://localhost:15672
# usuario: guest
# contraseña: guest
```

#### Permiso denegado
```bash
❌ Error:
   403 access denied

✅ Solución:
# Usar credenciales correctas
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Crear usuario en RabbitMQ
docker-compose exec rabbitmq rabbitmqctl add_user myuser mypass
docker-compose exec rabbitmq rabbitmqctl set_permissions -p / myuser ".*" ".*" ".*"
```

#### Queue no existe
```bash
❌ Error:
   NOT_FOUND - no queue 'my-queue'

✅ Solución:
# Las queues se crean automáticamente en consummers
# Si falta, publicar evento para crear la queue

# O crear manualmente
docker-compose exec rabbitmq rabbitmqctl declare_queue \
  -p / \
  my-queue durable
```

---

### Redis

#### Conexión rechazada
```bash
❌ Error:
   Error: connect ECONNREFUSED 127.0.0.1:6379

✅ Solución:
# Verificar Redis corre
docker-compose ps redis

# Acceder a Redis CLI
docker-compose exec redis redis-cli
redis> ping
PONG

# En código, usar 'redis' como hostname
REDIS_HOST=redis
```

#### Datos corruptos
```bash
❌ Error:
   WRONGTYPE Operation against a key holding the wrong kind of value

✅ Solución:
# Limpiar Redis
docker-compose exec redis redis-cli FLUSHALL

# O dropar clave específica
docker-compose exec redis redis-cli DEL session:123
```

---

### API Gateway

#### 502 Bad Gateway
```bash
❌ Error:
   502 Bad Gateway
   Service Unavailable

✅ Solución:
# Verificar servicios están corriendo
docker-compose ps

# Ver logs del gateway
docker-compose logs api-gateway

# Verificar URLs de servicios
# Deben ser: http://service-name:port (en Docker)
# NO localhost

# Las URLs en docker-compose.yml:
AUTH_SERVICE_URL=http://auth-service:3001  ✅
AUTH_SERVICE_URL=http://localhost:3001     ❌
```

#### CORS error
```bash
❌ Error:
   Access to XMLHttpRequest from 'http://localhost:3000'
   has been blocked by CORS policy

✅ Solución:
# Configurar CORS en API Gateway
CORS_ORIGIN=http://localhost:3000

# En código:
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true
}));

# Agregar headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
```

#### Autenticación fallida
```bash
❌ Error:
   401 Unauthorized
   Token inválido

✅ Solución:
# Verificar token está siendo enviado
curl -H "Authorization: Bearer <token>" http://localhost:3000/users

# Verificar JWT_SECRET es igual en todos lados
# Auth Service y API Gateway deben usar mismo secret

# Verificar token no ha expirado
jwt.decode(token) // buscar 'exp'
```

---

## 🛠️ Debugging

### Ver logs detallados

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f auth-service

# Últimas N líneas
docker-compose logs --tail=100 user-service

# Seguir en tiempo real
docker-compose logs -f --follow
```

### Acceso a contenedores

```bash
# Shell interactivo en contenedor
docker-compose exec postgres /bin/sh
docker-compose exec postgres psql -U postgres

# Ejecutar comando
docker-compose exec user-service npm run test

# Ver variables de entorno
docker-compose exec auth-service env | grep DB
```

### Inspeccionar redes Docker

```bash
# Listar redes
docker network ls

# Inspeccionar red
docker network inspect toka-technical-test_default

# Ver IP de servicio
docker inspect <container-id> | grep IPAddress
```

---

## 🔍 Checklist de Debugging

### Antes de reportar un bug:

- [ ] ¿Están todos los contenedores corriendo?
  ```bash
  docker-compose ps
  ```

- [ ] ¿Están los puertos disponibles?
  ```bash
  netstat -an | grep LISTEN  # macOS/Linux
  ```

- [ ] ¿Las variables de entorno están configuradas?
  ```bash
  echo $DB_HOST
  ```

- [ ] ¿Hay errores en los logs?
  ```bash
  docker-compose logs | grep ERROR
  ```

- [ ] ¿Internet conectado? (para APIs externas)
  ```bash
  curl https://api.openai.com
  ```

- [ ] ¿Base de datos tiene datos?
  ```bash
  docker-compose exec postgres psql -U postgres -d users_db -c "SELECT COUNT(*) FROM users;"
  ```

- [ ] ¿RabbitMQ tiene eventos?
  ```bash
  docker-compose exec rabbitmq rabbitmqctl list_queues
  ```

- [ ] ¿Caché funciona?
  ```bash
  docker-compose exec redis redis-cli ping
  ```

---

## 📞 Obtener Ayuda

### Información Importante para Reportar

Cuando reportes un bug, incluye:

```markdown
## Sistema
- OS: [macOS/Linux/Windows]
- Node version: $(node -v)
- npm version: $(npm -v)
- Docker version: $(docker -v)

## Error
[Stack trace completo]

## Logs
[docker-compose logs aquí]

## Pasos para reproducir
1. ...
2. ...

## Esperado vs Actual
Esperado: ...
Actual: ...

## Variables de entorno
[Si es relevante]
```

### Recursos

- [Docker Troubleshooting](https://docs.docker.com/config/containers/resource_constraints/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RabbitMQ Troubleshooting](https://www.rabbitmq.com/troubleshooting.html)
- [Express.js Debugging](https://expressjs.com/en/guide/debugging.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💡 Tips & Tricks

### Resetear entorno completamente

```bash
# ADVERTENCIA: Esto elimina todos los datos
docker-compose down -v
docker-compose up -d

# Reinicializar BD
npm run migrate:fresh

# Seed con datos de prueba (opcional)
npm run seed
```

### Ver qué escriben los servicios

```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm run dev

# Terminal 2 - User Service
cd services/user-service
npm run dev

# Terminal 3 - Tests/Requests
npm run test
```

### Usar debug de Node

```bash
# Con --inspect
node --inspect=9229 dist/server.js

# Abre en Chrome: chrome://inspect
# Click "inspect"
```

### Performance profiling

```bash
# npm packages para profiling
npm install clinic
npx clinic doctor -- node dist/server.js
```

---

**Última actualización**: Febrero 2026
