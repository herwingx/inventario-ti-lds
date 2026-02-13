# 🗂️ Diccionario de Datos (Schema Reference)

> **Capa de Persistencia:** MySQL 8.0 + Prisma ORM
>
> Referencia técnica de la estructura de datos, tipos de campo, enumeraciones y relaciones del sistema.
> Actualizado a: 2026-02-13

---

## 📊 Catálogos Estándar

### Estados del Sistema (`status`)
Tabla: `status`
| ID | Nombre | Descripción |
|:---|:---|:---|
| 1 | `Activo` | Registro operativo y habilitado. |
| 2 | `Inactivo` | Baja lógica (Soft Delete). |
| 3 | `En Mantenimiento` | Bloqueado para asignación por revisión técnica. |
| 4 | `Asignado` | Vinculado a un empleado o área. |
| 5 | `Disponible` | Libre en inventario para nueva asignación. |

### Roles de Usuario (`roles`)
Tabla: `roles`
| ID | Rol | Alcance |
|:---|:---|:---|
| 1 | `Administrador` | Control total del sistema y gestión de usuarios. |
| 2 | `Soporte` | Gestión de inventario, mantenimientos y tickets. |
| 3 | `Consultor` | Acceso de solo lectura para reportes y auditoría. |

---

## 💻 Entidades Principales

### Equipos (`equipos`)
Almacena el inventario de hardware.
| Campo | Tipo | Restricción | Descripción |
|:---|:---|:---|:---|
| `id` | `Int` | PK, AI | Identificador interno. |
| `numero_serie` | `String(100)` | UNIQUE | Serial del fabricante. |
| `qr_token` | `String(64)` | UNIQUE | Token para acceso público QR. |
| `id_status` | `Int` | FK | Estado actual (FK: status). |
| `id_sucursal_actual` | `Int` | FK | Ubicación física actual. |
| `mac_address` | `String(20)` | UNIQUE | Dirección MAC para control de red. |
| `proxima_fecha_mantenimiento` | `Date` | NULL | Calculado según frecuencia. |

### Asignaciones (`asignaciones`)
Histórico de préstamos de equipos.
| Campo | Tipo | Restricción | Descripción |
|:---|:---|:---|:---|
| `id` | `Int` | PK, AI | Identificador de transacción. |
| `id_equipo` | `Int` | FK | Equipo prestado. |
| `id_empleado` | `Int` | FK | Empleado responsable. |
| `fecha_asignacion` | `DateTime` | NOT NULL | Fecha de inicio de custodia. |
| `fecha_fin_asignacion` | `DateTime` | NULL | Fecha de devolución (NULL = Activa). |
| `id_status_asignacion` | `Int` | FK | Estado de la asignación (1: Activa, 2: Finalizada). |

---

## 🎫 Módulo de Soporte

### Tickets (`tickets`)
Sistema de gestión de incidentes.
| Campo | Tipo | Descripción |
|:---|:---|:---|
| `token_acceso` | `String(64)` | Token único para seguimiento externo (uuid). |
| `tipo_falla` | `ENUM` | `HARDWARE`, `SOFTWARE`, `RED`, `IMPRESORA`, `OTRO`. |
| `prioridad` | `ENUM` | `BAJA`, `MEDIA`, `ALTA`, `CRITICA`. |
| `estatus` | `ENUM` | `ABIERTO`, `EN_PROGRESO`, `PENDIENTE`, `RESUELTO`, `CERRADO`. |
| `evidencia_url` | `String` | URL relativa a archivo adjunto. |

---

## 🔍 Auditoría Forense (`logs_sistema`)
| Campo | Tipo | Descripción |
|:---|:---|:---|
| `id_usuario` | `Int` | Ejecutor de la acción. |
| `accion` | `ENUM` | `CREATE`, `UPDATE`, `DELETE`. |
| `tabla_afectada` | `String` | Nombre de la entidad modificada. |
| `valores_anteriores`| `LongText` | JSON Snapshot previo al cambio. |
| `valores_nuevos` | `LongText` | JSON Snapshot posterior al cambio. |

---

## 📝 Notas de Implementación
*   **Soft Delete:** Se aplica filtro global `where: { id_status: 1 }` para lecturas estándar.
*   **Fechas:** Todas las marcas de tiempo se almacenan en UTC.
*   **Uploads:** Las evidencias de tickets se guardan en el sistema de archivos, la BD solo guarda la ruta relativa.
