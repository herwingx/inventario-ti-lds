/**
 * @module Controllers/QrPublic
 * @description Controlador para endpoints públicos de QR.
 * Maneja acceso sin autenticación para reporte de fallas y seguimiento de tickets.
 */
const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ===============================================================
// * Funciones públicas para flujo QR (sin autenticación JWT)
// ===============================================================

/**
 * Obtiene información de un equipo por su token QR.
 * Endpoint público para landing page de escaneo.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getEquipoByQrToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 8) {
      return res.status(400).json({ message: 'Token inválido.' });
    }

    const sql = `
      SELECT 
        e.id,
        e.marca,
        e.modelo,
        e.numero_serie,
        e.qr_token,
        te.nombre_tipo AS tipo_equipo,
        s.nombre_status AS estado,
        suc.nombre AS sucursal_nombre,
        emp.nombre AS empresa_nombre
      FROM equipos e
      LEFT JOIN tipos_equipo te ON e.id_tipo_equipo = te.id
      LEFT JOIN status s ON e.id_status = s.id
      LEFT JOIN sucursales suc ON e.id_sucursal_actual = suc.id
      LEFT JOIN empresas emp ON suc.id_empresa = emp.id
      WHERE e.qr_token = ?
    `;

    const [equipo] = await query(sql, [token]);

    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado o token inválido.' });
    }

    // Obtener tickets activos del equipo (para mostrar si ya hay reporte)
    // Tickets activos (abiertos, en progreso, pendientes)
    const ticketsActivosSql = `
      SELECT id, token_acceso, estatus, tipo_falla, fecha_creacion
      FROM tickets
      WHERE id_equipo = ? AND estatus NOT IN ('CERRADO', 'RESUELTO')
      ORDER BY fecha_creacion DESC
    `;

    // Historial de tickets (solo cerrados/resueltos)
    const ticketsHistorialSql = `
      SELECT id, token_acceso, estatus, tipo_falla, fecha_creacion, fecha_cierre
      FROM tickets
      WHERE id_equipo = ? AND estatus IN ('CERRADO', 'RESUELTO')
      ORDER BY fecha_cierre DESC
      LIMIT 20
    `;

    const ticketsActivos = await query(ticketsActivosSql, [equipo.id]);
    const ticketsHistorial = await query(ticketsHistorialSql, [equipo.id]);

    res.json({
      equipo: {
        id: equipo.id,
        marca: equipo.marca,
        modelo: equipo.modelo,
        numero_serie: equipo.numero_serie,
        tipo: equipo.tipo_equipo,
        estado: equipo.estado,
        sucursal: equipo.sucursal_nombre,
        empresa: equipo.empresa_nombre
      },
      tickets_activos: ticketsActivos,
      tickets_historial: ticketsHistorial
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea un ticket desde el flujo público (escaneo QR).
 * No requiere autenticación.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createPublicTicket = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { tipo_falla, descripcion, nombre_reporta, email_reporta } = req.body;

    // Validaciones
    if (!tipo_falla || !descripcion) {
      return res.status(400).json({
        message: 'Campos requeridos: tipo_falla, descripcion'
      });
    }

    // Verificar que el equipo existe y obtener sus datos
    const [equipo] = await query(
      'SELECT id, marca, modelo, numero_serie FROM equipos WHERE qr_token = ?',
      [token]
    );
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado.' });
    }

    // Generar token único para seguimiento del ticket
    const token_acceso = uuidv4().replace(/-/g, '').substring(0, 16);

    // Agregar info del reportante en la descripción si se proporciona
    let descripcionCompleta = descripcion;
    if (nombre_reporta || email_reporta) {
      descripcionCompleta += `\n\n---\nReportado por: ${nombre_reporta || 'Anónimo'}`;
      if (email_reporta) {
        descripcionCompleta += ` (${email_reporta})`;
      }
    }

    const sql = `
      INSERT INTO tickets 
      (id_equipo, id_usuario_reporta, token_acceso, tipo_falla, descripcion, prioridad, email_reporta, nombre_reporta)
      VALUES (?, NULL, ?, ?, ?, 'MEDIA', ?, ?)
    `;

    const result = await query(sql, [
      equipo.id,
      token_acceso,
      tipo_falla,
      descripcionCompleta,
      email_reporta || null,
      nombre_reporta || null
    ]);

    const ticketId = result.insertId;

    // Enviar notificación por email al equipo de soporte
    const { notifyNewTicket, notifyTicketCreated } = require('../services/ticketNotification.service');

    // Notificar al admin
    notifyNewTicket(
      { id: ticketId, token_acceso, tipo_falla, descripcion, prioridad: 'MEDIA' },
      equipo
    ).catch(err => console.error('[EMAIL] Error en notificación:', err));

    // Enviar confirmación al usuario (si dejó email)
    if (email_reporta) {
      notifyTicketCreated(
        { id: ticketId, token_acceso, tipo_falla },
        equipo,
        email_reporta,
        nombre_reporta
      ).catch(err => console.error('[EMAIL] Error en confirmación:', err));
    }

    res.status(201).json({
      success: true,
      ticket_id: ticketId,
      token_seguimiento: token_acceso,
      message: 'Tu reporte ha sido registrado exitosamente.',
      url_seguimiento: `/q/ticket/${token_acceso}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el estado de un ticket por su token de seguimiento.
 * Endpoint público.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getTicketStatus = async (req, res, next) => {
  try {
    const { ticketToken } = req.params;

    const sql = `
      SELECT 
        t.id,
        t.tipo_falla,
        t.descripcion,
        t.prioridad,
        t.estatus,
        t.fecha_creacion,
        t.fecha_actualizacion,
        t.fecha_cierre,
        e.marca AS equipo_marca,
        e.modelo AS equipo_modelo,
        u.username AS tecnico_asignado
      FROM tickets t
      LEFT JOIN equipos e ON t.id_equipo = e.id
      LEFT JOIN usuarios_sistema u ON t.id_asignado_a = u.id
      WHERE t.token_acceso = ?
    `;

    const [ticket] = await query(sql, [ticketToken]);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    // Obtener comentarios públicos (no internos)
    const comentariosSql = `
      SELECT 
        tc.contenido,
        tc.fecha_creacion,
        COALESCE(u.username, 'Usuario') AS autor
      FROM ticket_comentarios tc
      LEFT JOIN usuarios_sistema u ON tc.id_usuario = u.id
      WHERE tc.id_ticket = ? AND tc.es_interno = 0
      ORDER BY tc.fecha_creacion ASC
    `;

    const comentarios = await query(comentariosSql, [ticket.id]);

    res.json({
      ticket: {
        id: ticket.id,
        tipo_falla: ticket.tipo_falla,
        descripcion: ticket.descripcion,
        prioridad: ticket.prioridad,
        estatus: ticket.estatus,
        tecnico: ticket.tecnico_asignado,
        equipo: `${ticket.equipo_marca} ${ticket.equipo_modelo}`,
        fecha_creacion: ticket.fecha_creacion,
        fecha_actualizacion: ticket.fecha_actualizacion,
        fecha_cierre: ticket.fecha_cierre
      },
      comentarios,
      puede_comentar: ticket.estatus !== 'CERRADO'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Agrega un comentario público a un ticket.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const addPublicComment = async (req, res, next) => {
  try {
    const { ticketToken } = req.params;
    const { contenido, nombre } = req.body;

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ message: 'El comentario es requerido.' });
    }

    // Verificar que el ticket existe y no está cerrado, obtener nombre del reportante
    const [ticket] = await query(
      'SELECT id, estatus, token_acceso, nombre_reporta FROM tickets WHERE token_acceso = ?',
      [ticketToken]
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    if (ticket.estatus === 'CERRADO') {
      return res.status(400).json({ message: 'No se pueden agregar comentarios a tickets cerrados.' });
    }

    // Usar el nombre guardado del ticket si existe, o el proporcionado en el comentario
    const nombreUsuario = ticket.nombre_reporta || nombre || 'Usuario';
    const comentarioFinal = `[${nombreUsuario}]: ${contenido.trim()}`;

    const sql = `
      INSERT INTO ticket_comentarios (id_ticket, id_usuario, contenido, es_interno)
      VALUES (?, NULL, ?, 0)
    `;

    await query(sql, [ticket.id, comentarioFinal]);

    // Enviar notificación al admin
    const { notifyAdminComment } = require('../services/ticketNotification.service');
    notifyAdminComment(ticket, contenido.trim(), nombreUsuario)
      .catch(err => console.error('[EMAIL] Error en notificación:', err));

    res.status(201).json({
      success: true,
      message: 'Comentario agregado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sube evidencia a un ticket público.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const uploadTicketEvidence = async (req, res, next) => {
  try {
    const { ticketToken } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo.' });
    }

    // Verificar que el ticket existe
    const [ticket] = await query(
      'SELECT id, estatus FROM tickets WHERE token_acceso = ?',
      [ticketToken]
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    if (ticket.estatus === 'CERRADO') {
      return res.status(400).json({ message: 'No se puede subir evidencia a tickets cerrados.' });
    }

    // Construir URL del archivo
    const evidencia_url = `/uploads/tickets/${req.file.filename}`;

    // Actualizar el ticket con la evidencia
    await query(
      'UPDATE tickets SET evidencia_url = ? WHERE id = ?',
      [evidencia_url, ticket.id]
    );

    res.json({
      success: true,
      url: evidencia_url,
      message: 'Evidencia subida exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Genera un token QR para un equipo específico (uso interno).
 * 
 * @param {number} equipoId - ID del equipo
 * @returns {Promise<string>} Token generado
 */
const generateQrTokenForEquipo = async (equipoId) => {
  const token = uuidv4().replace(/-/g, '').substring(0, 16);

  await query(
    'UPDATE equipos SET qr_token = ? WHERE id = ?',
    [token, equipoId]
  );

  return token;
};

module.exports = {
  getEquipoByQrToken,
  createPublicTicket,
  getTicketStatus,
  addPublicComment,
  uploadTicketEvidence,
  generateQrTokenForEquipo
};
