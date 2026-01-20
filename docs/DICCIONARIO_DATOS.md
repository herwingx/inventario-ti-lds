# 🗂️ Diccionario de Datos

Referencia rápida de los valores estándar y enumeraciones utilizadas en la base de datos y la lógica de negocio.

---

## 📊 Estados Generales (Tabla: `status`)

Utilizados en Equipos, Asignaciones, Usuarios, etc.

| ID (`id`) | Nombre (`nombre_status`) | Descripción / Uso |
|:----------|:-------------------------|:------------------|
| **1** | **Activo** | Estatus general. Para Asignaciones, significa "Vigente". Para Usuarios, "Habilitado". |
| **2** | **Inactivo / Baja** | Estatus de baja lógica (Soft Delete) o usuario bloqueado. |
| **3** | **En Mantenimiento** | El equipo está en revisión técnica (bloqueado para asignación). |
| **4** | **Asignado / Ocupado** | El equipo/IP está asociado a un usuario o área (no disponible). |
| **5** | **Disponible** | El equipo/IP está libre en inventario listo para usarse. |
| **6** | **Finalizada** | Para Asignaciones controladas que concluyeron (histórico). |
| **8** | **Reservada** | Para IPs que no deben asignarse automáticamente (Infraestructura). |
| **?** | **Robado/Extraviado** | (Verificar ID en DB, usualmente ID alto para auditoría). |


*(Nota: Verificar tabla `status` en DB para lista actualizada)*

---

## 👥 Roles de Usuario (Tabla: `roles`)

| ID | Rol | Permisos |
|:---|:----|:---------|
| **1** | **Administrador** | Acceso total (CRUD, Usuarios, Configuración). |
| **2** | **Soporte** | Acceso a Tickets, Inventario (Lectura/Escritura limitada). |
| **3** | **Viewer** | Solo lectura (Reportes). |

---

## 💻 Tipos de Equipo (Tabla: `tipos_equipo`)

| ID | Tipo | Ejemplos |
|:---|:-----|:---------|
| **1** | Laptop | Portátiles Windows/Mac. |
| **2** | Desktop | PCs de escritorio / Torres. |
| **3** | Impresora | Lásers, Multifuncionales. |
| **4** | Monitor | Pantallas externas. |
| **5** | Periférico | Teclados, Mouse, Webcams. |
| **6** | Redes | Switch, Router, AP. |

---

## 🏢 Estructura Organizacional

### Sucursales
Las sucursales se identifican por ID pero también tienen tipos:
*   **Matriz:** Oficina central.
*   **Sucursal:** Oficina regional.
*   **Bodega:** Almacenamiento exclusivo.

---

## 🎫 Tickets de Soporte (Fase 2)

### Estados de Tickets (`estatus`)

| Valor | Descripción |
|:------|:------------|
| `ABIERTO` | Ticket recién creado, pendiente de atención. |
| `EN_PROGRESO` | Ticket en proceso de resolución por un técnico. |
| `PENDIENTE` | En espera de información adicional o recurso. |
| `RESUELTO` | Problema solucionado, pendiente de confirmación. |
| `CERRADO` | Ticket finalizado y archivado. |

### Tipos de Falla (`tipo_falla`)

| Valor | Descripción |
|:------|:------------|
| `HARDWARE` | Problemas físicos (pantalla, teclado, disco, etc). |
| `SOFTWARE` | Problemas de programas, sistema operativo, apps. |
| `RED` | Problemas de conexión, internet, VPN. |
| `IMPRESORA` | Problemas específicos de impresión. |
| `OTRO` | Otros problemas no categorizados. |

### Prioridades de Tickets (`prioridad`)

| Valor | Descripción | SLA Sugerido |
|:------|:------------|:-------------|
| `BAJA` | Puede esperar, no afecta operación. | 72h |
| `MEDIA` | Afecta productividad pero hay alternativa. | 24h |
| `ALTA` | Afecta operación crítica. | 8h |
| `CRITICA` | Detiene completamente la operación. | 4h |

