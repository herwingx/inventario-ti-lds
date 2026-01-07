const { query } = require('../config/db');

// ===============================================================
// * Controlador para Documentación
// ===============================================================

// * [GET] /api/documentacion - Obtener todos los documentos
const getAllDocumentos = async (req, res, next) => {
  try {
    const sql = `
      SELECT
        d.id,
        d.titulo,
        d.descripcion,
        d.tipo_documento,
        d.url_archivo,
        d.fecha_subida,
        d.id_status,
        st.nombre_status AS status_nombre
      FROM documentacion AS d
      LEFT JOIN status AS st ON d.id_status = st.id
      ORDER BY d.fecha_subida DESC
    `;
    const documentos = await query(sql);
    res.status(200).json(documentos);
  } catch (error) {
    console.error('Error al obtener documentación:', error);
    next(error);
  }
};

// * [GET] /api/documentacion/:id
const getDocumentoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        d.id,
        d.titulo,
        d.descripcion,
        d.tipo_documento,
        d.url_archivo,
        d.fecha_subida,
        d.id_status,
        st.nombre_status AS status_nombre
      FROM documentacion AS d
      LEFT JOIN status AS st ON d.id_status = st.id
      WHERE d.id = ?
    `;
    const result = await query(sql, [id]);
    if (result.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json(result[0]);
  } catch (error) {
    console.error(`Error al obtener documento ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/documentacion
const createDocumento = async (req, res, next) => {
  try {
    const { titulo, descripcion, tipo_documento, url_archivo, id_status } = req.body;

    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio' });
    if (!url_archivo) return res.status(400).json({ message: 'La URL o ruta del archivo es obligatoria' });

    const sql = `
      INSERT INTO documentacion (titulo, descripcion, tipo_documento, url_archivo, fecha_subida, id_status)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    // Default status 1 (Activo) si viene nulo
    const statusFinal = id_status || 1;

    const result = await query(sql, [titulo, descripcion, tipo_documento, url_archivo, statusFinal]);

    res.status(201).json({
      message: 'Documento registrado correctamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear documento:', error);
    next(error);
  }
};

// * [PUT] /api/documentacion/:id
const updateDocumento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, tipo_documento, url_archivo, id_status } = req.body;

    const sql = `
      UPDATE documentacion
      SET titulo = ?, descripcion = ?, tipo_documento = ?, url_archivo = ?, id_status = ?
      WHERE id = ?
    `;
    const result = await query(sql, [titulo, descripcion, tipo_documento, url_archivo, id_status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json({ message: 'Documento actualizado correctamente' });
  } catch (error) {
    console.error(`Error al actualizar documento ${req.params.id}:`, error);
    next(error);
  }
};

// * [DELETE] /api/documentacion/:id
const deleteDocumento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM documentacion WHERE id = ?';
    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar documento ${req.params.id}:`, error);
    next(error);
  }
};

module.exports = {
  getAllDocumentos,
  getDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento
};
