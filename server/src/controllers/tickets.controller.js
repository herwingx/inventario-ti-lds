/**
 * @module Controllers/Tickets
 * @description Controlador para gestión de tickets de soporte.
 * Maneja CRUD de tickets, comentarios y cambios de estado.
 */
const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ===============================================================
// * Funciones controladoras para tickets de soporte
// ===============================================================

/**
 * Obtiene todos los tickets con información relacionada.
 * Soporta filtros por estatus y prioridad.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAllTickets = async (req, res, next) => {
  try {
    const { estatus, prioridad, id_equipo } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.id_equipo,
        t.token_acceso,
        t.tipo_falla,
        t.descripcion,
        t.prioridad,
        t.estatus,
        t.evidencia_url,
        t.fecha_creacion,
        t.fecha_actualizacion,
        t.fecha_cierre,
        e.marca AS equipo_marca,
        e.modelo AS equipo_modelo,
        e.numero_serie AS equipo_serie,
        u_reporta.username AS reportado_por,
        u_asignado.username AS asignado_a
      FROM tickets t
      LEFT JOIN equipos e ON t.id_equipo = e.id
      LEFT JOIN usuarios_sistema u_reporta ON t.id_usuario_reporta = u_reporta.id
      LEFT JOIN usuarios_sistema u_asignado ON t.id_asignado_a = u_asignado.id
      WHERE 1=1
    `;

    const params = [];

    if (estatus) {
      sql += ' AND t.estatus = ?';
      params.push(estatus);
    }

    if (prioridad) {
      sql += ' AND t.prioridad = ?';
      params.push(prioridad);
    }

    if (id_equipo) {
      sql += ' AND t.id_equipo = ?';
      params.push(id_equipo);
    }

    sql += ' ORDER BY t.fecha_creacion DESC';

    const tickets = await query(sql, params);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un ticket por su ID con comentarios.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener ticket
    const ticketSql = `
      SELECT 
        t.*,
        e.marca AS equipo_marca,
        e.modelo AS equipo_modelo,
        e.numero_serie AS equipo_serie,
        e.qr_token AS equipo_qr_token,
        u_reporta.username AS reportado_por,
        u_asignado.username AS asignado_a
      FROM tickets t
      LEFT JOIN equipos e ON t.id_equipo = e.id
      LEFT JOIN usuarios_sistema u_reporta ON t.id_usuario_reporta = u_reporta.id
      LEFT JOIN usuarios_sistema u_asignado ON t.id_asignado_a = u_asignado.id
      WHERE t.id = ?
    `;

    const [ticket] = await query(ticketSql, [id]);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    // Obtener comentarios
    const comentariosSql = `
      SELECT 
        tc.*,
        u.username AS autor
      FROM ticket_comentarios tc
      LEFT JOIN usuarios_sistema u ON tc.id_usuario = u.id
      WHERE tc.id_ticket = ?
      ORDER BY tc.fecha_creacion ASC
    `;

    const comentarios = await query(comentariosSql, [id]);

    res.json({ ...ticket, comentarios });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea un nuevo ticket de soporte.
 * Genera automáticamente un token de acceso único.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createTicket = async (req, res, next) => {
  try {
    const { id_equipo, tipo_falla, descripcion, prioridad, evidencia_url } = req.body;
    const id_usuario_reporta = req.user?.userId || null;

    // Validaciones
    if (!id_equipo || !tipo_falla || !descripcion) {
      return res.status(400).json({
        message: 'Campos requeridos: id_equipo, tipo_falla, descripcion'
      });
    }

    // Verificar que el equipo existe
    const [equipo] = await query('SELECT id FROM equipos WHERE id = ?', [id_equipo]);
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado.' });
    }

    // Generar token único para seguimiento
    const token_acceso = uuidv4().replace(/-/g, '').substring(0, 16);

    const sql = `
      INSERT INTO tickets 
      (id_equipo, id_usuario_reporta, token_acceso, tipo_falla, descripcion, prioridad, evidencia_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      id_equipo,
      id_usuario_reporta,
      token_acceso,
      tipo_falla,
      descripcion,
      prioridad || 'MEDIA',
      evidencia_url || null
    ]);

    res.status(201).json({
      id: result.insertId,
      token_acceso,
      message: 'Ticket creado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un ticket existente (estado, asignación, prioridad).
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estatus, prioridad, id_asignado_a, descripcion } = req.body;

    // Verificar que el ticket existe
    const [ticket] = await query('SELECT id, estatus FROM tickets WHERE id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    // Construir query dinámico
    const updates = [];
    const params = [];

    if (estatus) {
      updates.push('estatus = ?');
      params.push(estatus);

      // Si se cierra el ticket, registrar fecha
      if (estatus === 'CERRADO' && ticket.estatus !== 'CERRADO') {
        updates.push('fecha_cierre = NOW()');
      }
    }

    if (prioridad) {
      updates.push('prioridad = ?');
      params.push(prioridad);
    }

    if (id_asignado_a !== undefined) {
      updates.push('id_asignado_a = ?');
      params.push(id_asignado_a || null);
    }

    if (descripcion) {
      updates.push('descripcion = ?');
      params.push(descripcion);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar.' });
    }

    params.push(id);

    const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params);

    res.json({ message: 'Ticket actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un ticket (solo para admins).
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [ticket] = await query('SELECT id FROM tickets WHERE id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    await query('DELETE FROM tickets WHERE id = ?', [id]);

    res.json({ message: 'Ticket eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Agrega un comentario a un ticket.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenido, es_interno } = req.body;
    const id_usuario = req.user?.userId || null;

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ message: 'El contenido del comentario es requerido.' });
    }

    // Verificar que el ticket existe y obtener datos para notificación
    const [ticket] = await query(
      'SELECT id, token_acceso, email_reporta FROM tickets WHERE id = ?',
      [id]
    );
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }

    const sql = `
      INSERT INTO ticket_comentarios (id_ticket, id_usuario, contenido, es_interno)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [id, id_usuario, contenido.trim(), es_interno ? 1 : 0]);

    // Si el comentario NO es interno y hay email del reportante, enviar notificación
    if (!es_interno && ticket.email_reporta) {
      const { notifyUserComment } = require('../services/ticketNotification.service');
      notifyUserComment(ticket, contenido.trim(), ticket.email_reporta)
        .catch(err => console.error('[EMAIL] Error en notificación:', err));
    }

    res.status(201).json({
      id: result.insertId,
      message: 'Comentario agregado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene los comentarios de un ticket.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { incluir_internos } = req.query;

    let sql = `
      SELECT 
        tc.*,
        u.username AS autor
      FROM ticket_comentarios tc
      LEFT JOIN usuarios_sistema u ON tc.id_usuario = u.id
      WHERE tc.id_ticket = ?
    `;

    // Si no se solicitan internos, filtrarlos
    if (!incluir_internos) {
      sql += ' AND tc.es_interno = 0';
    }

    sql += ' ORDER BY tc.fecha_creacion ASC';

    const comentarios = await query(sql, [id]);
    res.json(comentarios);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene técnicos disponibles para asignación.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getTecnicos = async (req, res, next) => {
  try {
    // Obtener usuarios con rol de soporte o admin
    const sql = `
      SELECT u.id, u.username AS nombre_usuario, u.email, r.nombre_rol
      FROM usuarios_sistema u
      LEFT JOIN roles r ON u.id_rol = r.id
      WHERE u.id_status = 1 AND r.nombre_rol IN ('Administrador', 'Soporte')
      ORDER BY u.username
    `;

    const tecnicos = await query(sql);
    res.json(tecnicos);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  getComments,
  getTecnicos
};
