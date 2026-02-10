/**
 * @module Middleware/Audit
 * @description Middleware de auditoría para registrar operaciones de escritura usando Prisma.
 * Intercepta POST, PUT, DELETE y guarda en logs_sistema.
 */
const prisma = require('../config/prisma');

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

const AUDITED_METHODS = ['POST', 'PUT', 'DELETE'];

const extractTableName = (originalUrl) => {
  const cleanUrl = originalUrl.split('?')[0];
  for (const [route, table] of Object.entries(ROUTE_TO_TABLE)) {
    if (cleanUrl.startsWith(route)) return table;
  }
  return null;
};

const extractRecordId = (originalUrl) => {
  const cleanUrl = originalUrl.split('?')[0];
  const segments = cleanUrl.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const id = parseInt(lastSegment, 10);
  return isNaN(id) ? null : id;
};

const mapHttpMethodToAction = (method) => {
  const mapping = { 'POST': 'CREATE', 'PUT': 'UPDATE', 'DELETE': 'DELETE' };
  return mapping[method] || 'UPDATE';
};

const getPreviousValues = async (tableName, recordId) => {
  if (!recordId) return null;
  try {
    // Prisma no soporta nombres de tabla dinámicos fácilmente sin raw query
    // pero para auditoría genérica podemos usar queryRaw o un switch si las tablas son pocas.
    // Usaremos queryRaw para mantener la flexibilidad del middleware original.
    const result = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName} WHERE id = ?`, recordId);
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  } catch (error) {
    return null;
  }
};

const auditMiddleware = async (req, res, next) => {
  if (!AUDITED_METHODS.includes(req.method)) return next();

  const tableName = extractTableName(req.originalUrl);
  if (!tableName) return next();

  const recordId = extractRecordId(req.originalUrl);
  const action = mapHttpMethodToAction(req.method);
  const userId = req.user?.userId || null;

  let previousValues = null;
  if (action !== 'CREATE' && recordId) {
    previousValues = await getPreviousValues(tableName, recordId);
  }

  const originalJson = res.json.bind(res);

  res.json = async function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        let finalRecordId = recordId;
        if (action === 'CREATE' && data?.id) finalRecordId = data.id;

        const newValues = action !== 'DELETE' ? req.body : null;

        await prisma.logs_sistema.create({
          data: {
            id_usuario: userId,
            accion: action,
            tabla_afectada: tableName,
            id_registro: finalRecordId || 0,
            valores_anteriores: previousValues ? JSON.stringify(previousValues) : null,
            valores_nuevos: newValues ? JSON.stringify(newValues) : null,
            ip_origen: req.ip || req.connection?.remoteAddress || null,
            user_agent: req.get('User-Agent') || null
          }
        });
      } catch (error) {
        // Log error silent to not break response
      }
    }
    return originalJson(data);
  };

  next();
};

module.exports = {
  auditMiddleware,
  extractTableName,
  extractRecordId
};
