# ai-service (RAG)

Microservicio de IA (NestJS) con RAG básico sobre Qdrant e integración con `auth-service` + `user-service`.

## Endpoints implementados

- `GET /ai/health`
- `POST /ai/ingest/users`
- `POST /ai/ask`
- `POST /ai/evaluate`

## Qué hace

- Obtiene token OAuth2 client credentials desde `auth-service`.
- Consume `GET /users` de `user-service`.
- Genera embeddings con OpenAI.
- Almacena y consulta chunks en Qdrant.
- Responde preguntas con contexto recuperado (RAG).
- Devuelve métricas de latencia, tokens y costo estimado.
- Aplica rate limiting básico en memoria para `/ai/ask`.

## Variables de entorno

Archivo base: `.env.example`.

Variables clave:

- `OPENAI_API_KEY`
- `QDRANT_URL`
- `QDRANT_COLLECTION`
- `AUTH_BASE_URL`
- `USER_SERVICE_URL`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`

## Ejecución local

```bash
cd /Users/alan/toka-technical-test/services/ai-service
npm install
npm run start:dev
```

## Ejecución con Docker Compose

Desde la raíz:

```bash
cd /Users/alan/toka-technical-test
docker compose up -d --build ai-service
```

## Smoke tests

```bash
curl http://localhost:3004/ai/health

curl -X POST http://localhost:3004/ai/ingest/users \
  -H 'Content-Type: application/json' \
  -d '{"limit": 50}'

curl -X POST http://localhost:3004/ai/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"Que usuarios existen?","topK":5}'
```

## Estructura

```text
src/
  application/rag/use-cases
  domain/{document,knowledge-base,qa}
  infrastructure/{embeddings,http,llm,vector-store}
  interfaces/http/dto
  config
  shared/{logging,rate-limit}
```
