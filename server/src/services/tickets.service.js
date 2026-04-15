/**
 * @module Services/Ticket
 * @description Lógica de negocio para Tickets usando Prisma.
 */
const prisma = require('../config/prisma');
const logger = require('../utils/logger'); // Importar logger

class TicketService {
  static USER_ROLE_ID = 2;
  static ANALYST_ROLE_ID = 3;
  static ADMIN_ROLE_ID = 1;
  static ACTIVE_ASIGNACION_STATUS_ID = 1;
  static FINAL_STATUSES = new Set(['RESUELTO', 'CERRADO']);

  static ALLOWED_STATUS_TRANSITIONS = {
    ABIERTO: new Set(['EN_PROGRESO', 'PENDIENTE', 'RESUELTO', 'CERRADO']),
    EN_PROGRESO: new Set(['ABIERTO', 'PENDIENTE', 'RESUELTO', 'CERRADO']),
    PENDIENTE: new Set(['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO']),
    RESUELTO: new Set(['ABIERTO', 'EN_PROGRESO', 'PENDIENTE', 'CERRADO']),
    CERRADO: new Set() // No transitions allowed FROM CERRADO - it's terminal for non-admin
  };

  /**
   * Valida si una transición de estado es permitida
   * 
   * REGLA CRÍTICA: Estado CERRADO es TERMINAL
   * - Un ticket CERRADO NO puede volver a ABIERTO automáticamente
   * - Solo ADMIN (roleId=1) puede hacer CERRADO → ABIERTO (reabrir)
   * - Todos los demás intentos de transicionar desde CERRADO serán rechazados
   * 
   * MATRIZ DE TRANSICIONES:
   * ABIERTO      → {EN_PROGRESO, PENDIENTE, RESUELTO, CERRADO}
   * EN_PROGRESO  → {ABIERTO, PENDIENTE, RESUELTO, CERRADO}
   * PENDIENTE    → {ABIERTO, EN_PROGRESO, RESUELTO, CERRADO}
   * RESUELTO     → {ABIERTO, EN_PROGRESO, PENDIENTE, CERRADO}
   * CERRADO      → {} (Terminal) ⚠️ EXCEPTO si ADMIN quiere reabrir
   * 
   * EJEMPLO:
   * - User cierra: EN_PROGRESO → CERRADO ✅
   * - User reabre: CERRADO → ABIERTO ❌
   * - ADMIN reabre: CERRADO → ABIERTO ✅
   */
  static validateStatusTransition(currentStatus, nextStatus, roleId = null) {
    if (!nextStatus || !currentStatus || nextStatus === currentStatus) {
      return;
    }

    // ✨ EXCEPCIÓN: Solo ADMIN puede reabrir tickets cerrados
    if (roleId === this.ADMIN_ROLE_ID && currentStatus === 'CERRADO' && nextStatus === 'ABIERTO') {
      return;
    }

    const allowed = this.ALLOWED_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.has(nextStatus)) {
      const error = new Error(`Transición de estatus no permitida: ${currentStatus} -> ${nextStatus}.`);
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }
  }

  /**
   * Vincula automáticamente el equipo asignado al usuario que reporta
   * 
   * LÓGICA:
   * Si el usuario que crea el ticket es un VIEWER (usuario externo):
   * 1. Busca su ASIGNACIÓN ACTIVA (fecha_fin = null, status = 1)
   * 2. Obtiene el equipo de esa asignación
   * 3. Lo vincula automáticamente al ticket
   * 
   * BENEFICIO:
   * - Usuario no tiene que seleccionar equipo manualmente
   * - Menos errores de mapeo
   * - Técnico recibe contexto completo del problema
   * 
   * CASOS:
   * ✅ Viewer con 1 equipo → Se vincula automáticamente
   * ❌ Viewer sin equipo → ticket.equipos = null
   * ❌ Viewer múltiples equipos → Usa el más reciente
   */
  static async resolveTicketEquipo(data, userId, roleId) {
    const explicitEquipo = data.id_equipo_relacionado ?? data.id_equipo ?? null;
    if (explicitEquipo) {
      return explicitEquipo;  // Si viene en el request, priorizar eso
    }

    // Para usuario final, usar automáticamente su equipo activo asignado cuando exista.
    if (!userId || roleId !== this.USER_ROLE_ID) {
      return null;
    }

    const user = await prisma.usuarios_sistema.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id_empleado: true,
        empleados: {
          select: {
            asignaciones: {
              where: {
                fecha_fin_asignacion: null,
                id_status_asignacion: this.ACTIVE_ASIGNACION_STATUS_ID
              },
              select: {
                id_equipo: true
              },
              orderBy: [
                { fecha_asignacion: 'desc' },
                { id: 'desc' }
              ],
              take: 1
            }
          }
        }
      }
    });

    return user?.empleados?.asignaciones?.[0]?.id_equipo || null;
  }

  static resolveCreatePriority(requestedPriority, roleId) {
    const priority = requestedPriority || 'MEDIA';

    // Usuario normal puede sugerir BAJA, MEDIA o ALTA. CRITICA queda reservada para soporte/admin.
    if (roleId === this.USER_ROLE_ID && priority === 'CRITICA') {
      const error = new Error('La prioridad CRITICA solo puede ser asignada por el equipo de soporte.');
      error.statusCode = 403;
      error.isOperational = true;
      throw error;
    }

    return priority;
  }

  static resolveTipoFalla(tipoFalla, categoria) {
    const rawTipo = String(tipoFalla || '').trim().toUpperCase();
    if (['HARDWARE', 'SOFTWARE', 'RED', 'IMPRESORA', 'OTRO'].includes(rawTipo)) {
      return rawTipo;
    }

    const source = String(categoria || '').toLowerCase();
    if (source.includes('impresora')) return 'IMPRESORA';
    if (source.includes('equipo') || source.includes('hardware') || source.includes('mantenimiento')) return 'HARDWARE';
    if (source.includes('red') || source.includes('internet')) return 'RED';
    if (source.includes('software') || source.includes('licencia') || source.includes('acceso') || source.includes('permiso')) return 'SOFTWARE';

    return 'OTRO';
  }

  static async findAll(filters, userId = null, roleId = null) {
    const { estatus, prioridad, tecnicoId, id_equipo } = filters;

    let where = {};
    if (roleId === this.USER_ROLE_ID && userId) {
      where.id_usuario_reporta = userId;
    }
    if (roleId === this.ANALYST_ROLE_ID && userId) {
      where.id_asignado_a = userId;
    }
    if (estatus) where.estatus = estatus;
    if (prioridad) where.prioridad = prioridad;
    if (tecnicoId) where.id_asignado_a = parseInt(tecnicoId);
    if (id_equipo) where.id_equipo = parseInt(id_equipo);

    const result = await prisma.tickets.findMany({
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
    logger.debug(`[TicketService:findAll] Tickets devueltos: ${JSON.stringify(result, null, 2)}`);
    return result;
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

    if (!ticket) {
      logger.debug(`[TicketService:findById] Ticket ID ${id} no encontrado.`);
      return null;
    }

    // Si hay equipo, cargar su asignacion activa con IP en una consulta separada
    // para mantener estable la consulta principal del ticket.
    if (ticket.equipos && ticket.equipos.id) {
      const asignacionesConIP = await prisma.asignaciones.findMany({
        where: {
          id_equipo: ticket.equipos.id,
          fecha_fin_asignacion: null,
          id_status_asignacion: 1
        },
        include: {
          direcciones_ip: true
        },
        orderBy: { fecha_asignacion: 'desc' },
        take: 1
      });
      
      ticket.equipos.asignaciones = asignacionesConIP;
    }

    // Obtener otros tickets del mismo equipo (Historial)
    const historialEquipo = ticket.id_equipo
      ? await prisma.tickets.findMany({
          where: {
            id_equipo: ticket.id_equipo,
            id: { not: ticket.id }
          },
          orderBy: { fecha_creacion: 'desc' },
          take: 5
        })
      : [];

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

    const result = {
      ...ticket,
      historial_equipo: historialEquipo
    };

    logger.debug(`[TicketService:findById] Datos del ticket ${id} devueltos: ${JSON.stringify(result, null, 2)}`);
    return result;
  }

  static async create(data, userId, roleId = null) {
    // Generar token_acceso si no viene (para tickets internos)
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4().replace(/-/g, '').substring(0, 16);
    const idEquipo = await this.resolveTicketEquipo(data, userId, roleId);
    const prioridad = this.resolveCreatePriority(data.prioridad, roleId);
    const tipoFalla = this.resolveTipoFalla(data.tipo_falla, data.categoria);

    return await prisma.tickets.create({
      data: {
        titulo: data.titulo,
        categoria: data.categoria,
        descripcion: data.descripcion,
        prioridad,
        tipo_falla: tipoFalla,
        id_equipo: idEquipo,
        id_usuario_reporta: userId,
        token_acceso: token,
        estatus: 'ABIERTO'
      }
    });
  }

  static async update(id, data, roleId = null) {
    const ticketId = parseInt(id);
    try {
      const oldTicket = await prisma.tickets.findUnique({
        where: { id: ticketId },
        include: { usuarios_sistema_tickets_id_asignado_aTousuarios_sistema: true }
      });
      if (!oldTicket) return null;

      let updateData = { ...data };
      const nextStatus = data.estatus;

      if (nextStatus) {
        this.validateStatusTransition(oldTicket.estatus, nextStatus, roleId);

        if (this.FINAL_STATUSES.has(nextStatus)) {
          if (!this.FINAL_STATUSES.has(oldTicket.estatus)) {
            updateData.fecha_cierre = new Date();
          } else {
            updateData.fecha_cierre = oldTicket.fecha_cierre || new Date();
          }
        } else if (this.FINAL_STATUSES.has(oldTicket.estatus)) {
          // Reapertura: limpiar fecha de cierre para reflejar estado activo nuevamente.
          updateData.fecha_cierre = null;
        }
      }

      updateData.fecha_actualizacion = new Date();

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
      // Técnico asignable = analista o admin activo (admin puede autoasignarse).
      where: {
        id_status: 1,
        id_rol: { in: [this.ANALYST_ROLE_ID, this.ADMIN_ROLE_ID] }
      },
      select: { id: true, username: true, email: true, id_rol: true }
    });

    return users.map(u => ({
      id: u.id,
      nombre_usuario: u.email ? u.email.split('@')[0] : u.username
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
    const ticket = await prisma.tickets.findUnique({ where: { id: parseInt(ticketId) } });
    if (!ticket || ['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
      throw new Error('No se pueden agregar comentarios a un ticket finalizado o cerrado');
    }

    return await prisma.$transaction(async (tx) => {
      const comment = await tx.ticket_comentarios.create({
        data: {
          id_ticket: parseInt(ticketId),
          id_usuario: userId,
          contenido: data.contenido,
          es_interno: data.es_interno || false
        }
      });

      await tx.tickets.update({
        where: { id: parseInt(ticketId) },
        data: { fecha_actualizacion: new Date() }
      });

      return comment;
    });
  }

  static async addAttachment(ticketId, userId, fileUrl, fileName) {
    const ticket = await prisma.tickets.findUnique({ where: { id: parseInt(ticketId) } });
    if (!ticket || ['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
      throw new Error('No se pueden agregar archivos a un ticket finalizado o cerrado');
    }

    // Detectar tipo de archivo para el mensaje
    const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const tipo = isImage ? 'IMAGEN' : 'ARCHIVO';

    // Guardamos la URL en el contenido con un formato especial Markdown-like
    // [ADJUNTO: TIPO | NOMBRE | URL]
    const content = `[ADJUNTO:${tipo}|${fileName}|${fileUrl}]`;

    return await prisma.$transaction(async (tx) => {
      const attachmentComment = await tx.ticket_comentarios.create({
        data: {
          id_ticket: parseInt(ticketId),
          id_usuario: userId,
          contenido: content,
          es_interno: false // Los adjuntos por defecto son visibles, o podríamos parametrizarlo
        }
      });

      await tx.tickets.update({
        where: { id: parseInt(ticketId) },
        data: { fecha_actualizacion: new Date() }
      });

      return attachmentComment;
    });
  }
}

module.exports = TicketService;
