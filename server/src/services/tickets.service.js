/**
 * @module Services/Ticket
 * @description Lógica de negocio para Tickets usando Prisma.
 */
const prisma = require('../config/prisma');

class TicketService {
  static async findAll(filters) {
    const { estatus, prioridad, tecnicoId, id_equipo } = filters;

    let where = {};
    if (estatus) where.estatus = estatus;
    if (prioridad) where.prioridad = prioridad;
    if (tecnicoId) where.id_asignado_a = parseInt(tecnicoId);
    if (id_equipo) where.id_equipo = parseInt(id_equipo);

    return await prisma.tickets.findMany({
      where,
      include: {
        equipos: true,
        usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema: {
          select: { id: true, username: true }
        },
        usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: {
          select: { id: true, username: true }
        }
      },
      orderBy: { fecha_creacion: 'desc' }
    });
  }

  static async findById(id) {
    const ticket = await prisma.tickets.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos: true,
        usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema: true,
        usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: true,
        ticket_comentarios: {
          include: { usuarios_sistema: { select: { id: true, username: true } } },
          orderBy: { fecha_creacion: 'asc' }
        }
      }
    });

    if (!ticket) return null;

    // Obtener otros tickets del mismo equipo (Historial)
    const historialEquipo = await prisma.tickets.findMany({
      where: { 
        id_equipo: ticket.id_equipo,
        id: { not: ticket.id } // Excluir el ticket actual
      },
      orderBy: { fecha_creacion: 'desc' },
      take: 5
    });

    // Procesar comentarios para que el frontend reciba un autor coherente
    ticket.ticket_comentarios = ticket.ticket_comentarios.map(c => {
      let autorNombre = c.usuarios_sistema?.username || 'Usuario Externo';
      let contenidoLimpio = c.contenido;

      // Si es comentario público (id_usuario null), intentar extraer el nombre del prefijo [...]
      if (!c.id_usuario && c.contenido.startsWith('[')) {
        const match = c.contenido.match(/^\[(.*?)\]: (.*)/);
        if (match) {
          autorNombre = match[1];
          contenidoLimpio = match[2];
        }
      }

      return {
        ...c,
        autor_nombre: autorNombre,
        contenido: contenidoLimpio
      };
    });

    return {
      ...ticket,
      historial_equipo: historialEquipo
    };
  }

  static async create(data, userId) {
    // Generar token_acceso si no viene (para tickets internos)
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4().replace(/-/g, '').substring(0, 16);

    return await prisma.tickets.create({
      data: {
        ...data,
        id_usuario_reporta: userId,
        token_acceso: token,
        estatus: 'ABIERTO'
      }
    });
  }

  static async update(id, data) {
    const ticketId = parseInt(id);
    try {
      const oldTicket = await prisma.tickets.findUnique({ 
        where: { id: ticketId },
        include: { usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: true } 
      });
      if (!oldTicket) return null;

      let updateData = { ...data };
      if (data.estatus === 'RESUELTO' || data.estatus === 'CERRADO') {
        updateData.fecha_cierre = new Date();
      }

      const updated = await prisma.tickets.update({
        where: { id: ticketId },
        data: updateData,
        include: { usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: true }
      });

      // --- GENERAR MENSAJES DE SISTEMA ---
      const systemChanges = [];
      if (data.estatus && data.estatus !== oldTicket.estatus) {
        systemChanges.push(`estatus a ${data.estatus}`);
      }
      if (data.prioridad && data.prioridad !== oldTicket.prioridad) {
        systemChanges.push(`prioridad a ${data.prioridad}`);
      }
      if (data.id_asignado_a !== undefined && data.id_asignado_a !== oldTicket.id_asignado_a) {
        const tecnicoNombre = updated.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema?.username || 'Sin asignar';
        systemChanges.push(`técnico asignado a: ${tecnicoNombre}`);
      }

      if (systemChanges.length > 0) {
        await prisma.ticket_comentarios.create({
          data: {
            id_ticket: ticketId,
            id_usuario: null, // Sistema
            contenido: `[SISTEMA]: Cambió ${systemChanges.join(', ')}`,
            es_interno: false
          }
        });
      }

      return updated;
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

  static async getTecnicos() {
    const users = await prisma.usuarios_sistema.findMany({
      where: { id_status: 1 }, // Solo activos
      select: { id: true, username: true, id_rol: true }
    });
    
    return users.map(u => ({
      id: u.id,
      nombre_usuario: u.username
    }));
  }

  static async getComments(ticketId, includeInternals = false) {
    let where = { id_ticket: parseInt(ticketId) };
    if (!includeInternals) {
      where.es_interno = false;
    }

    return await prisma.ticket_comentarios.findMany({
      where,
      include: { usuarios_sistema: { select: { id: true, username: true } } },
      orderBy: { fecha_creacion: 'asc' }
    });
  }

  static async addComment(ticketId, userId, data) {
    return await prisma.ticket_comentarios.create({
      data: {
        id_ticket: parseInt(ticketId),
        id_usuario: userId,
        contenido: data.contenido,
        es_interno: data.es_interno || false
      }
    });
  }
}

module.exports = TicketService;
