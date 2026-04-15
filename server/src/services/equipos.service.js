/**
 * @module Services/Equipo
 * @description Lógica de negocio y acceso a datos para la entidad 'Equipo' usando Prisma ORM.
 */
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const crypto = require('crypto');

class EquipoService {

  /**
   * Genera un token QR único de 16 caracteres hex.
   */
  static async generateUniqueQrToken() {
    let token;
    let exists = true;

    while (exists) {
      token = crypto.randomBytes(8).toString('hex');
      const existing = await prisma.equipos.findFirst({
        where: { qr_token: token },
        select: { id: true }
      });
      exists = !!existing;
    }

    return token;
  }

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
      ...e, // Incluir todos los campos base, incluido qr_token
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
      status_nombre: e.status?.nombre_status
    }));
  }

  /**
   * Busca un equipo por ID.
   * @param {number} id
   */
  static async findById(id) {
    let e = await prisma.equipos.findUnique({
      where: { id: parseInt(id) },
      include: {
        tipos_equipo: true,
        sucursales: true,
        status: true,
        tickets: {
          orderBy: { fecha_creacion: 'desc' },
          include: {
            usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: {
              select: { username: true }
            }
          }
        }
      }
    });

    if (!e) return null;

    // Backfill automático para equipos legacy sin token QR.
    if (!e.qr_token) {
      const qrToken = await this.generateUniqueQrToken();
      await prisma.equipos.update({
        where: { id: e.id },
        data: { qr_token: qrToken }
      });
      e = { ...e, qr_token: qrToken };
    }

    return {
      ...e,
      nombre_tipo_equipo: e.tipos_equipo?.nombre_tipo,
      nombre_sucursal_actual: e.sucursales?.nombre,
      status_nombre: e.status?.nombre_status,
      historial_tickets: e.tickets.map(t => ({
        id: t.id,
        tipo_falla: t.tipo_falla,
        estatus: t.estatus,
        prioridad: t.prioridad,
        fecha: t.fecha_creacion,
        tecnico: t.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema?.username || 'Sin asignar'
      }))
    };
  }

  /**
   * Crea un nuevo equipo con generación automática de Identidad QR.
   * @param {Object} data - Datos ya validados.
   */
  static async create(data) {
    try {
      // Generar token QR único si no viene en los datos
      if (!data.qr_token) {
        data.qr_token = await this.generateUniqueQrToken();
      }

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
  /**
   * Elimina un equipo. 
   * Intenta borrado físico, si falla por integridad, realiza Soft Delete.
   * @param {number} id
   */
  static async delete(id) {
    const equipoId = parseInt(id);
    const STATUS_ASIGNADO = 4;
    const STATUS_ELIMINADO = 7; // Asumimos 7 si no existe lo buscamos, pero mejor buscamos dinámico o usar config.

    // 1. Verificar estado actual
    const current = await prisma.equipos.findUnique({ where: { id: equipoId } });
    if (!current) return false;

    if (current.id_status === STATUS_ASIGNADO) {
      throw new Error('BUSINESS_RULE: No se puede eliminar un equipo que está actualmente ASIGNADO. Libérelo primero.');
    }

    try {
      // 2. Intentar Hard Delete
      const result = await prisma.equipos.delete({
        where: { id: equipoId }
      });
      return !!result;
    } catch (error) {
      if (error.code === 'P2003') {
        // 3. Fallback a Soft Delete si hay relaciones históricas (tickets, logs, asignaciones viejas)
        // Buscar el estado 'BAJA', 'ELIMINADO' o 'INACTIVO'
        const statusBaja = await prisma.status.findFirst({
          where: {
            nombre_status: { in: ['BAJA', 'ELIMINADO', 'INACTIVO', 'DADO DE BAJA'] }
          }
        });

        if (!statusBaja) {
          throw new Error('CONFIG_ERROR: No existe un estado de "BAJA" o "ELIMINADO" en el sistema para realizar soft delete.');
        }

        const softDelete = await prisma.equipos.update({
          where: { id: equipoId },
          data: {
            id_status: statusBaja.id,
            fecha_actualizacion: new Date()
          }
        });

        return !!softDelete;
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