---

## 🔍 Auditoría (Fase 2)

### Acciones de Log (`accion`)

| Valor | Descripción |
|:------|:------------|
| `CREATE` | Creación de un nuevo registro. |
| `UPDATE` | Modificación de un registro existente. |
| `DELETE` | Eliminación de un registro. |

### Tipos de Evidencia Mantenimiento (`tipo`)

| Valor | Descripción |
|:------|:------------|
| `ANTES` | Foto del estado previo al mantenimiento. |
| `DESPUES` | Foto del resultado post-mantenimiento. |
| `DIAGNOSTICO` | Capturas de diagnóstico o reportes. |

---

---

## 🔍 Detalles de Tablas (Fase 2)

### 🎫 Tickets (`tickets`)

Extensión de la tabla para soporte Helpdesk con QR.

| Columna | Tipo | Descripción |
|:---|:---|:---|
| `token_acceso` | `VARCHAR(64)` | Token único público para seguimiento externo sin login. |
| `email_reporta` | `VARCHAR(255)` | Email del usuario externo que reportó el problema (para notificaciones). |
| `nombre_reporta` | `VARCHAR(100)` | Nombre del reportante externo. |
| `qr_token` (en `equipos`) | `VARCHAR(64)` | Token único asociado al equipo para generar su código QR. |

### 💬 Comentarios de Tickets (`ticket_comentarios`)

Historial de conversación en un ticket.

| Columna | Tipo | Descripción |
|:---|:---|:---|
| `id` | `INT` | PK Auto-incremental. |
| `id_ticket` | `INT` | FK a `tickets`. |
| `id_usuario` | `INT` | FK a `usuarios` (Null si es comentario externo). |
| `contenido` | `TEXT` | Texto del comentario. |
| `es_interno` | `TINYINT(1)` | `1` si es nota interna (invisible al usuario), `0` si es público. |
| `fecha_creacion` | `DATETIME` | Timestamp del comentario. |

### 📜 Logs de Auditoría (`audit_logs`)

Registro de todas las operaciones críticas del sistema.

| Columna | Tipo | Descripción |
|:---|:---|:---|
| `id` | `INT` | PK Auto-incremental. |
| `tabla` | `VARCHAR(50)` | Nombre de la tabla afectada (e.g., `equipos`, `asignaciones`). |
| `accion` | `ENUM` | `CREATE`, `UPDATE`, `DELETE`. |
| `id_registro` | `INT` | ID del registro afectado. |
| `valor_anterior` | `JSON` | Snapshot de los datos antes del cambio (NULL en CREATE). |
| `valor_nuevo` | `JSON` | Snapshot de los datos después del cambio (NULL en DELETE). |
| `id_usuario` | `INT` | FK a `usuarios`. Quien realizó la acción. |
| `detalles` | `TEXT` | Descripción legible del cambio (e.g., "Cambio de estatus: A -> B"). |
| `ip_address` | `VARCHAR(45)` | IP desde donde se realizó la acción. |
| `user_agent` | `VARCHAR(255)` | Navegador/Cliente usado. |
| `fecha` | `DATETIME` | Timestamp de la acción. |

---

## 📝 Convenciones de Base de Datos

*   **Fechas:** Formato `YYYY-MM-DD` para fechas lógicas. `DATETIME` para `created_at`.
*   **Booleanos:** Se utilizan enteros `TINYINT(1)`:
    *   `1` = True / Sí
    *   `0` = False / No
*   **Nulos:**
    *   Campos opcionales (e.g., `fecha_baja`) son `NULL` por defecto.
    *   Claves foráneas opcionales (e.g., `id_asignado_a`) son `NULL` si no hay asignación.
*   **Tokens:** Los tokens QR y de seguimiento son strings de 16 caracteres alfanuméricos.
