/**
 * @module Services/Area
 * @description Lógica de negocio para la entidad 'Area' usando Prisma.
 */
const prisma = require('../config/prisma');

class AreaService {
  /**
   * Obtiene todas las áreas.
   * Filtra por sucursal (empresa de la sucursal) si se solicita.
   */
  static async findAll(id_sucursal) {
    let where = {};
    if (id_sucursal) {
      const sucursal = await prisma.sucursales.findUnique({
        where: { id: parseInt(id_sucursal) }
      });
      if (!sucursal) return [];
      where.id_empresa = sucursal.id_empresa;
    }

    const rawAreas = await prisma.areas.findMany({
      where,
      include: {
        empresas: true,
        status: true
      },
      orderBy: { nombre: 'asc' }
    });

    // Mapear al formato extendido (incluyendo id_sucursal corporativa)
    return await Promise.all(rawAreas.map(async (a) => {
      const corporativo = await prisma.sucursales.findFirst({
        where: {
          id_empresa: a.id_empresa,
          tipos_sucursal: { nombre_tipo: 'Corporativo' }
        }
      });

      return {
        id: a.id,
        nombre: a.nombre,
        id_empresa: a.id_empresa,
        nombre_empresa: a.empresas?.nombre,
        id_sucursal: corporativo?.id,
        id_status: a.id_status,
        status_nombre: a.status?.nombre_status,
        fecha_registro: a.fecha_registro,
        fecha_actualizacion: a.fecha_actualizacion
      };
    }));
  }

  static async findById(id) {
    const a = await prisma.areas.findUnique({
      where: { id: parseInt(id) },
      include: {
        empresas: true,
        status: true
      }
    });

    if (!a) return null;

    const corporativo = await prisma.sucursales.findFirst({
      where: {
        id_empresa: a.id_empresa,
        tipos_sucursal: { nombre_tipo: 'Corporativo' }
      }
    });

    return {
      id: a.id,
      nombre: a.nombre,
      id_empresa: a.id_empresa,
      nombre_empresa: a.empresas?.nombre,
      id_sucursal: corporativo?.id,
      id_status: a.id_status,
      status_nombre: a.status?.nombre_status,
      fecha_registro: a.fecha_registro,
      fecha_actualizacion: a.fecha_actualizacion
    };
  }

  static async create(data) {
    // Regla de Negocio: Validar sucursal Corporativo
    const sucursal = await prisma.sucursales.findUnique({
      where: { id: data.id_sucursal },
      include: { tipos_sucursal: true }
    });

    if (!sucursal) throw new Error('NOT_FOUND: La sucursal no existe.');
    if (sucursal.tipos_sucursal?.nombre_tipo.toUpperCase() !== 'CORPORATIVO') {
      throw new Error('BUSINESS_RULE: Las áreas solo pueden ser creadas para sucursales de tipo Corporativo.');
    }

    try {
      return await prisma.areas.create({
        data: {
          nombre: data.nombre,
          id_empresa: sucursal.id_empresa,
          id_status: data.id_status || 1
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: Ya existe un área con ese nombre para esta empresa.');
      }
      throw error;
    }
  }

  static async update(id, data) {
    let updateData = { ...data };

    if (data.id_sucursal) {
      const sucursal = await prisma.sucursales.findUnique({
        where: { id: data.id_sucursal },
        include: { tipos_sucursal: true }
      });
      if (!sucursal) throw new Error('NOT_FOUND: La sucursal no existe.');
      if (sucursal.tipos_sucursal?.nombre_tipo.toUpperCase() !== 'CORPORATIVO') {
        throw new Error('BUSINESS_RULE: Las áreas solo pueden estar en sucursales de tipo Corporativo.');
      }
      updateData.id_empresa = sucursal.id_empresa;
      delete updateData.id_sucursal;
    }

    try {
      return await prisma.areas.update({
        where: { id: parseInt(id) },
        data: updateData
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: Ya existe un área con ese nombre para esta empresa.');
      }
      throw error;
    }
  }

  static async delete(id) {
    const areaId = parseInt(id);
    try {
      return await prisma.areas.delete({
        where: { id: areaId }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        // Fallback a Soft Delete
        const statusBaja = await prisma.status.findFirst({
          where: {
            nombre_status: { in: ['BAJA', 'ELIMINADO', 'INACTIVO'] }
          }
        });

        if (!statusBaja) {
          throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el área y no existe estado de para inhabilitarla.');
        }

        const softDelete = await prisma.areas.update({
          where: { id: areaId },
          data: {
            id_status: statusBaja.id,
            fecha_actualizacion: new Date()
          }
        });

        return !!softDelete;
      }
      throw error;
    }
  }
}

module.exports = AreaService;
