# ai-service (RAG Scaffold)

Microservicio de IA para implementar Retrieval Augmented Generation (RAG) dentro de la arquitectura de microservicios.

## Estado actual

Implementado:

- Estructura base DDD + Clean Architecture.
- Espacios de código para casos de uso, dominio y adaptadores.
- Carpeta `docs/` para la estrategia de IA.

Pendiente:

- Bootstrap NestJS del servicio.
- Integración funcional con proveedor de embeddings/LLM.
- Integración funcional con Qdrant.
- Endpoints REST de ingestión y consulta.
- Integración por eventos con RabbitMQ.

## Estructura

```text
src/
  application/
    rag/
      use-cases/
  domain/
    document/
    knowledge-base/
    qa/
  infrastructure/
    embeddings/
    llm/
    messaging/
    vector-store/
  interfaces/
    http/
      dto/
  config/
  shared/
    logging/
test/
docs/
```

## Responsabilidad por capa

- `domain`: entidades, value objects, puertos de dominio.
- `application`: casos de uso (`ingest`, `ask`, `re-rank`, etc.).
- `infrastructure`: implementaciones concretas (Qdrant, proveedor LLM, RabbitMQ).
- `interfaces`: controllers HTTP, DTOs y serialización de respuesta.
- `config`: validación de variables de entorno.
- `shared`: logging JSON, utilidades cross-cutting, errores compartidos.

## Contratos sugeridos

- `POST /ai/ingest`
  - entrada: documento + metadatos
  - salida: `documentId`, `chunks`, `embeddingModel`
- `POST /ai/ask`
  - entrada: `question`, `contextFilters`, `topK`
  - salida: `answer`, `sources`, `tokens`, `latencyMs`
- `GET /ai/health`
  - salida: estado del servicio y dependencias (Qdrant/LLM)

## Variables de entorno sugeridas

- `PORT=3004`
- `QDRANT_URL=http://qdrant:6333`
- `QDRANT_COLLECTION=toka_knowledge`
- `LLM_PROVIDER=openai`
- `LLM_MODEL=gpt-4o-mini`
- `EMBEDDING_MODEL=text-embedding-3-small`
- `RMQ_URL=amqp://guest:guest@rabbitmq:5672`
- `RMQ_QUEUE=ai_events`
- `RATE_LIMIT_TPM=60000`
- `RATE_LIMIT_RPM=300`

## Integración esperada con otros servicios

- Consume eventos RabbitMQ (`user.created.v1`, `role.created.v1`) para generar trazabilidad o enriquecimiento de contexto.
- Expone consultas `ask` para consumo desde frontend o BFF.
- Opcionalmente registra auditoría de preguntas/respuestas hacia `audit-service`.

## Criterios de evaluación IA (para la prueba)

- Latencia: reportar `p50`, `p95`, `p99` por endpoint IA.
- Costo: estimación por request usando tokens in/out.
- Rate limiting: límite por IP o por API key con respuesta `429`.
- Observabilidad: logging JSON con `requestId`, `model`, `tokens`, `latencyMs`.

## Referencia

- Documento principal de IA/RAG: `/Users/alan/toka-technical-test/docs/AI_RAG.md`
