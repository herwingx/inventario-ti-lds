/**
 * @module Services/Dashboard
 * @description Lógica de negocio para estadísticas del dashboard usando Prisma.
 */
const prisma = require('../config/prisma');

class DashboardService {
  static async getStats() {
    const [
      totalEquipos,
      disponibles,
      mantenimiento,
      totalEmpleados,
      asignacionesActivas
    ] = await Promise.all([
      prisma.equipos.count(),
      prisma.equipos.count({ where: { id_status: 5 } }),
      prisma.equipos.count({ where: { id_status: 3 } }),
      prisma.empleados.count(),
      prisma.asignaciones.count({ where: { fecha_fin_asignacion: null } })
    ]);

    const equiposPorTipo = await prisma.tipos_equipo.findMany({
      select: {
        nombre_tipo: true,
        _count: { select: { equipos: true } }
      }
    });

    const equiposPorStatus = await prisma.status.findMany({
      select: {
        nombre_status: true,
        _count: { select: { equipos: true } }
      }
    });

    const ultimasAsignaciones = await prisma.asignaciones.findMany({
      take: 5,
      orderBy: { fecha_asignacion: 'desc' },
      include: {
        equipos_asignaciones_id_equipoToequipos: true,
        empleados: true,
        sucursales: true,
        areas: true
      }
    });

    const ultimosMantenimientos = await prisma.mantenimientos.findMany({
      take: 5,
      orderBy: { fecha_programada: 'desc' },
      include: { equipos: true }
    });

    return {
      stats: {
        equipos: {
          total: totalEquipos,
          disponibles,
          mantenimiento,
          por_tipo: equiposPorTipo.map(t => ({ nombre_tipo: t.nombre_tipo, cantidad: t._count.equipos })),
          por_status: equiposPorStatus.map(s => ({ nombre_status: s.nombre_status, cantidad: s._count.equipos }))
        },
        empleados: totalEmpleados,
        asignaciones_activas: asignacionesActivas
      },
      activity: {
        recent_assignments: ultimasAsignaciones.map(a => ({
          fecha: a.fecha_asignacion,
          nombre_equipo: a.equipos_asignaciones_id_equipoToequipos?.nombre_equipo,
          empleado: a.empleados ? `${a.empleados.nombres} ${a.empleados.apellidos}` :
            a.sucursales ? `Sucursal: ${a.sucursales.nombre}` :
              a.areas ? `Área: ${a.areas.nombre}` : 'N/A',
          activo: !a.fecha_fin_asignacion,
          fecha_fin: a.fecha_fin_asignacion
        })),
        recent_maintenances: ultimosMantenimientos.map(m => ({
          fecha: m.fecha_programada,
          nombre_equipo: m.equipos?.nombre_equipo,
          titulo: m.titulo,
          estatus: m.estatus
        }))
      }
    };
  }
}

module.exports = DashboardService;
