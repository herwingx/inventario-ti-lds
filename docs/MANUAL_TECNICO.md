# 📘 Manual de Operaciones y Mantenimiento (O&M)

> **Continuidad del Negocio:** Procedimientos críticos para la administración, respaldo y resolución de incidentes del Sistema de Inventario TI.

---

## 🗄️ Gestión de Datos (Disaster Recovery)

La integridad de la base de datos MySQL es el activo más crítico. Se deben seguir estos protocolos para evitar la pérdida de información.

### 1. Estrategia de Backups
Se recomienda un esquema de respaldo **Diario (Incremental)** y **Semanal (Full)**.

**Backup Manual Completo:**
```bash
# Exportar estructura y datos
mysqldump -u [usuario] -p --single-transaction --quick --lock-tables=false inventario_soporte > backup_$(date +%Y%m%d).sql
```

**Restauración Crítica:**
1. Crear base de datos vacía: `CREATE DATABASE inventario_soporte;`
2. Importar dump: `mysql -u [usuario] -p inventario_soporte < backup_archivo.sql`
3. Sincronizar Prisma: `npx prisma generate`

### 2. Mantenimiento Preventivo (DB)
Ejecutar mensualmente para optimizar índices:
```sql
OPTIMIZE TABLE equipos, asignaciones, tickets, logs_sistema;
```

---

## 🔧 Resolución de Incidentes (Troubleshooting)

### Nivel 1: Conectividad
*   **Error:** `Network Error` / `ECONNREFUSED`
    *   **Causa:** Backend caído o puerto 3000 bloqueado.
    *   **Acción:** Ejecutar `pm2 list`. Si el proceso está en `errored`, revisar logs con `pm2 logs`.
*   **Error:** `403 Forbidden` (CORS)
    *   **Causa:** Petición desde un dominio no autorizado.
    *   **Acción:** Verificar la variable `CORS_ORIGIN` en el `.env` del servidor.

### Nivel 2: Aplicación
*   **Error:** `Token Expired` / `401 Unauthorized`
    *   **Causa:** El JWT ha expirado o el `JWT_SECRET` fue modificado.
    *   **Acción:** El sistema forzará logout. Si el problema persiste para todos, verificar sincronización de hora del servidor (`ntp`).
*   **Error:** `PrismaClientKnownRequestError`
    *   **Causa:** Inconsistencia entre el código y la base de datos.
    *   **Acción:** Ejecutar `npx prisma db pull` para verificar discrepancias.

---

## 🔑 Gestión de Secretos y Configuración

El sistema depende estrictamente de las variables de entorno. 

| Variable | Impacto si se pierde | Acción de Recuperación |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pérdida total de servicio. | Restaurar conexión a MySQL. |
| `JWT_SECRET` | Cierre de todas las sesiones. | Generar uno nuevo; los usuarios deberán re-loguearse. |
| `VITE_API_URL` | El frontend no encuentra la API. | Re-compilar frontend con `npm run build`. |

---

## 📅 Calendario de Mantenimiento Sugerido

| Tarea | Frecuencia | Responsable |
| :--- | :--- | :--- |
| Revisión de `logs_sistema` (Auditoría) | Semanal | Administrador TI |
| Rotación de `logs/error.log` | Mensual | DevOps/Soporte |
| Prueba de restauración de Backup | Trimestral | DevOps |
| Actualización de dependencias (`npm audit`) | Trimestral | Desarrollador |

---

## 🚨 Contacto de Emergencia
En caso de fallo crítico no documentado, consulte la [Guía de Desarrollo](GUIA_DESARROLLO.md) para entender la traza de errores o contacte al Arquitecto del Sistema.