# AI Service

## 📋 Descripción

Servicio de inteligencia artificial para generación de textos, embeddings y búsqueda semántica. Integra modelos de IA y bases de datos vectoriales.

## 🎯 Responsabilidades

- ✅ Generación de textos
- ✅ Creación de embeddings
- ✅ Búsqueda semántica
- ✅ Análisis de sentimientos
- ✅ Recomendaciones personalizadas
- ✅ Clustering de documentos

## 🏗️ Estructura Recomendada

```
ai-service/
├── src/
│   ├── controllers/
│   │   └── ai.controller.ts
│   ├── services/
│   │   ├── generation.service.ts
│   │   ├── embedding.service.ts
│   │   ├── search.service.ts
│   │   └── recommendation.service.ts
│   ├── models/
│   │   ├── openai-client.ts
│   │   └── qdrant-client.ts
│   ├── dto/
│   │   ├── generate.dto.ts
│   │   ├── embed.dto.ts
│   │   └── search.dto.ts
│   ├── config/
│   │   └── ai.config.ts
│   ├── app.ts
│   └── server.ts
├── Dockerfile
├── package.json
└── README.md
```

## 📡 APIs

### POST /ai/generate
```typescript
Request:
{
  "prompt": "Escribe un artículo sobre microservicios",
  "model": "gpt-4",
  "maxTokens": 500,
  "temperature": 0.7
}

Response (200):
{
  "id": "uuid",
  "text": "Los microservicios son una arquitectura...",
  "tokensUsed": 245,
  "model": "gpt-4",
  "timestamp": "2026-02-13T10:30:00Z"
}
```

### POST /ai/embed
```typescript
Request:
{
  "text": "Los microservicios son una arquitectura de software",
  "model": "text-embedding-3-small"
}

Response (200):
{
  "id": "uuid",
  "embedding": [0.123, -0.456, 0.789, ...],
  "dimension": 1536,
  "timestamp": "2026-02-13T10:30:00Z"
}
```

### POST /ai/search
```typescript
Request:
{
  "query": "¿Cuáles son los beneficios de los microservicios?",
  "threshold": 0.7,
  "limit": 5,
  "collection": "articles"
}

Response (200):
{
  "results": [
    {
      "id": "uuid",
      "text": "Los microservicios ofrecen escalabilidad...",
      "score": 0.92,
      "metadata": { "author": "John Doe", "date": "2026-02" }
    }
  ],
  "total": 15,
  "processingTime": 234
}
```

### POST /ai/sentiment
```typescript
Request:
{
  "text": "Estoy muy satisfecho con este servicio"
}

Response (200):
{
  "score": 0.95,  // -1 a 1: negativo a positivo
  "label": "positive",
  "confidence": 0.98
}
```

### POST /ai/recommendations
```typescript
Request:
{
  "userId": "uuid",
  "limit": 5,
  "category": "articles"
}

Response (200):
{
  "recommendations": [
    {
      "id": "uuid",
      "title": "Advanced Microservices Patterns",
      "similarity": 0.87,
      "reason": "Basado en tu lectura de 'Intro to Microservices'"
    }
  ]
}
```

## 🔌 Integraciones

### OpenAI / LLM
```typescript
// ai.config.ts
import { OpenAI } from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const Models = {
  GPT4: 'gpt-4',
  GPT35: 'gpt-3.5-turbo',
  EMBEDDING: 'text-embedding-3-small'
};
```

### Qdrant (Vector Database)
```typescript
// qdrant-client.ts
import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL
});

export async function createCollection(name: string) {
  await qdrant.recreateCollection(name, {
    vectors: { size: 1536, distance: 'Cosine' }
  });
}
```

## 💡 Casos de Uso

### 1. Generación de Contenido
```typescript
async generateArticle(topic: string) {
  const prompt = `Escribe un artículo profesional sobre: ${topic}`;
  
  const response = await openai.chat.completions.create({
    model: Models.GPT4,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000
  });

  return response.choices[0].message.content;
}
```

### 2. Búsqueda Semántica
```typescript
async semanticSearch(query: string, collection: string) {
  // 1. Generar embedding de la búsqueda
  const embedding = await generateEmbedding(query);

  // 2. Buscar en Qdrant
  const results = await qdrant.search(collection, {
    vector: embedding,
    limit: 10,
    score_threshold: 0.7
  });

  return results;
}
```

### 3. Recomendaciones Personalizadas
```typescript
async getRecommendations(userId: string) {
  // 1. Obtener historial del usuario
  const history = await getUserHistory(userId);

  // 2. Crear embedding del perfil
  const profileEmbedding = await generateEmbedding(
    history.map(item => item.content).join(' ')
  );

  // 3. Buscar contenido similar
  const recommendations = await qdrant.search('articles', {
    vector: profileEmbedding,
    limit: 5
  });

  return recommendations;
}
```

## 📊 Cache y Optimización

```typescript
// Cache de embeddings
const embeddingCache = new Map<string, number[]>();

async function generateEmbedding(text: string) {
  const hash = md5(text);
  
  if (embeddingCache.has(hash)) {
    return embeddingCache.get(hash);
  }

  const embedding = await openai.embeddings.create({
    model: Models.EMBEDDING,
    input: text
  });

  embeddingCache.set(hash, embedding.data[0].embedding);
  return embedding.data[0].embedding;
}
```

## 📨 Eventos

```typescript
// DOCUMENT_EMBEDDED
{
  "eventType": "DOCUMENT_EMBEDDED",
  "documentId": "uuid",
  "collection": "articles",
  "embeddingModel": "text-embedding-3-small",
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}

// CONTENT_GENERATED
{
  "eventType": "CONTENT_GENERATED",
  "generationId": "uuid",
  "model": "gpt-4",
  "tokensUsed": 250,
  "timestamp": "2026-02-13T10:30:00Z",
  "version": 1
}
```

## 🔒 Seguridad y Rate Limiting

```typescript
// Rate limiting por usuario
const rateLimiter = new Map<string, number>();

function checkLimit(userId: string): boolean {
  const now = Date.now();
  const lastCall = rateLimiter.get(userId) || 0;

  if (now - lastCall < 1000) {  // 1 llamada por segundo
    return false;
  }

  rateLimiter.set(userId, now);
  return true;
}
```

## 💰 Monitoreo de Costos

```typescript
interface UsageMetrics {
  tokensUsed: number;
  embeddingsGenerated: number;
  searchRequests: number;
  estimatedCost: number;
}

async function trackUsage(metric: string, tokens: number) {
  // Guardar en BD para análisis
  await usageRepository.save({
    metric,
    tokens,
    cost: calculateCost(tokens),
    timestamp: new Date()
  });
}
```

## 🧪 Testing

```typescript
describe('AI Service', () => {
  it('debería generar texto', async () => {
    const result = await ai.generate({
      prompt: 'Hola',
      maxTokens: 100
    });

    expect(result.text).toBeDefined();
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('debería crear embeddings', async () => {
    const embedding = await ai.embed('texto de prueba');

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);  // dimensionalidad
  });
});
```

## 🚀 Ejecución

```bash
npm install
cp .env.example .env

# Configurar claves de API
# OPENAI_API_KEY=sk-...
# QDRANT_URL=http://qdrant:6333

npm run dev
```

## 🔧 Variables de Entorno

```env
PORT=3004
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=

# Rate Limiting
RATE_LIMIT_CALLS_PER_MINUTE=60

# Cache
CACHE_TTL=3600

# Logging
LOG_LEVEL=info
```

---

**Última actualización**: Febrero 2026
