/**
 * @module Services/Asignacion
 * @description Lógica de negocio para Asignaciones usando Prisma y Transacciones.
 */
const prisma = require('../config/prisma');

const STATUS_ASIGNADO = 4;
const STATUS_DISPONIBLE = 5;
const STATUS_ASIGNACION_ACTIVA = 1;
const STATUS_ASIGNACION_FINALIZADA = 6;

class AsignacionService {
  static async findAll(filters) {
    const { equipoId, empleadoId, activa, sucursalId, areaId, ipId } = filters;

    let where = {};
    if (equipoId) where.id_equipo = parseInt(equipoId);
    if (empleadoId) where.id_empleado = parseInt(empleadoId);
    if (sucursalId) where.id_sucursal_asignado = parseInt(sucursalId);
    if (areaId) where.id_area_asignado = parseInt(areaId);
    if (ipId) where.id_ip = parseInt(ipId);

    if (activa === 'true') where.fecha_fin_asignacion = null;
    else if (activa === 'false') where.fecha_fin_asignacion = { not: null };

    const raw = await prisma.asignaciones.findMany({
      where,
      include: {
        equipos_asignaciones_id_equipoToequipos: {
          include: { tipos_equipo: true }
        },
        empleados: true,
        sucursales: true,
        areas: true,
        equipos_asignaciones_id_equipo_padreToequipos: true,
        direcciones_ip: true,
        status: true
      },
      orderBy: [
        { fecha_asignacion: 'desc' },
        { id: 'desc' }
      ]
    });

    return raw.map(a => ({
      ...a,
      equipo_numero_serie: a.equipos_asignaciones_id_equipoToequipos?.numero_serie,
      equipo_nombre: a.equipos_asignaciones_id_equipoToequipos?.nombre_equipo,
      equipo_tipo_nombre: a.equipos_asignaciones_id_equipoToequipos?.tipos_equipo?.nombre_tipo,
      empleado_nombres: a.empleados?.nombres,
      empleado_apellidos: a.empleados?.apellidos,
      sucursal_asignada_nombre: a.sucursales?.nombre,
      area_asignada_nombre: a.areas?.nombre,
      ip_direccion: a.direcciones_ip?.direccion_ip,
      status_nombre: a.status?.nombre_status
    }));
  }

