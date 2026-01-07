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

## 📝 Convenciones de Base de Datos

*   **Fechas:** Formato `YYYY-MM-DD` para fechas lógicas. `DATETIME` para `created_at`.
*   **Booleanos:** Se utilizan enteros `TINYINT(1)`:
    *   `1` = True / Sí
    *   `0` = False / No
*   **Nulos:**
    *   Campos opcionales (e.g., `fecha_baja`) son `NULL` por defecto.
    *   Claves foráneas opcionales (e.g., `id_asignado_a`) son `NULL` si no hay asignación.
