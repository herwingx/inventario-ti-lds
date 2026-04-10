# 📘 Manual de Acceso y Tickets

> **Sistema de Gestión de Activos TI & Helpdesk**
>
> Este manual describe el flujo actual de autenticación, alta de usuarios, creación de tickets generales de TI, asignación y operación diaria. Está pensado para soporte, administración y desarrollo.

## 1. Objetivo

El proyecto ya no opera únicamente como helpdesk de equipos. Ahora soporta:
- Registro de usuarios internos con nombre, apellidos y correo.
- Inicio de sesión con correo o nombre de usuario.
- Envío de contraseña temporal por correo.
- Tickets de TI generales, no solo incidentes ligados a un equipo.
- Tickets de QR para equipos, manteniendo compatibilidad con el flujo histórico.
- Restricción de acceso para que el usuario normal vea solo sus propios tickets.

## 2. Roles del sistema

### 2.1 Admin Tickets
- Ve todos los tickets.
- Asigna técnicos.
- Cambia estatus y prioridad.
- Elimina tickets si el proceso operativo lo requiere.
- Responde y agrega notas internas.

### 2.2 Analista o Técnico
- Atiende tickets asignados.
- Cambia estado y prioridad cuando le corresponde.
- Agrega comentarios internos.
- Recibe notificaciones de asignación.

### 2.3 Usuario Normal
- Se registra con nombre, apellidos y correo.
- Inicia sesión con correo o username.
- Solo ve sus propios tickets.
- Puede crear nuevos tickets desde su panel.
- Puede comentar sobre sus tickets.

## 3. Flujo de acceso

### 3.1 Alta de usuario
1. El usuario abre la ruta pública de registro.
2. Captura nombre, apellidos y correo.
3. El backend valida que el correo no esté registrado.
4. Se crea el acceso en `usuarios_sistema`.
5. El sistema genera una contraseña temporal.
6. La contraseña se envía por correo.
7. El usuario inicia sesión con sus credenciales.

### 3.2 Inicio de sesión
1. El usuario ingresa correo o username.
2. El backend busca coincidencia en `usuarios_sistema`.
3. Si la contraseña es válida y la cuenta está activa, se genera JWT.
4. El cliente guarda token y datos de usuario en `localStorage`.
5. El usuario normal es redirigido a Tickets.

## 4. Flujo de tickets

### 4.1 Ticket general de TI
1. El usuario entra a "Nuevo Ticket".
2. Captura título, categoría, descripción y prioridad.
3. No es obligatorio seleccionar equipo.
4. El backend crea el ticket con estatus `ABIERTO`.
5. El usuario lo ve en su lista y puede dar seguimiento.

### 4.2 Ticket por QR de equipo
1. El usuario escanea el QR del equipo.
2. Se abre la landing pública del activo.
3. Se reporta la falla sin autenticación.
4. El sistema conserva la compatibilidad con `token_acceso`.
5. Si el ticket sí está ligado a un equipo, se mantiene la bitácora histórica del activo.

### 4.3 Asignación
1. El admin abre el detalle del ticket.
2. Selecciona técnico, estatus y prioridad.
3. Al guardar, el sistema registra el cambio.
4. El técnico recibe notificación por correo.
5. El reportante también recibe notificación si aplica.

## 5. Permisos y restricciones

### Usuario Normal
- Puede entrar al panel.
- Solo ve la opción Tickets.
- Solo ve sus tickets.
- No puede actualizar prioridad, estatus ni asignación.
- No puede eliminar tickets.
- No puede marcar notas internas.

### Admin / Técnico
- Tiene acceso a la consola completa.
- Puede ver, editar y administrar tickets.
- Puede responder, asignar y cerrar.

## 6. Modelo de datos relevante

### `usuarios_sistema`
Campos clave para acceso:
- `username`
- `email`
- `nombres`
- `apellidos`
- `password_hash`
- `id_rol`
- `id_empleado` opcional
- `id_status`

### `tickets`
Campos clave para soporte:
- `titulo`
- `categoria`
- `descripcion`
- `tipo_falla`
- `prioridad`
- `estatus`
- `id_equipo` opcional
- `id_usuario_reporta`
- `id_asignado_a`
- `token_acceso`
- `email_reporta`
- `nombre_reporta`

## 7. Endpoints principales

### Autenticación
- `POST /api/auth/signup` crea el usuario y envía credenciales.
- `POST /api/auth/login` acepta correo o username.
- `POST /api/auth/forgot-password` solicita reseteo.
- `POST /api/auth/reset-password` cambia contraseña.

### Tickets
- `GET /api/tickets` lista tickets.
- `POST /api/tickets` crea ticket general.
- `GET /api/tickets/:id` devuelve detalle.
- `PUT /api/tickets/:id` actualiza ticket.
- `GET /api/tickets/:id/comments` consulta conversación.
- `POST /api/tickets/:id/comments` agrega comentario.
- `POST /api/tickets/:id/attachments` adjunta archivo.

### QR público
- `GET /api/q/:token` obtiene datos del equipo.
- `POST /api/q/ticket/:token` crea ticket público.
- `GET /api/q/status/:ticketToken` consulta seguimiento.

## 8. Comandos de operación

### Backend
```bash
cd server
npm install
npx prisma migrate deploy --schema prisma/schema.prisma
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Verificación Prisma
```bash
cd server
npx prisma migrate status --schema prisma/schema.prisma
```

## 9. Checklist de validación

Antes de entregar o modificar el flujo:
- [ ] Un usuario nuevo se registra con nombre, apellidos y correo.
- [ ] El correo recibe contraseña temporal.
- [ ] El login acepta correo o username.
- [ ] El usuario normal solo ve Tickets.
- [ ] El usuario normal solo ve sus tickets.
- [ ] El admin puede asignar y cerrar tickets.
- [ ] El flujo QR de equipos sigue funcionando.
- [ ] La base quedó sincronizada con las migraciones.

## 10. Archivos clave del flujo

### Backend
- [server/src/services/auth.service.js](../server/src/services/auth.service.js)
- [server/src/controllers/auth.controller.js](../server/src/controllers/auth.controller.js)
- [server/src/routes/auth.routes.js](../server/src/routes/auth.routes.js)
- [server/src/services/tickets.service.js](../server/src/services/tickets.service.js)
- [server/src/controllers/tickets.controller.js](../server/src/controllers/tickets.controller.js)
- [server/src/schemas/auth.schema.js](../server/src/schemas/auth.schema.js)
- [server/src/schemas/ticket.schema.js](../server/src/schemas/ticket.schema.js)

### Frontend
- [client/src/views/RegisterView.vue](../client/src/views/RegisterView.vue)
- [client/src/views/LoginView.vue](../client/src/views/LoginView.vue)
- [client/src/views/TicketCreateView.vue](../client/src/views/TicketCreateView.vue)
- [client/src/views/TicketsView.vue](../client/src/views/TicketsView.vue)
- [client/src/views/TicketsDetailView.vue](../client/src/views/TicketsDetailView.vue)
- [client/src/components/layout/TheSidebar.vue](../client/src/components/layout/TheSidebar.vue)

## 11. Nota de mantenimiento

La regla principal es simple: **el frontend solo oculta opciones; el backend define el acceso real**. Si en el futuro se agregan nuevos roles o categorías, primero se ajusta el esquema y después el panel.
