# Frontend (React + Redux + Vite)

Frontend cliente para la prueba técnica de microservicios.

## Funcionalidad implementada

- Login real contra `auth-service` (`POST /auth/login`)
- Register real contra `auth-service` (`POST /auth/register`)
- Consulta de usuarios contra `user-service` (`GET /users`)
- Header `Authorization: Bearer <token>` automático
- Manejo global de `401` (logout y redirección a login)
- Rutas protegidas con `ProtectedRoute`
- Estados globales en Redux:
  - `auth` (`token`, `loginLoading`, `registerLoading`, `loginError`, `registerError`)
  - `users` (`items`, `loading`, `error`)
- Validaciones visuales de formularios y feedback de carga/error
- Tests con Vitest + React Testing Library

## Requisitos

- Node.js 20+
- npm 10+

## Variables de entorno

Archivo de referencia: `.env.example`

Variables:

- `VITE_AUTH_API_URL`
- `VITE_USER_API_URL`
- `VITE_ROLE_API_URL`
- `VITE_AUDIT_API_URL`

Uso recomendado:

- Local (`npm run dev`): dejar variables vacías para usar proxy de Vite.
- Docker (`docker compose up`): dejar variables vacías y usar proxy interno de Nginx del contenedor frontend.

## Ejecutar local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar infraestructura + microservicios (en la raíz del repo):

```bash
docker compose up -d
```

3. Levantar frontend:

```bash
npm run dev
```

4. Abrir:

- [http://localhost:5173](http://localhost:5173)

## Ejecutar frontend en Docker

Desde la raíz del repo:

```bash
docker compose up -d --build frontend
```

Abrir:

- [http://localhost:5173](http://localhost:5173)

## Scripts

- `npm run dev` -> modo desarrollo
- `npm run build` -> build de producción
- `npm run preview` -> preview local del build
- `npm run lint` -> análisis estático
- `npm run test:typecheck` -> typecheck de archivos de test
- `npm run test` -> modo watch
- `npm run test:run` -> ejecución única
- `npm run test:coverage` -> cobertura

## Tests incluidos

- `src/features/auth/Login.test.tsx`
- `src/components/ProtectedRoute.test.tsx`
