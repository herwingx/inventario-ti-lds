# 🎫 Fase 2: Helpdesk con QR y Auditoría

Esta fase introduce un módulo completo de Helpdesk que permite la gestión de tickets de soporte, reportes rápidos mediante escaneo de códigos QR en los equipos, y un sistema de auditoría detallado para rastrear cambios.

---

## 🚀 Funcionalidades Principales

### 1. Reporte de Fallas vía QR (Público)
*   **Acceso Rápido:** Cada equipo tiene un código QR único (`/q/:token`).
*   **Información del Equipo:** Al escanear, se muestra marca, modelo, serie y estado actual.
*   **Reporte sin Login:** Cualquier usuario puede reportar una falla llenando un formulario simple (Tipo de falla, Descripción, Email opcional).
*   **Historial de Equipo:** Muestra si el equipo ya tiene tickets abiertos y permite ver su historial de problemas resueltos.
*   **Subida de Evidencia:** Permite subir fotos del problema directamente desde el móvil.

### 2. Seguimiento de Tickets (Público)
*   **Token de Seguimiento:** Al crear un ticket, se genera un enlace único (`/q/ticket/:token`).
*   **Chat con Soporte:** El usuario puede ver actualizaciones y responder a los técnicos desde esta vista.
*   **Notificaciones por Email:**
    *   Confirmación de creación de ticket (al usuario).
    *   Alerta de nuevo ticket (al admin).
    *   Respuesta del técnico (al usuario).
    *   Respuesta del usuario (al admin).

### 3. Gestión de Tickets (Admin/Soporte)
*   **Tablero Kanban:** Vista general de tickets por estado (Abierto, En Progreso, Resuelto).
*   **Detalle Completo:** Vista detallada con información del equipo, usuario reportante y línea de tiempo.
*   **Chat Interno/Externo:** Los técnicos pueden dejar notas internas (solo visibles para ellos) o respuestas públicas (visibles para el usuario).
*   **Asignación:** Asignar tickets a técnicos específicos.
*   **Cambio de Estado:** Flujo de trabajo completo (Abierto -> En Progreso -> Pendiente -> Resuelto -> Cerrado).

### 4. Auditoría Completa (Audit Logs)
*   **Registro Automático:** Se registra cualquier creación, edición o eliminación en tablas críticas (`equipos`, `asignaciones`, `tickets`, `usuarios`).
*   **Detalle de Cambios:** Guarda qué campos cambiaron (valor anterior vs valor nuevo).
*   **Trazabilidad:** Quién hizo el cambio, cuándo, desde qué IP y navegador.
*   **Visualización:** Vista de auditoría en el panel de administración para revisar el historial de acciones.

---

## 🛠️ Arquitectura Técnica

### Base de Datos
*   **`tickets`:** Tabla central. Nuevos campos: `token_acceso`, `email_reporta`, `nombre_reporta`.
*   **`ticket_comentarios`:** Relación 1:N con tickets. Campo `es_interno` separa chat público de privado.
*   **`audit_logs`:** Tabla inmutable para registro de eventos. Usa campos JSON para flexibilidad en `valor_anterior` y `valor_nuevo`.
*   **`equipos`:** Nuevo campo `qr_token` (indexado) para búsquedas rápidas públicas.

### Backend (Node.js/Express)
*   **`qr-public.controller.js`:** Maneja endpoints públicos sin autenticación (rate-limited).
*   **`tickets.controller.js`:** Maneja gestión administrativa de tickets (requiere JWT).
*   **`audit.service.js`:** Servicio centralizado para registrar eventos. Se invoca desde controladores.
*   **`ticketNotification.service.js`:** Servicio de emails usando `nodemailer`. Plantillas HTML profesionales.

### Frontend (Vue 3)
*   **Vistas Públicas:** `QrLandingView` y `TicketTrackingView`. Diseño responsive mobile-first.
*   **Vistas Admin:**
    *   `TicketListView`: Lista filtrable y ordenable.
    *   `TicketDetailView`: Gestión completa del ticket y chat.
    *   `AuditLogsView`: Visor de logs de seguridad.
*   **Componentes:** Uso de librería `lucide-vue-next` para iconos consistentes.

---

## 📧 Configuración de Emails

El sistema utiliza `nodemailer` para el envío de notificaciones. Requiere las siguientes variables en `.env`:

```env
EMAIL_HOST=smtp.ejemplo.com
EMAIL_PORT=587
EMAIL_USER=tu_usuario
EMAIL_PASS=tu_password
EMAIL_FROM=soporte@ejemplo.com
ALERT_EMAIL=admin@ejemplo.com
FRONTEND_URL=http://dominio.com/soporte
```

**Flujo de Notificaciones:**
1.  **Nuevo Ticket:** Usuario -> Sistema -> Email -> Admin
2.  **Confirmación:** Sistema -> Email -> Usuario
3.  **Respuesta Técnico:** Admin -> Sistema -> Email -> Usuario
4.  **Respuesta Usuario:** Usuario -> Sistema -> Email -> Admin

---

## 🔒 Modelo de Seguridad

1.  **Rutas Públicas (`/q/...`):**
    *   No requieren JWT.
    *   Protegidas por tokens UUID v4 aleatorios de alta entropía.
    *   `qr_token` para equipos y `token_acceso` para tickets.
    *   No exponen datos sensibles de usuarios internos.

2.  **Rutas Privadas (`/api/...`):**
    *   Requieren JWT válido.
    *   Roles: Admin tiene acceso total; Soporte tiene acceso a gestión de tickets.

3.  **Auditoría:**
    *   Todo cambio administrativo queda registrado inmutablemente en `audit_logs`.
