const { query } = require('../config/db');

/**
 * Obtiene estadísticas generales para el dashboard.
 * Optimizado para realizar el conteo en base de datos en lugar de en memoria.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Conteos Generales
    const sqlGeneral = `
            SELECT 
                (SELECT COUNT(*) FROM equipos) as total_equipos,
                (SELECT COUNT(*) FROM equipos WHERE id_status = 5) as equipos_disponibles, -- Asumiendo 5 = Disponible
                (SELECT COUNT(*) FROM equipos WHERE id_status = 3) as equipos_mantenimiento, -- Asumiendo 3 = En Mantenimiento
                (SELECT COUNT(*) FROM empleados) as total_empleados,
                (SELECT COUNT(*) FROM asignaciones WHERE fecha_fin_asignacion IS NULL) as asignaciones_activas
        `;

    const [generalStats] = await query(sqlGeneral);

    // 2. Equipos por Tipo (para gráficas)
    const sqlEquiposPorTipo = `
            SELECT te.nombre_tipo, COUNT(e.id) as cantidad
            FROM equipos e
            JOIN tipos_equipo te ON e.id_tipo_equipo = te.id
            GROUP BY te.nombre_tipo
            ORDER BY cantidad DESC
        `;
    const equiposPorTipo = await query(sqlEquiposPorTipo);

    // 2.1 Equipos por Status (para gráficas de disponibilidad)
    const sqlEquiposPorStatus = `
            SELECT st.nombre_status, COUNT(e.id) as cantidad
            FROM equipos e
            JOIN status st ON e.id_status = st.id
            GROUP BY st.nombre_status
            ORDER BY cantidad DESC
        `;
    const equiposPorStatus = await query(sqlEquiposPorStatus);

    // 3. Últimas Asignaciones (Actividad Reciente)
    const sqlUltimasAsignaciones = `
            SELECT a.fecha_asignacion as fecha, e.nombre_equipo, emp.nombres, emp.apellidos, s.nombre as sucursal, ar.nombre as area
            FROM asignaciones a
            JOIN equipos e ON a.id_equipo = e.id
            LEFT JOIN empleados emp ON a.id_empleado = emp.id
            LEFT JOIN sucursales s ON a.id_sucursal_asignado = s.id
            LEFT JOIN areas ar ON a.id_area_asignado = ar.id
            ORDER BY a.fecha_asignacion DESC
            LIMIT 5
        `;
    const ultimasAsignaciones = await query(sqlUltimasAsignaciones);

    // 4. Próximos Mantenimientos (si hubiera fecha programada, por ahora usamos los recientes)
    const sqlUltimosMantenimientos = `
            SELECT m.fecha_inicio as fecha, e.nombre_equipo, m.diagnostico, m.solucion
            FROM mantenimientos m
            JOIN equipos e ON m.id_equipo = e.id
            ORDER BY m.fecha_inicio DESC
            LIMIT 5
        `;
    const ultimosMantenimientos = await query(sqlUltimosMantenimientos);

    res.json({
      stats: {
        equipos: {
          total: generalStats.total_equipos,
          disponibles: generalStats.equipos_disponibles,
          mantenimiento: generalStats.equipos_mantenimiento,
          por_tipo: equiposPorTipo,
          por_status: equiposPorStatus
        },
        empleados: generalStats.total_empleados,
        asignaciones_activas: generalStats.asignaciones_activas
      },
      activity: {
        // Mapeamos para que el frontend reciba nombres consistentes
        recent_assignments: ultimasAsignaciones.map(a => {
          let asignadoA = 'N/A';
          if (a.nombres) asignadoA = `${a.nombres} ${a.apellidos}`;
          else if (a.sucursal) asignadoA = `Sucursal: ${a.sucursal}`;
          else if (a.area) asignadoA = `Área: ${a.area}`;

          return {
            fecha: a.fecha,
            nombre_equipo: a.nombre_equipo,
            empleado: asignadoA
          };
        }),
        recent_maintenances: ultimosMantenimientos
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
