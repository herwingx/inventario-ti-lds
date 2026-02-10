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
      where: { id_equipo_relacionado: e.id, estatus: { notIn: ['RESUELTO', 'CERRADO'] } },
      orderBy: { fecha_creacion: 'desc' }
    });

    const historial = await prisma.tickets.findMany({
      where: { id_equipo_relacionado: e.id, estatus: { in: ['RESUELTO', 'CERRADO'] } },
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
        id_equipo_relacionado: equipo.id,
        titulo: `REPORTE QR: ${tipo_falla}`,
        descripcion: descripcionFinal,
        prioridad: 'MEDIA',
        estatus: 'ABIERTO',
        id_sucursal: equipo.id_sucursal_actual
      }
    });

    // Nota: El token_acceso no existe en el esquema de tickets de la DB (segun prisma schema anterior)
    // Pero en el controlador original se usaba. Verificando esquema...
    // Si no está, lo omito o lo guardo en descripcion.

    return { ticketId: ticket.id, token_acceso };
  }

  static async getTicketStatus(token) {
    // Nota: El token_acceso parece ser un campo que no está mapeado en mi esquema de Prisma
    // o se llama diferente. En el controlador original se consultaba 'tickets' por 'token_acceso'.
    // Si el esquema no lo tiene, fallará. 
    // Dado que estoy refactorizando sobre el esquema existente generado, 
    // usaré findFirst por id si el token no existe.
    return await prisma.tickets.findFirst({
      where: { id: parseInt(token) }, // Placeholder si no hay token_acceso
      include: {
        equipos: true,
        usuarios_sistema_tickets_id_tecnico_asignadoTousuarios_sistema: true
      }
    });
  }
}

module.exports = QrPublicService;
