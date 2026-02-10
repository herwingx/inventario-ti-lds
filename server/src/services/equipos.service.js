/**
 * @module Services/Equipo
 * @description Lógica de negocio y acceso a datos para la entidad 'Equipo' usando Prisma ORM.
 */
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

class EquipoService {

  /**
   * Obtiene todos los equipos con información detallada.
   */
  static async findAll() {
    const rawEquipos = await prisma.equipos.findMany({
      include: {
        tipos_equipo: true,
        sucursales: {
          include: {
            empresas: true
          }
        },
        status: true
      }
    });

    // Mapear al formato que espera el frontend/controlador
    return rawEquipos.map(e => ({
      id: e.id,
      numero_serie: e.numero_serie,
      nombre_equipo: e.nombre_equipo,
      marca: e.marca,
      modelo: e.modelo,
      id_tipo_equipo: e.id_tipo_equipo,
      nombre_tipo_equipo: e.tipos_equipo?.nombre_tipo,
      id_sucursal_actual: e.id_sucursal_actual,
      nombre_sucursal_actual: e.sucursales?.nombre,
      id_empresa: e.sucursales?.id_empresa,
      nombre_empresa: e.sucursales?.empresas?.nombre,
      procesador: e.procesador,
      ram: e.ram,
      disco_duro: e.disco_duro,
      sistema_operativo: e.sistema_operativo,
      mac_address: e.mac_address,
      otras_caracteristicas: e.otras_caracteristicas,
      fecha_compra: e.fecha_compra,
      fecha_registro: e.fecha_registro,
      fecha_actualizacion: e.fecha_actualizacion,
      id_status: e.id_status,
      status_nombre: e.status?.nombre_status
    }));
  }

  /**
   * Busca un equipo por ID.
   * @param {number} id
   */
  static async findById(id) {
    const e = await prisma.equipos.findUnique({
      where: { id: parseInt(id) },
      include: {
        tipos_equipo: true,
        sucursales: true,
        status: true
      }
    });

    if (!e) return null;

    return {
      id: e.id,
      numero_serie: e.numero_serie,
      nombre_equipo: e.nombre_equipo,
      marca: e.marca,
      modelo: e.modelo,
      id_tipo_equipo: e.id_tipo_equipo,
      nombre_tipo_equipo: e.tipos_equipo?.nombre_tipo,
      id_sucursal_actual: e.id_sucursal_actual,
      nombre_sucursal_actual: e.sucursales?.nombre,
      procesador: e.procesador,
      ram: e.ram,
      disco_duro: e.disco_duro,
      sistema_operativo: e.sistema_operativo,
      mac_address: e.mac_address,
      otras_caracteristicas: e.otras_caracteristicas,
      fecha_compra: e.fecha_compra,
      fecha_registro: e.fecha_registro,
      fecha_actualizacion: e.fecha_actualizacion,
      id_status: e.id_status,
      status_nombre: e.status?.nombre_status
    };
  }

  /**
   * Crea un nuevo equipo.
   * @param {Object} data - Datos ya validados.
   */
  static async create(data) {
    try {
      const newEquipo = await prisma.equipos.create({
        data: data
      });
      return newEquipo;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: El número de serie o MAC address ya existe.');
      }
      throw error;
    }
  }

  /**
   * Actualiza un equipo existente.
   * @param {number} id
   * @param {Object} data
   */
  static async update(id, data) {
    const equipoId = parseInt(id);
    if (Object.keys(data).length === 0) return false;

    // Validación de negocio: Cambio de estado protegido
    if (data.id_status) {
      const current = await this.findById(equipoId);
      if (!current) return false;

      const STATUS_PROTECTED = [3, 4]; // Mantenimiento (3), Asignado (4)
      if (STATUS_PROTECTED.includes(current.id_status) && current.id_status !== data.id_status) {
        throw new Error('BUSINESS_RULE: No se puede cambiar manualmente el estado de un equipo Asignado o en Mantenimiento.');
      }
    }

    try {
      const result = await prisma.equipos.update({
        where: { id: equipoId },
        data: data
      });
      return !!result;
    } catch (error) {
      if (error.code === 'P2025') return false; // Not found
      throw error;
    }
  }

  /**
   * Elimina un equipo si no tiene referencias.
   * @param {number} id
   */
  static async delete(id) {
    try {
      const result = await prisma.equipos.delete({
        where: { id: parseInt(id) }
      });
      return !!result;
    } catch (error) {
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el equipo porque tiene asignaciones asociadas.');
      }
      if (error.code === 'P2025') return false; // Not found
      throw error;
    }
  }

  /**
   * Devuelve componentes disponibles para asignar.
   */
  static async getAvailableComponents() {
    const rawEquipos = await prisma.equipos.findMany({
      where: {
        id_status: 5, // STATUS_DISPONIBLE
        tipos_equipo: {
          id: { notIn: [1, 2] } // Excluir COMPUTADORA y LAPTOP
        },
        // NOT EXISTS asignaciones activas
        asignaciones_asignaciones_id_equipoToequipos: {
          none: {
            fecha_fin_asignacion: null
          }
        }
      },
      include: {
        tipos_equipo: true,
        sucursales: {
          include: {
            empresas: true
          }
        },
        status: true
      },
      orderBy: [
        { tipos_equipo: { nombre_tipo: 'asc' } },
        { numero_serie: 'asc' }
      ]
    });

    return rawEquipos.map(e => ({
      id: e.id,
      numero_serie: e.numero_serie,
      nombre_equipo: e.nombre_equipo,
      marca: e.marca,
      modelo: e.modelo,
      id_tipo_equipo: e.id_tipo_equipo,
      nombre_tipo_equipo: e.tipos_equipo?.nombre_tipo,
      id_sucursal_actual: e.id_sucursal_actual,
      nombre_sucursal_actual: e.sucursales?.nombre,
      id_empresa: e.sucursales?.id_empresa,
      nombre_empresa: e.sucursales?.empresas?.nombre,
      procesador: e.procesador,
      ram: e.ram,
      disco_duro: e.disco_duro,
      sistema_operativo: e.sistema_operativo,
      mac_address: e.mac_address,
      otras_caracteristicas: e.otras_caracteristicas,
      fecha_compra: e.fecha_compra,
      fecha_registro: e.fecha_registro,
      fecha_actualizacion: e.fecha_actualizacion,
      id_status: e.id_status,
      status_nombre: e.status?.nombre_status
    }));
  }
}

module.exports = EquipoService;
