/**
 * @module Services/Mantenimiento
 * @description Lógica de negocio para Mantenimientos usando Prisma.
 */
const prisma = require('../config/prisma');

class MantenimientoService {
  static async findAll(filters) {
    const { tipo, estatus, id_equipo, proximos, fecha_inicio, fecha_fin } = filters;

    let where = {};
    if (tipo) where.tipo = tipo;
    if (estatus) where.estatus = estatus;
    if (id_equipo) where.id_equipo = parseInt(id_equipo);

    if (proximos === 'true') {
      where.estatus = { in: ['PENDIENTE', 'EN_PROGRESO'] };
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      where.fecha_programada = { lte: thirtyDaysLater };
    } else if (fecha_inicio && fecha_fin) {
      where.fecha_programada = {
        gte: new Date(fecha_inicio),
        lte: new Date(fecha_fin)
      };
    }

    const raw = await prisma.mantenimientos.findMany({
      where,
      include: {
        equipos: true
      },
      orderBy: proximos === 'true' ? { fecha_programada: 'asc' } : { fecha_programada: 'desc' }
    });

    return raw.map(m => ({
      ...m,
      nombre_equipo: m.equipos?.nombre_equipo,
      numero_serie: m.equipos?.numero_serie
    }));
  }

  static async findById(id) {
    const m = await prisma.mantenimientos.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos: true,
        mantenimiento_archivos: true
      }
    });

    if (!m) return null;

    return {
      ...m,
      archivos: m.mantenimiento_archivos
    };
  }

  static async create(data, userId) {
    const { tipo, ...rest } = data;
    return await prisma.mantenimientos.create({
      data: {
        ...rest,
        tipo: tipo ? tipo.toUpperCase() : 'PREVENTIVO',
        fecha_inicio: new Date(), // Requerido por el esquema Prisma
        fecha_programada: data.fecha_programada ? new Date(data.fecha_programada) : null,
        estatus: 'PENDIENTE'
      }
    });
  }

  static async update(id, data) {
    const maintenanceId = parseInt(id);
    const existing = await prisma.mantenimientos.findUnique({ where: { id: maintenanceId } });
    if (!existing) return null;

    const { estatus, notas_cierre, costo, fecha_realizada, ...rest } = data;

    let updateData = { ...rest };
    if (updateData.fecha_programada) updateData.fecha_programada = new Date(updateData.fecha_programada);
    if (updateData.tipo) updateData.tipo = updateData.tipo.toUpperCase();

    // Actualizar campos financieros/notas si se proveen
    if (costo !== undefined) updateData.costo = costo;

    // Lógica especial para cambio de estatus a COMPLETADO
    if (estatus) {
      const normalizedEstatus = estatus.toUpperCase();
      updateData.estatus = normalizedEstatus;

      if (normalizedEstatus === 'COMPLETADO' && existing.estatus !== 'COMPLETADO') {
        const fechaFin = fecha_realizada ? new Date(fecha_realizada) : new Date();
        updateData.fecha_fin = fechaFin;

        if (notas_cierre) {
          updateData.descripcion = `${existing.descripcion || ''}\n\n[CIERRE]: ${notas_cierre}`;
        }

        // Si es preventivo, actualizar el equipo
        if (existing.tipo === 'PREVENTIVO') {
          const equipo = await prisma.equipos.findUnique({ where: { id: existing.id_equipo } });
          if (equipo && equipo.frecuencia_mantenimiento_meses) {
            const nextDate = new Date(fechaFin);
            nextDate.setMonth(nextDate.getMonth() + equipo.frecuencia_mantenimiento_meses);

            await prisma.equipos.update({
              where: { id: existing.id_equipo },
              data: {
                ultima_fecha_mantenimiento: fechaFin,
                proxima_fecha_mantenimiento: nextDate
              }
            });
          } else {
            await prisma.equipos.update({
              where: { id: existing.id_equipo },
              data: { ultima_fecha_mantenimiento: fechaFin }
            });
          }
        }
      }
    }

    return await prisma.mantenimientos.update({
      where: { id: maintenanceId },
      data: updateData
    });
  }

  static async delete(id) {
    try {
      return await prisma.mantenimientos.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = MantenimientoService;