  static async findById(id) {
    const a = await prisma.asignaciones.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos_asignaciones_id_equipoToequipos: {
          include: { tipos_equipo: true }
        },
        empleados: true,
        sucursales: true,
        areas: true,
        equipos_asignaciones_id_equipo_padreToequipos: true,
        direcciones_ip: true,
        status: true
      }
    });

    if (!a) return null;

    return {
      ...a,
      equipo_numero_serie: a.equipos_asignaciones_id_equipoToequipos?.numero_serie,
      equipo_nombre: a.equipos_asignaciones_id_equipoToequipos?.nombre_equipo,
      equipo_tipo_nombre: a.equipos_asignaciones_id_equipoToequipos?.tipos_equipo?.nombre_tipo,
      empleado_nombres: a.empleados?.nombres,
      empleado_apellidos: a.empleados?.apellidos,
      sucursal_asignada_nombre: a.sucursales?.nombre,
      area_asignada_nombre: a.areas?.nombre,
      ip_direccion: a.direcciones_ip?.direccion_ip,
      status_nombre: a.status?.nombre_status
    };
  }

  static async create(data) {
    const { componentes, ...asignacionData } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Validar unicidad (equipo no tenga asignación activa)
      const activeEquipo = await tx.asignaciones.findFirst({
        where: { id_equipo: asignacionData.id_equipo, fecha_fin_asignacion: null }
      });
      if (activeEquipo) throw new Error('CONFLICT: El equipo ya tiene una asignación activa.');

      if (asignacionData.id_ip) {
        const activeIp = await tx.asignaciones.findFirst({
          where: { id_ip: asignacionData.id_ip, fecha_fin_asignacion: null }
        });
        if (activeIp) throw new Error('CONFLICT: La IP ya tiene una asignación activa.');
      }

      // 2. Crear asignación principal
      const newAsignacion = await tx.asignaciones.create({
        data: {
          ...asignacionData,
          fecha_asignacion: new Date(asignacionData.fecha_asignacion)
        }
      });

      // 3. Actualizar estados de Equipo e IP
      await tx.equipos.update({
        where: { id: asignacionData.id_equipo },
        data: { id_status: STATUS_ASIGNADO }
      });

      if (asignacionData.id_ip) {
        // Lógica de sucursal para IP
        let sucursalIp = asignacionData.id_sucursal_asignado;
        if (!sucursalIp && asignacionData.id_empleado) {
          const emp = await tx.empleados.findUnique({ where: { id: asignacionData.id_empleado } });
          sucursalIp = emp?.id_sucursal;
        } else if (!sucursalIp && asignacionData.id_area_asignado) {
          const area = await tx.areas.findUnique({ where: { id: asignacionData.id_area_asignado } });
          const suc = await tx.sucursales.findFirst({ where: { id_empresa: area.id_empresa } });
          sucursalIp = suc?.id;
        }

        await tx.direcciones_ip.update({
          where: { id: asignacionData.id_ip },
          data: { id_status: STATUS_ASIGNADO, id_sucursal: sucursalIp }
        });
      }

      // 4. Manejar componentes si existen
      if (componentes && componentes.length > 0) {
        for (const compId of componentes) {
          await tx.asignaciones.create({
            data: {
              id_equipo: compId,
              id_equipo_padre: asignacionData.id_equipo,
              id_empleado: asignacionData.id_empleado,
              id_sucursal_asignado: asignacionData.id_sucursal_asignado,
              id_area_asignado: asignacionData.id_area_asignado,
              fecha_asignacion: new Date(asignacionData.fecha_asignacion),
              id_status_asignacion: STATUS_ASIGNACION_ACTIVA,
              observacion: `Componente de ${asignacionData.id_equipo}`
            }
          });
          await tx.equipos.update({
            where: { id: compId },
            data: { id_status: STATUS_ASIGNADO }
          });
        }
      }

      return newAsignacion;
    });
  }

  static async update(id, data) {
    const asignacionId = parseInt(id);

    return await prisma.$transaction(async (tx) => {
      const current = await tx.asignaciones.findUnique({ where: { id: asignacionId } });
      if (!current) return null;

      const eraActiva = current.fecha_fin_asignacion === null;

      // Lógica de finalización/sincronización
      let updateData = { ...data };
      if (updateData.fecha_fin_asignacion) updateData.fecha_fin_asignacion = new Date(updateData.fecha_fin_asignacion);
      if (updateData.fecha_asignacion) updateData.fecha_asignacion = new Date(updateData.fecha_asignacion);

      if (updateData.id_status_asignacion === STATUS_ASIGNACION_FINALIZADA && !updateData.fecha_fin_asignacion) {
        updateData.fecha_fin_asignacion = new Date();
      } else if (updateData.fecha_fin_asignacion && updateData.id_status_asignacion !== STATUS_ASIGNACION_FINALIZADA) {
        updateData.id_status_asignacion = STATUS_ASIGNACION_FINALIZADA;
      }

      const esAhoraActiva = updateData.fecha_fin_asignacion === undefined ? eraActiva : updateData.fecha_fin_asignacion === null;

      // Actualizar estados de Equipo/IP si cambia de Activo a Finalizado
      if (eraActiva && !esAhoraActiva) {
        if (current.id_equipo) await tx.equipos.update({ where: { id: current.id_equipo }, data: { id_status: STATUS_DISPONIBLE } });
        if (current.id_ip) await tx.direcciones_ip.update({ where: { id: current.id_ip }, data: { id_status: STATUS_DISPONIBLE } });

        // Liberar componentes
        await tx.asignaciones.updateMany({
          where: { id_equipo_padre: current.id_equipo, fecha_fin_asignacion: null },
          data: { fecha_fin_asignacion: updateData.fecha_fin_asignacion, id_status_asignacion: STATUS_ASIGNACION_FINALIZADA }
        });

        const componentes = await tx.asignaciones.findMany({ where: { id_equipo_padre: current.id_equipo, fecha_fin_asignacion: updateData.fecha_fin_asignacion } });
        for (const c of componentes) {
          await tx.equipos.update({ where: { id: c.id_equipo }, data: { id_status: STATUS_DISPONIBLE } });
        }
      }
      // Si cambia de Finalizado a Activo (Regla de negocio: No permitido usualmente, pero manejamos la lógica por si acaso)
      else if (!eraActiva && esAhoraActiva) {
        throw new Error('CONFLICT: Una asignación finalizada no puede ser reactivada.');
      }

      return await tx.asignaciones.update({
        where: { id: asignacionId },
        data: updateData
      });
    });
  }

  static async delete(id) {
    const asignacionId = parseInt(id);
    return await prisma.$transaction(async (tx) => {
      const current = await tx.asignaciones.findUnique({ where: { id: asignacionId } });
      if (!current) return null;

      if (current.fecha_fin_asignacion === null) {
        await tx.equipos.update({ where: { id: current.id_equipo }, data: { id_status: STATUS_DISPONIBLE } });
        if (current.id_ip) await tx.direcciones_ip.update({ where: { id: current.id_ip }, data: { id_status: STATUS_DISPONIBLE } });
      }

      return await tx.asignaciones.delete({ where: { id: asignacionId } });
    });
  }

  static async getComponentes(asignacionId) {
    const a = await prisma.asignaciones.findUnique({ where: { id: parseInt(asignacionId) } });
    if (!a) return null;

    return await prisma.asignaciones.findMany({
      where: { id_equipo_padre: a.id_equipo, fecha_fin_asignacion: null },
      include: {
        equipos_asignaciones_id_equipoToequipos: {
          include: { tipos_equipo: true }
        }
      }
    });
  }
}

module.exports = AsignacionService;
