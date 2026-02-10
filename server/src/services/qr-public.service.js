/**
 * @module Services/QrPublic
 * @description Lógica de negocio para acceso público vía QR usando Prisma.
 */
const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

class QrPublicService {
  static async getEquipoByToken(token) {
    const e = await prisma.equipos.findFirst({
      where: { qr_token: token },
      include: {
        tipos_equipo: true,
        status: true,
        sucursales_equipos_id_sucursal_actualTosucursales: {
          include: { empresas: true }
        }
      }
    });

    if (!e) return null;

    const ticketsActivos = await prisma.tickets.findMany({
      where: { id_equipo: e.id, estatus: { notIn: ['RESUELTO', 'CERRADO'] } },
      orderBy: { fecha_creacion: 'desc' }
    });

    const historial = await prisma.tickets.findMany({
      where: { id_equipo: e.id, estatus: { in: ['RESUELTO', 'CERRADO'] } },
      orderBy: { fecha_creacion: 'desc' },
      take: 20
    });

    return {
      equipo: {
        id: e.id,
        marca: e.marca,
        modelo: e.modelo,
        numero_serie: e.numero_serie,
        tipo: e.tipos_equipo?.nombre_tipo,
        estado: e.status?.nombre_status,
        sucursal: e.sucursales_equipos_id_sucursal_actualTosucursales?.nombre,
        empresa: e.sucursales_equipos_id_sucursal_actualTosucursales?.empresas?.nombre
      },
      tickets_activos: ticketsActivos,
      tickets_historial: historial
    };
  }

  static async createPublicTicket(token, data) {
    const { tipo_falla, descripcion, nombre_reporta, email_reporta } = data;

    const equipo = await prisma.equipos.findFirst({ where: { qr_token: token } });
    if (!equipo) return null;

    const token_acceso = uuidv4().replace(/-/g, '').substring(0, 16);

    let descripcionFinal = descripcion;
    if (nombre_reporta || email_reporta) {
      descripcionFinal += `\n\n---\nReportado por: ${nombre_reporta || 'Anónimo'}`;
      if (email_reporta) descripcionFinal += ` (${email_reporta})`;
    }

    const ticket = await prisma.tickets.create({
      data: {
        id_equipo: equipo.id,
        token_acceso,
        tipo_falla: tipo_falla,
        descripcion: descripcionFinal,
        prioridad: 'MEDIA',
        estatus: 'ABIERTO',
        email_reporta,
        nombre_reporta
      }
    });

    return { ...ticket, equipo_info: equipo };
  }

  static async getTicketStatus(token) {
    const ticket = await prisma.tickets.findUnique({
      where: { token_acceso: token },
      include: {
        equipos: true,
        usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: {
          select: { username: true }
        },
        ticket_comentarios: {
          where: { es_interno: false },
          orderBy: { fecha_creacion: 'asc' },
          include: { usuarios_sistema: { select: { username: true } } }
        }
      }
    });

    if (!ticket) return null;

    return {
      ticket: {
        id: ticket.id,
        tipo_falla: ticket.tipo_falla,
        descripcion: ticket.descripcion,
        prioridad: ticket.prioridad,
        estatus: ticket.estatus,
        tecnico: ticket.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema?.username,
        equipo: `${ticket.equipos?.marca} ${ticket.equipos?.modelo}`,
        fecha_creacion: ticket.fecha_creacion,
        fecha_actualizacion: ticket.fecha_actualizacion,
        fecha_cierre: ticket.fecha_cierre
      },
      comentarios: ticket.ticket_comentarios.map(c => ({
        contenido: c.contenido,
        fecha_creacion: c.fecha_creacion,
        autor: c.usuarios_sistema?.username || 'Usuario'
      })),
      puede_comentar: ticket.estatus !== 'CERRADO'
    };
  }

  static async addPublicComment(token, data) {
    const { contenido, nombre } = data;
    const ticket = await prisma.tickets.findUnique({ where: { token_acceso: token } });

    if (!ticket || ticket.estatus === 'CERRADO') return null;

    const autor = ticket.nombre_reporta || nombre || 'Usuario';
    const contenidoFinal = `[${autor}]: ${contenido.trim()}`;

    return await prisma.ticket_comentarios.create({
      data: {
        id_ticket: ticket.id,
        contenido: contenidoFinal,
        es_interno: false
      }
    });
  }

  static async uploadEvidence(token, url) {
    const ticket = await prisma.tickets.findUnique({ where: { token_acceso: token } });
    if (!ticket || ticket.estatus === 'CERRADO') return null;

    return await prisma.tickets.update({
      where: { id: ticket.id },
      data: { evidencia_url: url }
    });
  }
}

module.exports = QrPublicService;
