// src/controllers/status.controller.js
// ! Controlador para la entidad Status
// * Aquí gestiono todo lo relacionado con los estados del sistema: creación, consulta, actualización y eliminación.
// * Este módulo valida duplicados y asegura la integridad referencial.

const { query } = require('../config/db'); // * Utilizo la función personalizada para consultas a la base de datos.

// ===============================================================
// * Funciones controladoras para cada endpoint de status
// ===============================================================

/**
 * Obtiene el listado de todos los status configurados en el sistema.
 *
 * @param {import('express').Request} req - Objeto de solicitud Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función middleware next.
 * @returns {Promise<void>}
 */
const getAllStatuses = async (req, res, next) => {
  try {
    // * Consulta SQL para traer todos los estados
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion, fecha_actualizacion FROM status';
    const statuses = await query(sql);
    res.status(200).json(statuses);
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al obtener todos los estados:', error);
    next(error);
  }
};

/**
 * Busca un status específico por su ID.
 *
 * @param {import('express').Request} req - Objeto de solicitud Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función middleware next.
 * @returns {Promise<void>}
 */
const getStatusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT id, nombre_status, descripcion, fecha_creacion, fecha_actualizacion FROM status WHERE id = ?';
    const params = [id];
    const statuses = await query(sql, params);
    if (statuses.length === 0) {
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json(statuses[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener estado con ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Registra un nuevo status en el sistema.
 *
 * @param {import('express').Request} req - Objeto de solicitud Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función middleware next.
 * @returns {Promise<void>}
 */
const createStatus = async (req, res, next) => {
  try {
    const { nombre_status, descripcion } = req.body;
    if (!nombre_status) {
      return res.status(400).json({ message: 'El campo nombre_status es obligatorio.' });
    }
    const sql = 'INSERT INTO status (nombre_status, descripcion) VALUES (?, ?)';
    const params = [nombre_status, descripcion];
    const result = await query(sql, params);
    const newStatusId = result.insertId;
    res.status(201).json({
      message: 'Estado creado exitosamente',
      id: newStatusId,
      nombre_status: nombre_status
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear estado:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El estado con nombre "${req.body.nombre_status}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

/**
 * Actualiza la información de un status existente.
 *
 * @param {import('express').Request} req - Objeto de solicitud Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función middleware next.
 * @returns {Promise<void>}
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_status, descripcion } = req.body;
    if (nombre_status === undefined && descripcion === undefined) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos nombre_status o descripcion para actualizar.' });
    }
    let sql = 'UPDATE status SET ';
    const params = [];
    const updates = [];
    if (nombre_status !== undefined) { updates.push('nombre_status = ?'); params.push(nombre_status); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); params.push(descripcion); }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Estado con ID ${id} actualizado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar estado con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `El nombre de estado "${req.body.nombre_status}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

/**
 * Elimina un status del sistema.
 * Valida integridad referencial.
 *
 * @param {import('express').Request} req - Objeto de solicitud Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función middleware next.
 * @returns {Promise<void>}
 */
const deleteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM status WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Estado con ID ${id} no encontrado.` });
    } else {
      res.status(200).json({ message: `Estado con ID ${id} eliminado exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar estado con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar el estado con ID ${req.params.id} porque está siendo utilizado por otros registros (ej. empresas, sucursales, etc.).`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
};