# 🛠️ Guía de Desarrollo (Developer Experience)

> **Workflow de Ingeniería:** Sigue estos pasos para expandir las capacidades del sistema.

---

## 1. 🏗️ Crear un Nuevo Módulo (Backend)

Sigue el patrón de diseño **Controller-Service-Repository** establecido:

1.  **Definir Modelo:** Actualiza `server/prisma/schema.prisma` y ejecuta `npx prisma migrate dev`.
2.  **Validación (Zod):** Crea un archivo en `src/schemas/` para validar estrictamente el `body` de las peticiones.
    *   *Regla:* Valida tipos primitivos, formatos (email/fecha) y campos obligatorios.
3.  **Servicio:** Implementa la lógica de negocio pura en `src/services/` usando Prisma Client.
4.  **Controlador:** Crea el controlador en `src/controllers/` usando el wrapper `asyncHandler`.
    *   *Nota:* No uses `try-catch` para errores 500 estándar, el wrapper lo maneja.
    *   *Nota:* Usa `logger.info()` para acciones exitosas de escritura.
5.  **Rutas:** Registra el endpoint en `src/routes/` y añade documentación **Swagger/OpenAPI** encima de cada ruta.

---

## 2. 🎨 Crear una Nueva Vista (Frontend)

1.  **Servicio API:** Agrega el nuevo endpoint en `client/src/services/NombreService.js`.
2.  **Vista:** Crea el componente `.vue` en `client/src/views/`. Utiliza los componentes de **PrimeVue** para consistencia.
3.  **Rutas:** Registra la vista en `client/src/router/index.js`. Protege la ruta con `meta: { requiresAuth: true }`.

---

## 📝 Convenciones de Código

*   **Variables:** `camelCase` (ej. `usuarioId`).
*   **Archivos:** `kebab-case` o `camelCase` consistente (ej. `auth.controller.js`).
*   **Commits:** `tipo(alcance): descripción` (ej. `feat(auth): login endpoint`).
*   **Logging:** Usar `logger` de `src/utils/logger.js` en lugar de `console.log`.

```javascript
/**
 * Ejemplo de Controlador Moderno
 */
const createItem = asyncHandler(async (req, res) => {
  const validation = createItemSchema.safeParse({ body: req.body });
  if (!validation.success) throw new Error('Validation Failed');
  
  const item = await Service.create(validation.data.body);
  logger.info(`Item created: ${item.id}`);
  
  res.status(201).json(item);
});
```
