/**
 * @module Controllers/Mantenimientos
 * @description Controlador para la gestión de mantenimientos proactivos (Fase 2B).
 * Reemplaza la versión anterior para soportar el nuevo esquema de BD.
 */
const { query } = require('../config/db');

/**
 * Obtiene la lista de mantenimientos con filtros.
 */
const getAllMantenimientos = async (req, res, next) => {
  try {
    const {
      tipo,
      estatus,
      fecha_inicio,
      fecha_fin,
      id_equipo,
      proximos
    } = req.query;

    let sql = `
      SELECT 
        m.id, 
        m.id_equipo, 
        m.tipo,
        m.titulo,
        m.descripcion,
        m.fecha_programada, 
        m.fecha_fin as fecha_realizada, 
        m.costo, 
        m.estatus,
        m.created_at,
        e.nombre_equipo, e.numero_serie, e.marca, e.modelo,
        'Equipo' as tipo_equipo,
        u.username AS tecnico_asignado
      FROM mantenimientos m
      JOIN equipos e ON m.id_equipo = e.id
      LEFT JOIN usuarios_sistema u ON m.id_tecnico_asignado = u.id
      WHERE 1=1
    `;
    const params = [];

    if (tipo) {
      sql += ' AND m.tipo = ?';
      params.push(tipo);
    }

    if (estatus) {
      sql += ' AND m.estatus = ?';
      params.push(estatus);
    }

    if (id_equipo) {
      sql += ' AND m.id_equipo = ?';
      params.push(id_equipo);
    }

    if (proximos === 'true') {
      sql += ' AND m.estatus IN ("PENDIENTE", "EN_PROGRESO") AND m.fecha_programada <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)';
      sql += ' ORDER BY m.fecha_programada ASC';
    } else {
      if (fecha_inicio && fecha_fin) {
        sql += ' AND m.fecha_programada BETWEEN ? AND ?';
        params.push(fecha_inicio, fecha_fin);
      }
      sql += ' ORDER BY m.fecha_programada DESC';
    }

    const mantenimientos = await query(sql, params);
    res.json(mantenimientos);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el detalle de un mantenimiento con sus archivos.
 */
const getMantenimientoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [maintenance] = await query(`
      SELECT m.*, e.marca, e.modelo, e.numero_serie, e.tipo_equipo 
      FROM mantenimientos m
      JOIN equipos e ON m.id_equipo = e.id
      WHERE m.id = ?
    `, [id]);

    if (!maintenance) return res.status(404).json({ message: 'No encontrado' });

    // Intentar obtener archivos si la tabla existe (por si acaso no corrieron el migration completo)
    let archivos = [];
    try {
      archivos = await query('SELECT * FROM mantenimiento_archivos WHERE id_mantenimiento = ?', [id]);
    } catch (e) {
      console.warn('Tabla mantenimiento_archivos no encontrada o error', e.message);
    }

    res.json({ ...maintenance, archivos });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea un nuevo mantenimiento programado.
 */
const createMantenimiento = async (req, res, next) => {
  try {
    const {
      id_equipo,
      tipo,
      titulo,
      descripcion,
      fecha_programada,
      id_tecnico_asignado
    } = req.body;

    const id_creador = req.user ? req.user.userId : null;

    if (!id_equipo || !titulo || !fecha_programada) {
      return res.status(400).json({ message: 'Faltan campos obligatorios: id_equipo, titulo, fecha_programada' });
    }

    const sql = `
      INSERT INTO mantenimientos 
      (id_equipo, tipo, titulo, descripcion, fecha_programada, id_tecnico_asignado, id_creador, estatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')
    `;

    const result = await query(sql, [
      id_equipo,
      tipo || 'PREVENTIVO',
      titulo,
      descripcion,
      fecha_programada,
      id_tecnico_asignado,
      id_creador
    ]);

    // Intentar log de auditoría si el servicio existe
    try {
      const { logAction } = require('../services/audit.service');
      await logAction({
        tabla: 'mantenimientos',
        accion: 'CREATE',
        id_registro: result.insertId,
        valor_nuevo: req.body,
        id_usuario: id_creador,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (e) {
      // Ignorar error de auditoría si no está configurada
    }

    res.status(201).json({
      id: result.insertId,
      message: 'Mantenimiento programado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un mantenimiento.
 * Soporta actualización de estatus con lógica de completado.
 */
const updateMantenimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      estatus,
      notas_cierre,
      costo,
      fecha_realizada,
      titulo,
      descripcion,
      fecha_programada,
      id_tecnico_asignado
    } = req.body;

    // Obtener datos actuales
    const [current] = await query('SELECT * FROM mantenimientos WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ message: 'Mantenimiento no encontrado' });

    // Si solo actualizamos datos básicos
    if (!estatus || estatus === current.estatus) {
      let sql = 'UPDATE mantenimientos SET ';
      const params = [];
      const updates = [];

      if (titulo) { updates.push('titulo = ?'); params.push(titulo); }
      if (descripcion) { updates.push('descripcion = ?'); params.push(descripcion); }
      if (fecha_programada) { updates.push('fecha_programada = ?'); params.push(fecha_programada); }
      if (id_tecnico_asignado) { updates.push('id_tecnico_asignado = ?'); params.push(id_tecnico_asignado); }
      if (costo) { updates.push('costo = ?'); params.push(costo); }

      if (updates.length > 0) {
        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(id);
        await query(sql, params);
        return res.json({ message: 'Mantenimiento actualizado' });
      } else {
        return res.json({ message: 'Nada que actualizar' });
      }
    }

    // Lógica de cambio de estatus
    let sql = 'UPDATE mantenimientos SET estatus = ?';
    const params = [estatus];

    if (estatus === 'COMPLETADO' && current.estatus !== 'COMPLETADO') {
      sql += ', fecha_fin = ?, costo = ?';
      const fechaFin = fecha_realizada || new Date();
      params.push(fechaFin, costo || current.costo || 0);

      // Si es preventivo, actualizar fechas del equipo
      if (current.tipo === 'PREVENTIVO') {
        const [equipo] = await query('SELECT frecuencia_mantenimiento_meses FROM equipos WHERE id = ?', [current.id_equipo]);

        if (equipo && equipo.frecuencia_mantenimiento_meses) {
          // Calcular próxima fecha
          const nextDate = new Date(fechaFin);
          nextDate.setMonth(nextDate.getMonth() + equipo.frecuencia_mantenimiento_meses);

          // Formatear fecha para SQL YYYY-MM-DD
          const nextDateStr = nextDate.toISOString().split('T')[0];

          await query(
            'UPDATE equipos SET ultima_fecha_mantenimiento = ?, proxima_fecha_mantenimiento = ? WHERE id = ?',
            [fechaFin, nextDateStr, current.id_equipo]
          );
        } else {
          await query(
            'UPDATE equipos SET ultima_fecha_mantenimiento = ? WHERE id = ?',
            [fechaFin, current.id_equipo]
          );
        }
      }
    }

    if (notas_cierre) {
      sql += ', descripcion = CONCAT(descripcion, "\n\n[CIERRE]: ", ?)';
      params.push(notas_cierre);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await query(sql, params);

    res.json({ message: 'Estatus actualizado correctamente' });
  } catch (error) {
    next(error);
  }
};

const deleteMantenimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM mantenimientos WHERE id = ?', [id]);
    res.json({ message: 'Mantenimiento eliminado' });
  } catch (error) {
    next(error);
  }
};

// =============================================
// FASE 2B: GESTIÓN DE EVIDENCIAS
// =============================================

/**
 * Obtiene todas las evidencias de un mantenimiento.
 * @route GET /api/mantenimientos/:id/evidencias
 */
const getEvidencias = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el mantenimiento existe
    const [maintenance] = await query('SELECT id FROM mantenimientos WHERE id = ?', [id]);
    if (!maintenance) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    const evidencias = await query(`
      SELECT id, tipo, url_archivo, descripcion, nombre_original, mime_type, tamano_bytes, fecha_subida
      FROM mantenimiento_evidencias
      WHERE id_mantenimiento = ?
      ORDER BY fecha_subida DESC
    `, [id]);

    res.json(evidencias);
  } catch (error) {
    next(error);
  }
};

/**
 * Agrega una evidencia a un mantenimiento.
 * Requiere multer middleware para procesar el archivo.
 * @route POST /api/mantenimientos/:id/evidencias
 */
const addEvidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo, descripcion } = req.body;

    // Verificar que el mantenimiento existe
    const [maintenance] = await query('SELECT id, estatus FROM mantenimientos WHERE id = ?', [id]);
    if (!maintenance) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Construir URL relativa del archivo
    const urlArchivo = `/uploads/evidencias/${req.file.filename}`;

    const sql = `
      INSERT INTO mantenimiento_evidencias 
      (id_mantenimiento, url_archivo, tipo, descripcion, nombre_original, mime_type, tamano_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      id,
      urlArchivo,
      tipo || 'DIAGNOSTICO',
      descripcion || null,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    ]);

    res.status(201).json({
      id: result.insertId,
      url_archivo: urlArchivo,
      tipo: tipo || 'DIAGNOSTICO',
      message: 'Evidencia subida exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una evidencia específica.
 * También elimina el archivo físico del servidor.
 * @route DELETE /api/mantenimientos/:id/evidencias/:evidenciaId
 */
const deleteEvidencia = async (req, res, next) => {
  try {
    const { id, evidenciaId } = req.params;
    const path = require('path');
    const fs = require('fs').promises;

    // Obtener la evidencia para conocer la ruta del archivo
    const [evidencia] = await query(`
      SELECT id, url_archivo 
      FROM mantenimiento_evidencias 
      WHERE id = ? AND id_mantenimiento = ?
    `, [evidenciaId, id]);

    if (!evidencia) {
      return res.status(404).json({ message: 'Evidencia no encontrada' });
    }

    // Eliminar archivo físico
    try {
      const filePath = path.join(__dirname, '../..', evidencia.url_archivo);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn('[EVIDENCIAS] No se pudo eliminar archivo físico:', fileError.message);
      // Continuar aunque falle la eliminación del archivo
    }

    // Eliminar registro de BD
    await query('DELETE FROM mantenimiento_evidencias WHERE id = ?', [evidenciaId]);

    res.json({ message: 'Evidencia eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMantenimientos,
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
  // Evidencias
  getEvidencias,
  addEvidencia,
  deleteEvidencia
};