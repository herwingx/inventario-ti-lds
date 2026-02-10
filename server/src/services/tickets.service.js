/**
 * @module Services/Ticket
 * @description Lógica de negocio para Tickets usando Prisma.
 */
const prisma = require('../config/prisma');

class TicketService {
  static async findAll(filters) {
    const { estatus, prioridad, tecnicoId, sucursalId } = filters;

    let where = {};
    if (estatus) where.estatus = estatus;
    if (prioridad) where.prioridad = prioridad;
    if (tecnicoId) where.id_tecnico_asignado = parseInt(tecnicoId);
    if (sucursalId) where.id_sucursal = parseInt(sucursalId);

    return await prisma.tickets.findMany({
      where,
      include: {
        usuarios_sistema_tickets_id_usuario_creadorTousuarios_sistema: true,
        usuarios_sistema_tickets_id_tecnico_asignadoTousuarios_sistema: true,
        sucursales: true,
        equipos: true
      },
      orderBy: { fecha_creacion: 'desc' }
    });
  }

  static async findById(id) {
    return await prisma.tickets.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios_sistema_tickets_id_usuario_creadorTousuarios_sistema: true,
        usuarios_sistema_tickets_id_tecnico_asignadoTousuarios_sistema: true,
        sucursales: true,
        equipos: true
      }
    });
  }

  static async create(data, userId) {
    return await prisma.tickets.create({
      data: {
        ...data,
        id_usuario_creador: userId,
        estatus: 'ABIERTO'
      }
    });
  }

  static async update(id, data) {
    try {
      let updateData = { ...data };
      if (data.estatus === 'RESUELTO' || data.estatus === 'CERRADO') {
        updateData.fecha_resolucion = new Date();
      }
      return await prisma.tickets.update({
        where: { id: parseInt(id) },
        data: updateData
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.tickets.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = TicketService;
