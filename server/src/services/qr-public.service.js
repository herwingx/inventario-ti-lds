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
        sucursales: {
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
        marca: e.marca,
        modelo: e.modelo,
        tipo: e.tipos_equipo?.nombre_tipo,
        estado: e.status?.nombre_status,
        sucursal: e.sucursales?.nombre,
        empresa: e.sucursales?.empresas?.nombre
      },
      tickets_activos: ticketsActivos.map(t => ({
        tipo_falla: t.tipo_falla,
        estatus: t.estatus,
        fecha_creacion: t.fecha_creacion
      })),
      tickets_historial: historial.map(t => ({
        tipo_falla: t.tipo_falla,
        estatus: t.estatus,
        fecha_creacion: t.fecha_creacion
      }))
    };
  }

  static async createPublicTicket(token, data) {
    const { tipo_falla, descripcion, nombre_reporta, email_reporta } = data;

    const equipo = await prisma.equipos.findFirst({ where: { qr_token: token } });
    if (!equipo) return null;

    // Mapeo de etiquetas UI a ENUM de Base de Datos
    const mapeoFalla = {
      'No tengo Internet': 'RED',
      'No imprime': 'IMPRESORA',
      'Está muy lenta': 'SOFTWARE',
      'No prende': 'HARDWARE',
      'Programa falla': 'SOFTWARE',
      'Algo está roto': 'HARDWARE'
    };

    const fallaEnum = mapeoFalla[tipo_falla] || 'OTRO';

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
        tipo_falla: fallaEnum,
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
      comentarios: ticket.ticket_comentarios.map(c => {
        let autor = c.usuarios_sistema?.username || 'Usuario';
        let contenido = c.contenido;

        // Si es comentario público, intentar extraer el nombre del prefijo [Nombre]:
        if (!c.id_usuario && contenido.startsWith('[')) {
          const match = contenido.match(/^\[(.*?)\]: (.*)/);
          if (match) {
            autor = match[1];
            contenido = match[2];
          }
        }

        return {
          contenido,
          fecha_creacion: c.fecha_creacion,
          autor
        };
      }),
      puede_comentar: ticket.estatus !== 'CERRADO'
    };
  }

  static async addPublicComment(token, data) {
    const { contenido, nombre } = data;
    const ticket = await prisma.tickets.findUnique({ where: { token_acceso: token } });

    if (!ticket || ticket.estatus === 'CERRADO') return null;

    // Usamos el nombre del reporte si no viene uno en el comentario
    const autorNombre = nombre || ticket.nombre_reporta || 'Usuario Externo';
    const contenidoFinal = `[${autorNombre}]: ${contenido.trim()}`;

    return await prisma.ticket_comentarios.create({
      data: {
        id_ticket: ticket.id,
        id_usuario: null, // Es un comentario público
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
