# Diagnóstico de Incidente

## Contexto del incidente

Síntoma reportado:

- Incremento súbito de `401 Unauthorized` en endpoints protegidos (`/users`, `/roles`, `/audits`).
- Aumento de latencia en llamadas autenticadas.
- Reportes intermitentes de errores desde frontend al consumir APIs.

## 1. Hipótesis

1. Desalineación de configuración OIDC entre issuer y consumidores (`OIDC_ISSUER`, `OIDC_AUDIENCE`).
2. Rotación/cambio de llave pública no sincronizada en validadores JWT.
3. Tokens expirando antes de lo esperado por valor de `JWT_EXPIRES_IN`.
4. Caída parcial de `auth-service` causando emisiones de token fallidas.
5. Saturación de infraestructura (RabbitMQ/DB) afectando tiempos de respuesta y flujo de autenticación.

## 2. Pasos de investigación

1. Confirmar alcance temporal del incidente:
   - Hora exacta de inicio.
   - Servicios afectados.
2. Revisar salud de contenedores:
   - `docker compose ps`
   - reinicios frecuentes / estado `unhealthy`.
3. Revisar logs de `auth-service` y servicios consumidores:
   - errores de validación JWT
   - issuer/audience mismatch
   - stack traces de guards de auth.
4. Validar metadata OIDC y JWKS publicada por `auth-service`:
   - `/.well-known/openid-configuration`
   - `/.well-known/jwks.json`
5. Reproducir manualmente:
   - emitir token con `/auth/login` o `/oauth/token`
   - consumir `/users`, `/roles`, `/audits` con ese token.
6. Revisar latencias por endpoint en access logs JSON:
   - comparación pre y post incidente.
7. Revisar dependencias externas:
   - PostgreSQL, MongoDB, RabbitMQ, red Docker.

## 3. Métricas y logs a revisar

### Métricas técnicas

- Tasa de `401` por endpoint y por servicio.
- P95/P99 de latencia en endpoints protegidos.
- Tasa de errores `5xx` por servicio.
- Reinicios de contenedores.
- Conexiones/colas de RabbitMQ.
- Salud de PostgreSQL y MongoDB.

### Logs clave

- Access logs JSON (`method`, `path`, `statusCode`, `durationMs`).
- Errores de guard JWT/OIDC en `user-service`, `role-service`, `audit-service`.
- Errores de emisión de token en `auth-service`.
- Errores de publicación/consumo de eventos AMQP.

## 4. Posibles causas

1. Variables de entorno inconsistentes entre servicios (`OIDC_ISSUER`/`OIDC_AUDIENCE`).
2. Desfase entre llave usada para firmar token y llave usada para validar.
3. Token expirado o TTL mal configurado.
4. Degradación de infraestructura provocando timeouts.
5. Despliegue parcial con versiones incompatibles entre servicios.

## 5. Plan de mitigación

### Mitigación inmediata

1. Asegurar consistencia de `OIDC_ISSUER` y `OIDC_AUDIENCE` en todos los servicios.
2. Validar disponibilidad de `auth-service` y endpoint JWKS.
3. Reiniciar servicios afectados si hay estado inestable.
4. Confirmar emisión/consumo de tokens con prueba controlada.

### Mitigación a corto plazo

1. Incrementar observabilidad de auth:
   - dashboard de tasa `401`
   - alertas por errores de JWT validation.
2. Agregar smoke checks automáticos post-deploy:
   - login + llamada autenticada a `/users`.
3. Estabilizar configuración mediante archivos de entorno versionados por ambiente.

### Mitigación preventiva

1. Runbook de rollback para cambios de seguridad/OIDC.
2. Pruebas de contrato entre `auth-service` y validadores JWT en consumidores.
3. Revisión periódica de expiración de token y políticas de renovación.
