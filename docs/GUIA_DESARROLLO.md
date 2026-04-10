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

---

## 🎫 Estándares del Módulo Tickets

Para mantener consistencia con la implementación actual, aplicar estas reglas en cambios futuros del módulo:

### 1. Sincronización (Polling)

- Sidebar de tickets: `10s`
- Vista de lista (`TicketsView`): `15s`
- Vista de detalle (`TicketsDetailView`): `30s`

Reglas:

- Siempre limpiar intervalos en `onUnmounted`.
- Evitar duplicar intervalos al reinicializar vista.
- Cargar inmediatamente antes del primer `setInterval`.
- En sidebar, el badge representa no leídos por rol (no total de tickets activos).
- Comparar no leídos con timestamps de servidor (`fecha_actualizacion`/`fecha_creacion`) para evitar skew entre cliente/servidor.

### 2. Estados y transiciones

- `CERRADO` es estado terminal para no-admin.
- Solo admin puede reabrir `CERRADO -> ABIERTO`.
- No permitir comentarios/adjuntos en `RESUELTO` o `CERRADO`.

### 3. Creación de ticket

- `tipo_falla` debe mapearse desde la categoría elegida en UI.
- `VIEWER` no puede enviar prioridad `CRITICA`.
- Si se extiende la lógica de creación, preservar `resolveTicketEquipo` para auto-vinculación de equipo activo.
- Mantener fallback backend en `resolveTipoFalla` para robustez ante clientes legacy o payloads parciales.

### 4. Comentarios

- UI actual envía comentarios públicos (sin selector de nota interna).
- Mantener compatibilidad backend con `es_interno` por datos históricos.
- Si se reintroducen notas internas en UI, documentar permisos por rol y filtrado de visibilidad antes de habilitar.

### 5. Política de notificaciones

- Correo recomendado para eventos transaccionales: nuevo ticket, asignación/reasignación, cambios de estatus y reapertura.
- Evitar correo por cada mensaje en chats activos para prevenir fatiga de notificaciones.
- Usar badge web de no leídos como canal principal para actividad conversacional frecuente.
- Flag operacional: `TICKETS_EMAIL_COMMENTS=false` (default) para mantener deshabilitadas notificaciones por comentarios; habilitar en contingencia con `true`.

### 6. Datos relacionados en detalle

En `findById` de tickets:

- Priorizar query principal liviana.
- Para IP de equipo, usar query secundaria controlada sobre `asignaciones` activas + `direcciones_ip`.
- Evitar includes anidados complejos si generan errores de Prisma o consultas difíciles de mantener.
