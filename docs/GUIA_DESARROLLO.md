# 🛠️ Guía de Desarrollo (Developer Experience)

> **Workflow de Ingeniería:** Sigue estos pasos para expandir las capacidades del sistema.

---

## 1. 🏗️ Crear un Nuevo Módulo (Backend)

Sigue el patrón de diseño establecido:

1.  **Definir Modelo:** Actualiza `server/prisma/schema.prisma` y ejecuta `npx prisma migrate dev`.
2.  **Validación (Zod):** Crea un archivo en `src/schemas/` para validar el `body` de las peticiones.
3.  **Servicio:** Implementa la lógica en `src/services/` usando el cliente de Prisma.
4.  **Controlador:** Crea el controlador en `src/controllers/` para orquestar la petición.
5.  **Rutas:** Registra el endpoint en `src/routes/` y móntalo en `server.js`.

---

## 2. 🎨 Crear una Nueva Vista (Frontend)

1.  **Servicio API:** Agrega el nuevo endpoint en `src/services/NombreService.js`.
2.  **Vista:** Crea el componente `.vue` en `src/views/`. Utiliza los componentes de **PrimeVue** para consistencia.
3.  **Rutas:** Registra la vista en `src/router/index.js`. Protege la ruta con `requiresAuth: true` si es necesario.

---

## 📝 Convenciones de Código

*   **Variables:** `camelCase` (ej. `usuarioId`).
*   **Archivos:** `kebab-case` (ej. `auth-controller.js`).
*   **Commits:** `tipo(alcance): descripción` (ej. `feat(auth): login`).
*   **Documentación:** Usa JSDoc para funciones complejas.

```javascript
/**
 * Calcula la fecha del próximo mantenimiento.
 * @param {Date} ultimaFecha - Fecha del último mantenimiento.
 * @param {number} meses - Frecuencia en meses.
 * @returns {Date}
 */
```