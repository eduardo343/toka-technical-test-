# ai-service (Scaffold)

Estructura base para implementar el microservicio de IA/RAG con enfoque DDD + Clean Architecture.

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

## Convención recomendada

- `domain`: entidades, value objects, contratos de dominio.
- `application`: casos de uso y orquestación.
- `infrastructure`: adaptadores concretos (Qdrant, proveedor LLM, broker).
- `interfaces`: controladores HTTP y DTOs.
- `config`: validación/carga de variables de entorno.
- `shared`: cross-cutting concerns (logging, errores comunes).
