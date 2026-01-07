// src/controllers/direccionesIp.controller.js
// ! Controlador para la entidad Direcciones IP
// * Aquí gestiono todo lo relacionado con las direcciones IP del inventario: creación, consulta, actualización y eliminación.
// * Este módulo valida formato de IP, relaciones con sucursales y status, y asegura la integridad de los datos.

// * Importo la función query para ejecutar consultas a la base de datos
const { query } = require('../config/db');
// ===============================================================
// * Función de ayuda para validar formato de IPv4/IPv6 (simplificado)
// * Nota: Solo valida el formato, no garantiza que la IP sea asignable o ruteable.
function isValidIpAddress(ip) {
  // * Permito null o vacío si el campo no es obligatorio.
  if (!ip || typeof ip !== 'string') return false;
  ip = ip.trim();
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// * [GET] /api/direcciones-ip - Trae direcciones IP con filtros opcionales para supernetting /20
// * Query Params opcionales:
// *   - segmento: número 0-15 (tercer octeto de la IP 192.168.X.x)
// *   - status: ID del status (ej: 4=ASIGNADO, 5=DISPONIBLE)
// *   - disponibles: "true" para obtener solo IPs disponibles (status=5 y sin asignación activa)
const getAllDireccionesIp = async (req, res, next) => {
  try {
    // * Extraer parámetros de filtro del query string
    const { segmento, status, disponibles } = req.query;

    let sql = `
      SELECT
        di.id,
        di.direccion_ip,
        di.id_sucursal,
        s.nombre AS nombre_sucursal,
        s.id_empresa,
        em.nombre AS nombre_empresa,
        di.comentario,
        di.fecha_registro,
        di.fecha_actualizacion,
        di.id_status,
        st.nombre_status AS status_nombre,
        -- Campo calculado: segmento (tercer octeto) para facilitar filtrado en frontend
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(di.direccion_ip, '.', 3), '.', -1) AS UNSIGNED) AS segmento,
        -- Verificar si tiene asignación activa
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS asignacion_activa
      FROM direcciones_ip AS di
      LEFT JOIN sucursales AS s ON di.id_sucursal = s.id
      LEFT JOIN empresas AS em ON s.id_empresa = em.id
      JOIN status AS st ON di.id_status = st.id
      LEFT JOIN asignaciones AS a ON di.id = a.id_ip AND a.fecha_fin_asignacion IS NULL
    `;

    const params = [];
    const conditions = [];

    // * Filtro por segmento (tercer octeto de la IP)
    if (segmento !== undefined && segmento !== '' && segmento !== null) {
      const segmentoNum = parseInt(segmento, 10);
      if (!isNaN(segmentoNum) && segmentoNum >= 0 && segmentoNum <= 15) {
        conditions.push(`di.direccion_ip LIKE ?`);
        params.push(`192.168.${segmentoNum}.%`);
      }
    }

    // * Filtro por status específico
    if (status !== undefined && status !== '' && status !== null) {
      const statusNum = parseInt(status, 10);
      if (!isNaN(statusNum)) {
        conditions.push(`di.id_status = ?`);
        params.push(statusNum);
      }
    }

    // * Filtro para IPs disponibles (para selects en asignaciones)
    if (disponibles === 'true') {
      conditions.push(`di.id_status = 5`); // 5 = DISPONIBLE
      conditions.push(`a.id IS NULL`); // Sin asignación activa
    }

    // * Construir cláusula WHERE si hay condiciones
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    // * Ordenar por segmento y luego por último octeto para orden natural
    sql += ` ORDER BY segmento ASC, CAST(SUBSTRING_INDEX(di.direccion_ip, '.', -1) AS UNSIGNED) ASC`;

    const direcciones = await query(sql, params);
    res.status(200).json(direcciones);
  } catch (error) {
    console.error('Error al obtener direcciones IP:', error);
    next(error);
  }
};

// * [GET] /api/direcciones-ip/segmentos - Obtiene resumen de IPs por segmento para el dashboard
const getSegmentosResumen = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(di.direccion_ip, '.', 3), '.', -1) AS UNSIGNED) AS segmento,
        COUNT(*) AS total,
        SUM(CASE WHEN di.id_status = 5 AND a.id IS NULL THEN 1 ELSE 0 END) AS disponibles,
        SUM(CASE WHEN di.id_status = 4 OR a.id IS NOT NULL THEN 1 ELSE 0 END) AS asignadas,
        SUM(CASE WHEN di.id_status = 8 THEN 1 ELSE 0 END) AS reservadas,
        SUM(CASE WHEN di.id_status NOT IN (4, 5, 8) AND a.id IS NULL THEN 1 ELSE 0 END) AS otros
      FROM direcciones_ip AS di
      LEFT JOIN asignaciones AS a ON di.id = a.id_ip AND a.fecha_fin_asignacion IS NULL
      WHERE di.direccion_ip LIKE '192.168.%'
      GROUP BY segmento
      ORDER BY segmento ASC
    `;
    const segmentos = await query(sql);

    // * Agregar nombres descriptivos a cada segmento
    const nombresSegmentos = {
      0: 'INFRAESTRUCTURA Y TI',
      1: 'DIRECCIÓN GENERAL TMT',
      2: 'CONTABILIDAD TMT',
      3: 'OPERACIONES TMT',
      4: 'ALMACÉN TMT',
      5: 'MESA DE CONTROL TMT',
      6: 'RECURSOS HUMANOS TMT',
      7: 'COMERCIAL VENTAS/CADENAS',
      8: 'COMERCIAL TAE',
      9: 'COMERCIAL TARIFARIOS',
      10: 'COMERCIAL PUBLICIDAD',
      11: 'COMERCIAL PLATAFORMAS',
      12: 'ATENCIÓN Y DESARROLLO',
      13: 'INVITADOS Y MÓVILES',
      14: 'CORPORATIVO LIDIFON',
      15: 'RESERVADO EXPANSIÓN'
    };

    const segmentosConNombre = segmentos.map(seg => ({
      ...seg,
      nombre: nombresSegmentos[seg.segmento] || `SEGMENTO ${seg.segmento}`
    }));

    res.status(200).json(segmentosConNombre);
  } catch (error) {
    console.error('Error al obtener resumen de segmentos:', error);
    next(error);
  }
};

// * [GET] /api/direcciones-ip/:id - Trae una dirección IP específica por su ID (con relaciones)
const getDireccionIpById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        di.id,
        di.direccion_ip,
        di.id_sucursal,
        s.nombre AS nombre_sucursal,
        -- Añadimos la empresa aquí también si es necesario, siguiendo el patrón de getAllDireccionesIp
        s.id_empresa,
        em.nombre AS nombre_empresa,
        di.comentario,
        di.fecha_registro,
        di.fecha_actualizacion,
        di.id_status,
        st.nombre_status AS status_nombre,
        -- Verificar si tiene asignación activa
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS asignacion_activa
      FROM direcciones_ip AS di
      LEFT JOIN sucursales AS s ON di.id_sucursal = s.id
      -- Aseguramos que también aquí se use LEFT JOIN para empresas
      LEFT JOIN empresas AS em ON s.id_empresa = em.id
      JOIN status AS st ON di.id_status = st.id
      -- LEFT JOIN para verificar asignaciones activas
      LEFT JOIN asignaciones AS a ON di.id = a.id_ip AND a.fecha_fin_asignacion IS NULL
      WHERE di.id = ?
    `;
    const params = [id];
    const direcciones = await query(sql, params);
    if (direcciones.length === 0) {
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      res.status(200).json(direcciones[0]);
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al obtener dirección IP con ID ${req.params.id}:`, error);
    next(error);
  }
};

// * [POST] /api/direcciones-ip - Crea una nueva dirección IP con validaciones
const createDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo los datos del body. direccion_ip es obligatorio
    const { direccion_ip, id_sucursal, comentario, id_status } = req.body;
    // * Validaciones de campos obligatorios y formatos
    if (!direccion_ip) {
      return res.status(400).json({ message: 'El campo direccion_ip es obligatorio.' });
    }
    if (!isValidIpAddress(direccion_ip)) {
      return res.status(400).json({ message: `La dirección IP "${direccion_ip}" no tiene un formato válido.` });
    }
    // * Validar existencia de sucursal si se proporciona
    if (id_sucursal !== undefined && id_sucursal !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
      }
    }
    // * Validar existencia de status
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construyo la consulta SQL dinámicamente según los campos presentes
    let sql = 'INSERT INTO direcciones_ip (direccion_ip';
    const values = [direccion_ip];
    const placeholders = ['?'];
    if (id_sucursal !== undefined && id_sucursal !== null) { sql += ', id_sucursal'; placeholders.push('?'); values.push(id_sucursal); }
    if (comentario !== undefined && comentario !== null) { sql += ', comentario'; placeholders.push('?'); values.push(comentario); }
    if (id_status !== undefined && id_status !== null) { sql += ', id_status'; placeholders.push('?'); values.push(id_status); }
    sql += ') VALUES (' + placeholders.join(', ') + ')';
    const result = await query(sql, values);
    const newIpId = result.insertId;
    res.status(201).json({
      message: 'Dirección IP creada exitosamente',
      id: newIpId,
      direccion_ip: direccion_ip
    });
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error('Error al crear dirección IP:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `La dirección IP "${req.body.direccion_ip}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [PUT] /api/direcciones-ip/:id - Actualiza una dirección IP por su ID
const updateDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo el ID y los datos a actualizar
    const { id } = req.params;
    const { direccion_ip, id_sucursal, comentario, id_status } = req.body;
    // * Validar que al menos un campo sea enviado
    const updatesCount = Object.keys(req.body).length;
    if (updatesCount === 0) {
      return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
    }
    // * Validar formato de la dirección IP si se intenta actualizar
    if (direccion_ip !== undefined && direccion_ip !== null) {
      if (!isValidIpAddress(direccion_ip)) {
        return res.status(400).json({ message: `La dirección IP "${direccion_ip}" no tiene un formato válido.` });
      }
      if (direccion_ip === null || direccion_ip.trim() === '') {
        return res.status(400).json({ message: 'El campo direccion_ip no puede estar vacío.' });
      }
    }
    // * Validar existencia de sucursal si se intenta actualizar
    if (id_sucursal !== undefined && id_sucursal !== null) {
      const sucursalExists = await query('SELECT id FROM sucursales WHERE id = ?', [id_sucursal]);
      if (sucursalExists.length === 0) {
        return res.status(400).json({ message: `El ID de sucursal ${id_sucursal} no es válido.` });
      }
    }
    // * Validar existencia de status si se intenta actualizar
    if (id_status !== undefined && id_status !== null) {
      const statusExists = await query('SELECT id FROM status WHERE id = ?', [id_status]);
      if (statusExists.length === 0) {
        return res.status(400).json({ message: `El ID de status ${id_status} no es válido.` });
      }
    } else if (id_status === null) {
      return res.status(400).json({ message: 'El campo id_status no puede ser nulo.' });
    }
    // * Construyo la consulta UPDATE dinámicamente
    let sql = 'UPDATE direcciones_ip SET ';
    const params = [];
    const updates = [];
    if (direccion_ip !== undefined) { updates.push('direccion_ip = ?'); params.push(direccion_ip); }
    if (id_sucursal !== undefined) { updates.push('id_sucursal = ?'); params.push(id_sucursal); }
    if (comentario !== undefined) { updates.push('comentario = ?'); params.push(comentario); }
    if (id_status !== undefined) { updates.push('id_status = ?'); params.push(id_status); }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }
    sql += updates.join(', ');
    sql += ' WHERE id = ?';
    params.push(id);
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Dirección IP con ID ${id} actualizada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al actualizar dirección IP con ID ${req.params.id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        message: `La dirección IP "${req.body.direccion_ip}" ya existe.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * [DELETE] /api/direcciones-ip/:id - Elimina una dirección IP por su ID
const deleteDireccionIp = async (req, res, next) => {
  try {
    // * Extraigo el ID de la IP a eliminar
    const { id } = req.params;
    const sql = 'DELETE FROM direcciones_ip WHERE id = ?';
    const params = [id];
    const result = await query(sql, params);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: `Dirección IP con ID ${id} no encontrada.` });
    } else {
      res.status(200).json({ message: `Dirección IP con ID ${id} eliminada exitosamente.` });
    }
  } catch (error) {
    // ! Si hay error, lo paso al middleware global
    console.error(`Error al eliminar dirección IP con ID ${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        message: `No se puede eliminar la dirección IP con ID ${req.params.id} porque está siendo utilizada en asignaciones.`,
        error: error.message
      });
    } else {
      next(error);
    }
  }
};

// * Exporto todas las funciones del controlador para usarlas en las rutas
module.exports = {
  getAllDireccionesIp,
  getSegmentosResumen,
  getDireccionIpById,
  createDireccionIp,
  updateDireccionIp,
  deleteDireccionIp,
};
