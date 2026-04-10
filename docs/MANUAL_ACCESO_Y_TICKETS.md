# 📘 Manual de Acceso y Tickets

> **Sistema de Gestión de Activos TI & Helpdesk**
>
> Este manual describe el flujo vigente de autenticación, gestión de roles, operación de tickets y notificaciones.

## 1. Objetivo

El sistema soporta:
- Registro de usuarios finales por correo corporativo existente y vinculado a empleado.
- Inicio de sesión con correo o username.
- Envío de contraseña temporal por correo.
- Tickets internos y tickets públicos por QR.
- Asignación explícita de responsable operativo (analista o admin).
- Trazabilidad por chat y notificaciones por eventos.

## 2. Roles del sistema

### 2.1 Administrador (roleId = 1)
- Ve todos los tickets.
- Asigna responsable (analista o él mismo).
- Cambia prioridad y estatus.
- Elimina tickets.
- Gestiona usuarios de sistema (alta/edición/baja).

### 2.2 Analista (roleId = 3)
- Ve consola administrativa de tickets.
- Atiende tickets asignados a su usuario.
- Cambia **solo estatus** en tickets asignados.
- Puede comentar y adjuntar evidencia en tickets asignados.
- No puede cambiar prioridad, reasignar ni eliminar.

### 2.3 Usuario Final / Viewer (roleId = 2)
- Se registra con correo corporativo válido y vinculado a empleado.
- Solo ve sus propios tickets.
- Puede crear tickets internos.
- Puede sugerir prioridad `BAJA`, `MEDIA` o `ALTA`.
- No puede establecer `CRITICA`.

## 3. Flujo de acceso

### 3.1 Alta de usuario final
1. El usuario abre la ruta pública de registro.
2. Captura solo correo corporativo.
3. El backend valida que el correo corporativo exista, esté activo y esté ligado a un empleado activo.
4. Se crea el acceso en `usuarios_sistema` con vínculo `id_empleado`.
5. Se genera contraseña temporal y se envía por correo.

### 3.2 Inicio de sesión
1. El usuario ingresa correo o username.
2. Si credenciales y estado son válidos, el backend emite JWT.
3. El cliente guarda token y perfil localmente.
4. El usuario final redirige a tickets; roles administrativos al panel.

## 4. Flujo de tickets

### 4.1 Ticket interno
1. El usuario final captura título, categoría, descripción y prioridad sugerida.
2. El backend crea el ticket en `ABIERTO`.
3. Para usuario final, si existe asignación activa de equipo en su empleado, se vincula automáticamente `id_equipo`.

### 4.2 Asignación de responsable
1. El admin define responsable en detalle del ticket.
2. Responsable permitido: analista o admin activo.
3. Al asignar, se envía correo al responsable.

### 4.3 Operación por responsable
1. El analista opera solo tickets asignados a él.
2. El admin opera cualquier ticket.
3. Cambios de estatus notifican al solicitante.

### 4.4 Ticket público por QR
1. Se crea ticket desde token QR.
2. Si no hay responsable, comentarios del solicitante notifican canal admin (triage).
3. Si hay responsable asignado, comentarios notifican al responsable.

## 5. Reglas de negocio activas

### 5.1 Prioridad
- Usuario final: `BAJA`, `MEDIA`, `ALTA`.
- `CRITICA`: solo admin.
- Analista no puede modificar prioridad.

### 5.2 Transiciones de estatus
Estados: `ABIERTO`, `EN_PROGRESO`, `PENDIENTE`, `RESUELTO`, `CERRADO`.

Reglas implementadas:
- Se validan transiciones permitidas.
- Al pasar a `RESUELTO`/`CERRADO`, se setea `fecha_cierre`.
- Si se reabre un ticket finalizado, `fecha_cierre` se limpia.

### 5.3 Chat y adjuntos
- No se permite comentar ni adjuntar en tickets `RESUELTO` o `CERRADO`.
- Comentarios y adjuntos actualizan `fecha_actualizacion` del ticket para trazabilidad.

## 6. Notificaciones por correo

