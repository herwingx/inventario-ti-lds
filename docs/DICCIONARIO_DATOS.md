# 🗂️ Diccionario de Datos (Schema Reference)

> **Capa de Persistencia:** MySQL 8.0 + Prisma ORM
>
> Referencia técnica de la estructura de datos, tipos de campo, enumeraciones y relaciones del sistema.

---

## 📊 Catálogos Estándar

### Estados del Sistema (`status`)
| ID | Nombre | Descripción |
|:---|:---|:---|
| 1 | `Activo` | Registro operativo y habilitado. |
| 2 | `Inactivo` | Baja lógica (Soft Delete). |
| 3 | `En Mantenimiento` | Bloqueado para asignación por revisión técnica. |
| 4 | `Asignado` | Vinculado a un empleado o área. |
| 5 | `Disponible` | Libre en inventario para nueva asignación. |

### Roles de Usuario (`roles`)
| ID | Rol | Alcance |
|:---|:---|:---|
| 1 | `Administrador` | Control total del sistema y gestión de usuarios. |
| 2 | `Soporte` | Gestión de inventario, mantenimientos y tickets. |
| 3 | `Consultor` | Acceso de solo lectura para reportes y auditoría. |

---

## 💻 Entidades Principales

### Equipos (`equipos`)
| Campo | Tipo | Restricción | Descripción |
|:---|:---|:---|:---|
| `id` | `Int` | PK, AI | Identificador interno. |
| `numero_serie` | `String` | UNIQUE | Identificador físico del fabricante. |
| `id_tipo_equipo` | `Int` | FK | Relación con `tipos_equipo`. |
| `id_sucursal_actual`| `Int` | FK | Ubicación física actual. |
| `qr_token` | `String` | UNIQUE | Token de 64 caracteres para acceso público. |
| `id_status` | `Int` | FK | Estado actual del hardware. |

### Asignaciones (`asignaciones`)
| Campo | Tipo | Restricción | Descripción |
|:---|:---|:---|:---|
| `id` | `Int` | PK, AI | Identificador de transacción. |
| `id_equipo` | `Int` | FK | Activo vinculado. |
| `id_empleado` | `Int` | FK (Opt) | Responsable del activo. |
| `id_ip` | `Int` | FK (Opt) | Dirección IP asignada al activo. |
| `fecha_asignacion` | `DateTime` | NOT NULL | Inicio de la custodia. |
| `firma_receptor` | `LongText` | NULL | Nombre del archivo de imagen de la firma (.png). |
| `url_responsiva_pdf` | `String` | NULL | Nombre del archivo PDF firmado almacenado. |

---

## 🎫 Módulo de Soporte (Fase 2)

### Tickets (`tickets`)
| Campo | Tipo | Descripción |
|:---|:---|:---|
| `token_acceso` | `String` | Token único para seguimiento externo (sin login). |
| `tipo_falla` | `ENUM` | `HARDWARE`, `SOFTWARE`, `RED`, `IMPRESORA`, `OTRO`. |
| `prioridad` | `ENUM` | `BAJA`, `MEDIA`, `ALTA`, `CRITICA`. |
| `estatus` | `ENUM` | `ABIERTO`, `EN_PROGRESO`, `PENDIENTE`, `RESUELTO`, `CERRADO`. |

---

## 🔍 Auditoría Forense (`logs_sistema`)
| Campo | Tipo | Descripción |
|:---|:---|:---|
| `id_usuario` | `Int` | Ejecutor de la acción. |
| `accion` | `ENUM` | `CREATE`, `UPDATE`, `DELETE`. |
| `valores_anteriores`| `JSON` | Snapshot previo al cambio. |
| `valores_nuevos` | `JSON` | Snapshot posterior al cambio. |
| `ip_origen` | `String` | Dirección IPv4/IPv6 del cliente. |

---

## 📝 Notas de Implementación
*   **Soft Delete:** No se ejecutan comandos `DELETE` físicos en tablas maestras; se actualiza `id_status = 2`.
*   **Formato de Fechas:** Todas las marcas de tiempo se almacenan en UTC.