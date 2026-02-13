# ADR 003: Implementación de Borrado Lógico (Soft Delete)

* **Estado:** Aceptado
* **Fecha:** 2026-02-13
* **Contexto:** 
  En sistemas de auditoría e inventario, la trazabilidad es crítica. Eliminar registros físicamente (`DELETE FROM`) destruye el historial de activos y rompe la integridad referencial de reportes antiguos.
  
* **Decisión:**
  Implementar un mecanismo de **Soft Delete** en todas las entidades transaccionales (Equipos, Tickets, Usuarios, Empleados).
  1. **No se usarán sentencias `DELETE`** para destruir datos maestros.
  2. Se usará una columna de estado: `id_status` (Relación con tabla catálogo `status`) o enumeraciones de estado.
  3. El estado `id_status = 2` (Inactivo) representa un registro eliminado lógicamente.
  4. El ORM (Prisma) y los controladores deben filtrar explícitamente `where: { id_status: 1 }` (u otros estados activos) en las consultas de listado.

* **Consecuencias:**
  * **Positivas:** 
    * Permite "deshacer" eliminaciones accidentales. 
    * Mantiene la integridad histórica para auditorías legales y reportes de asignaciones pasadas.
    * Preserva claves foráneas en tablas hijas (ej. una asignación antigua apuntando a un equipo dado de baja).
  * **Negativas:** 
    * Requiere índices adicionales en la columna `id_status` para no afectar el rendimiento de las consultas (`@@index([id_status])`). 
    * La base de datos crece indefinidamente; se requerirá una política de archivado (Cold Storage) a largo plazo (5+ años).