- **Nuevo ticket:** admins (canal alerta + usuarios admin con correo).
- **Asignación de ticket:** responsable asignado.
- **Comentario de soporte:** solicitante (interno o público).
- **Comentario del solicitante:** responsable asignado; si no existe, canal admin.
- **Cambio de estatus:** solicitante.

## 7. Permisos por endpoint (resumen)

- `POST /api/auth/signup`: público (registro final).
- `GET /api/tickets`: autenticado, con filtro por rol.
- `PUT /api/tickets/:id`:
	- Admin: completo.
	- Analista: solo estatus y solo tickets asignados a él.
	- Viewer: denegado.
- `POST /api/tickets/:id/comments`:
	- Admin/Analista/Viewer autenticados según visibilidad del ticket.

## 8. Checklist de validación operativa

- [ ] Registro final requiere correo corporativo existente y vinculado.
- [ ] Admin puede asignar tickets a analista o a sí mismo.
- [ ] Analista solo actualiza estatus en tickets asignados.
- [ ] Analista no puede reasignar ni cambiar prioridad.
- [ ] Viewer no puede actualizar tickets.
- [ ] Cambio de estatus notifica solicitante.
- [ ] Comentario del solicitante notifica al responsable asignado.
- [ ] Comentarios/adjuntos actualizan `fecha_actualizacion`.

## 9. Archivos clave del flujo

### Backend
- [server/src/services/auth.service.js](../server/src/services/auth.service.js)
- [server/src/controllers/auth.controller.js](../server/src/controllers/auth.controller.js)
- [server/src/services/tickets.service.js](../server/src/services/tickets.service.js)
- [server/src/controllers/tickets.controller.js](../server/src/controllers/tickets.controller.js)
- [server/src/services/ticketNotification.service.js](../server/src/services/ticketNotification.service.js)
- [server/src/controllers/qr-public.controller.js](../server/src/controllers/qr-public.controller.js)
- [server/src/services/qr-public.service.js](../server/src/services/qr-public.service.js)
- [server/src/middleware/auth.middleware.js](../server/src/middleware/auth.middleware.js)

### Frontend
- [client/src/views/RegisterView.vue](../client/src/views/RegisterView.vue)
- [client/src/views/TicketsView.vue](../client/src/views/TicketsView.vue)
- [client/src/views/TicketsDetailView.vue](../client/src/views/TicketsDetailView.vue)
- [client/src/components/layout/TheSidebar.vue](../client/src/components/layout/TheSidebar.vue)

## 10. Nota de mantenimiento

La autoridad final de seguridad y permisos está en backend. El frontend solo refleja y guía la operación.

## 11. Historial de cambios de negocio

### 2026-04-10
- Registro de usuario final endurecido: ahora solo permite correo corporativo activo y vinculado a empleado.
- Vinculación automática de cuenta de usuario con empleado (`id_empleado`) durante el alta.
- Incorporación de `idEquipoAsignado` en sesión/perfil para trazabilidad operativa.
- Política de prioridad actualizada: `CRITICA` reservada a admin; usuario final solo sugiere `BAJA/MEDIA/ALTA`.
- Asignación de tickets ajustada para permitir responsable analista o admin (autoasignación).
- Permisos por rol reforzados en backend:
	- Admin: control total de ticket.
	- Analista: solo estatus/comentarios/adjuntos y solo en tickets asignados.
	- Viewer: sin permisos de actualización.
- Validación de transiciones de estatus implementada en servicio de tickets.
- Manejo consistente de `fecha_cierre`:
	- Se establece al finalizar (`RESUELTO`/`CERRADO`).
	- Se limpia al reabrir.
- Comentarios y adjuntos (internos y públicos) ahora actualizan `fecha_actualizacion` del ticket.
- Notificaciones por correo reordenadas por responsabilidad:
	- Nuevo ticket: canal admin.
	- Asignación: responsable asignado.
	- Comentario del solicitante: responsable asignado (o admin si no hay responsable).
	- Comentario de soporte: solicitante.
	- Cambio de estatus: solicitante.
- Badge de "nuevos" en sidebar mejorado para admin/analista usando "último visto" persistido por usuario.
