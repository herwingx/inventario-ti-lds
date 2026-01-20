/**
 * @module Middleware/Audit
 * @description Middleware de auditoría para registrar operaciones de escritura.
 * Intercepta POST, PUT, DELETE y guarda en logs_sistema.
 */
const { query } = require('../config/db');

/**
 * Mapeo de rutas API a nombres de tabla en BD.
 * @type {Object.<string, string>}
 */
const ROUTE_TO_TABLE = {
  '/api/equipos': 'equipos',
  '/api/empleados': 'empleados',
  '/api/asignaciones': 'asignaciones',
  '/api/mantenimientos': 'mantenimientos',
  '/api/direcciones-ip': 'direcciones_ip',
  '/api/sucursales': 'sucursales',
  '/api/areas': 'areas',
  '/api/empresas': 'empresas',
  '/api/notas': 'notas',
  '/api/tickets': 'tickets',
  '/api/cuentas-email': 'cuentas_email',
  '/api/usuarios-sistema': 'usuarios_sistema'
};

/**
 * Métodos HTTP que se auditan.
 * @type {string[]}
 */
const AUDITED_METHODS = ['POST', 'PUT', 'DELETE'];

/**
 * Extrae el nombre de la tabla a partir de la URL de la petición.
 * @param {string} originalUrl - URL original de la petición
 * @returns {string|null} Nombre de la tabla o null si no aplica
 */
const extractTableName = (originalUrl) => {
  // Quitar query params si existen
  const cleanUrl = originalUrl.split('?')[0];

  // Buscar coincidencia en el mapeo
  for (const [route, table] of Object.entries(ROUTE_TO_TABLE)) {
    if (cleanUrl.startsWith(route)) {
      return table;
    }
  }
  return null;
};

/**
 * Extrae el ID del registro de la URL (si existe).
 * @param {string} originalUrl - URL original de la petición
 * @returns {number|null} ID del registro o null
 */
const extractRecordId = (originalUrl) => {
  const cleanUrl = originalUrl.split('?')[0];
  const segments = cleanUrl.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Si el último segmento es un número, es el ID
  const id = parseInt(lastSegment, 10);
  return isNaN(id) ? null : id;
};

/**
 * Mapea método HTTP a acción de auditoría.
 * @param {string} method - Método HTTP
 * @returns {'CREATE'|'UPDATE'|'DELETE'}
 */
const mapHttpMethodToAction = (method) => {
  const mapping = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return mapping[method] || 'UPDATE';
};

/**
 * Obtiene valores anteriores del registro (para UPDATE/DELETE).
 * @param {string} tableName - Nombre de la tabla
 * @param {number} recordId - ID del registro
 * @returns {Promise<Object|null>}
 */
const getPreviousValues = async (tableName, recordId) => {
  if (!recordId) return null;

  try {
    const sql = `SELECT * FROM ?? WHERE id = ?`;
    const results = await query(sql, [tableName, recordId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('[AUDIT] Error al obtener valores anteriores:', error.message);
    return null;
  }
};

/**
 * Middleware de auditoría.
 * Registra operaciones POST/PUT/DELETE en la tabla logs_sistema.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const auditMiddleware = async (req, res, next) => {
  // Solo auditar métodos de escritura
  if (!AUDITED_METHODS.includes(req.method)) {
    return next();
  }

  const tableName = extractTableName(req.originalUrl);

  // Si la ruta no está en el mapeo, no auditar
  if (!tableName) {
    return next();
  }

  const recordId = extractRecordId(req.originalUrl);
  const action = mapHttpMethodToAction(req.method);
  const userId = req.user?.userId || null;

  // Para UPDATE/DELETE, obtener valores anteriores antes de que se modifiquen
  let previousValues = null;
  if (action !== 'CREATE' && recordId) {
    previousValues = await getPreviousValues(tableName, recordId);
  }

  // Guardar referencia al método original de res.json
  const originalJson = res.json.bind(res);

  // Interceptar res.json para capturar la respuesta
  res.json = async function (data) {
    // Solo registrar si la operación fue exitosa (status 2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        // Para CREATE, el ID viene en la respuesta
        let finalRecordId = recordId;
        if (action === 'CREATE' && data?.id) {
          finalRecordId = data.id;
        } else if (action === 'CREATE' && data?.insertId) {
          finalRecordId = data.insertId;
        }

        // Preparar valores nuevos (para CREATE/UPDATE)
        const newValues = action !== 'DELETE' ? req.body : null;

        // Insertar log de auditoría
        const logSql = `
          INSERT INTO logs_sistema 
          (id_usuario, accion, tabla_afectada, id_registro, valores_anteriores, valores_nuevos, ip_origen, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await query(logSql, [
          userId,
          action,
          tableName,
          finalRecordId || 0,
          previousValues ? JSON.stringify(previousValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          req.ip || req.connection?.remoteAddress || null,
          req.get('User-Agent') || null
        ]);

        console.log(`[AUDIT] ${action} en ${tableName} (ID: ${finalRecordId}) por usuario ${userId}`);
      } catch (error) {
        // No bloquear la respuesta por errores de auditoría
        console.error('[AUDIT] Error al registrar log:', error.message);
      }
    }

    // Llamar al método original
    return originalJson(data);
  };

  next();
};

module.exports = {
  auditMiddleware,
  extractTableName,
  extractRecordId
};
