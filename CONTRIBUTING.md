# Contributing - Guía de Contribuciones

## 🎯 Agradecemos tu Interés

Gracias por considerar contribuir al proyecto **Toka Technical Test**. Toda contribución ayuda a mejorar el código y la arquitectura.

## 📋 Proceso de Contribución

### 1. Fork y Clone

```bash
# Fork en GitHub (botón en la esquina superior derecha)

# Clone tu fork
git clone https://github.com/TU_USUARIO/toka-technical-test.git
cd toka-technical-test

# Agregar upstream remoto
git remote add upstream https://github.com/ORIGINAL_OWNER/toka-technical-test.git
```

### 2. Crear rama de feature

```bash
# Actualizar main del upstream
git fetch upstream
git checkout main
git merge upstream/main

# Crear rama de feature
git checkout -b feature/descripcion-corta
```

### 3. Hacer cambios

- Seguir las convenciones de código (ver [DEVELOPMENT.md](DEVELOPMENT.md))
- Escribir tests para nuevas funcionalidades
- Actualizar documentación

### 4. Commit con mensajes semánticos

```bash
git add .
git commit -m "feat(service-name): descripción clara del cambio"
```

**Tipos de commit:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formateo
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Tareas de build/deps

### 5. Push y Pull Request

```bash
git push origin feature/descripcion-corta
```

Abre un **Pull Request** en GitHub con:

- **Descripción clara** de los cambios
- **Referencia a issues** relacionados (si existen)
- **Proof of work** (screenshots, tests, etc)
- **Checklist:**
  ```markdown
  - [ ] He seguido las convenciones de código
  - [ ] He escrito/actualizado tests
  - [ ] He actualizado la documentación
  - [ ] Mi código no tiene errores de linting
  - [ ] Mis commits tienen mensajes semánticos
  ```

---

## 🔍 Estándares de Código

### Linting

```bash
cd services/my-service
npm run lint
npm run lint:fix  # Arreglar automáticamente
```

### Type Safety

```bash
npm run type-check
```

### Formatting

```bash
npm run format
npm run format:check
```

---

## ✅ Checklist de Pull Request

**Antes de hacer submit:**

- [ ] Código sigue las convenciones del proyecto
- [ ] Tests unitarios e integración pasan (`npm test`)
- [ ] Coverage > 80% para código nuevo
- [ ] Documentación actualizada
- [ ] Commit messages son semánticos
- [ ] Sin hardcoded values o secrets
- [ ] Sin warnings de linting
- [ ] Cambios están en una rama descriptiva
- [ ] PR tiene descripción clara

---

## 🐛 Reportar Bugs

### Crear Issue

1. Ve a la sección **Issues**
2. Click en **New Issue**
3. Usa template: **Bug Report**

### Información Requerida

```markdown
## Descripción
[Explicación clara del bug]

## Pasos para Reproducir
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

## Comportamiento Esperado
[Qué debería pasar]

## Comportamiento Actual
[Qué está pasando]

## Entorno
- SO: [macOS/Linux/Windows]
- Node.js: [version]
- Servicio afectado: [auth-service/user-service/etc]

## Log/Error
[Stack trace o logs relevantes]

## Archivos Adjuntos
[Screenshots, videos, etc]
```

---

## 💡 Solicitar Nuevas Funcionalidades

### Crear Issue

1. Ve a **Issues**
2. Click **New Issue**
3. Usa template: **Feature Request**

### Información Requerida

```markdown
## Descripción
[Qué necesita ser agregado]

## Caso de Uso
[Por qué es necesario]

## Solución Propuesta
[Cómo podría implementarse]

## Alternativas Consideradas
[Otras soluciones posibles]

## Contexto Adicional
[Información relevante]
```

---

## 📚 Documentación

### Actualizar README
- Mantener estructura consistente
- Incluir ejemplos de código
- Actualizar tablas de contenido

### Documentar APIs
```typescript
/**
 * @api {post} /users Crear usuario
 * @apiVersion 1.0.0
 * @apiName CreateUser
 * @apiGroup Users
 * @apiPermission jwt
 *
 * @apiParam {String} email Email del usuario
 * @apiParam {String} password Contraseña
 *
 * @apiSuccess {String} id ID del usuario
 * @apiSuccess {String} email Email del usuario
 *
 * @apiError (400) {String} error Descripción del error
 */
```

### Documentar Structs/Classes
```typescript
/**
 * Estructura de respuesta para un usuario
 * 
 * @property {string} id - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {Date} createdAt - Fecha de creación
 */
interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}
```

---

## 🤝 Código Review

### Como Revisor

- Ser constructivo y respetuoso
- Proporcionar ejemplos de código mejorado
- Reconocer las contribuciones positivas
- Señalar todos los problemas encontrados

### Como Autor

- Estar abierto a feedback
- Responder a comentarios puntualmente
- Solicitar clarificación si es necesario
- Hacer cambios solicitados para la aprobación

---

## 🎓 Convenciones del Proyecto

### Estructura de Servicios
Ver [serviceTemplate](./services/auth-service/README.md)

### DTOs Compartidos
Ver [shared/README.md](./shared/README.md)

### Patrones de Error
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}
```

---

## 🚀 Subprocesos

### Para Reportar Security Issues

**NO abras un issue público.** 

Contactar a: `security@toka.dev` (si existe)

Incluir:
- Descripción del vulnerability
- Pasos para reproducir
- Impacto potencial
- Si posible, un fix sugerido

---

## 📞 Preguntas y Soporte

- **Preguntas generales**: Abre una Discussion en GitHub
- **Problemas técnicos**: Abre un Issue con etiqueta `help wanted`
- **Contacto directo**: [Email/Discord/Slack]

---

## 📜 Licencia

Al contribuir, aceptas que tu código será bajo la misma licencia del proyecto.

---

## 🙏 Agradecimientos

Gracias por hacer el proyecto mejor. ¡Tu aporte es valioso!

---

**Última actualización**: Febrero 2026
