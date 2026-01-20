/**
 * @module Config/Cron
 * @description Configuración de tareas programadas con node-cron.
 * Incluye alertas de mantenimiento preventivo.
 */
const cron = require('node-cron');
const { query } = require('./db');
const nodemailer = require('nodemailer');

/**
 * Transporter de nodemailer (reutiliza configuración existente).
 * @type {nodemailer.Transporter}
 */
let transporter = null;

/**
 * Inicializa el transporter de email si no está configurado.
 */
const initTransporter = () => {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

/**
 * Envía alerta de mantenimiento próximo por email.
 * @param {Object[]} equipos - Lista de equipos con mantenimiento próximo
 */
const sendMaintenanceAlert = async (equipos) => {
  const mail = initTransporter();
  if (!mail || !process.env.ALERT_EMAIL) {
    console.log('[CRON] No hay configuración de email para alertas.');
    return;
  }

  const equiposList = equipos.map(e =>
    `- ${e.marca} ${e.modelo} (${e.numero_serie}) - Fecha: ${e.proxima_fecha_mant}`
  ).join('\n');

  try {
    await mail.sendMail({
      from: process.env.SMTP_FROM || 'soporte@empresa.com',
      to: process.env.ALERT_EMAIL,
      subject: `⚠️ Alerta: ${equipos.length} equipo(s) requieren mantenimiento próximamente`,
      text: `Los siguientes equipos tienen mantenimiento programado en los próximos 7 días:\n\n${equiposList}\n\nPor favor, coordina los servicios necesarios.`,
      html: `
        <h2>⚠️ Alerta de Mantenimiento Preventivo</h2>
        <p>Los siguientes equipos tienen mantenimiento programado en los próximos 7 días:</p>
        <ul>
          ${equipos.map(e => `<li><strong>${e.marca} ${e.modelo}</strong> (${e.numero_serie}) - Fecha programada: <em>${e.proxima_fecha_mant}</em></li>`).join('')}
        </ul>
        <p>Por favor, coordina los servicios necesarios.</p>
      `
    });
    console.log(`[CRON] Alerta de mantenimiento enviada para ${equipos.length} equipo(s).`);
  } catch (error) {
    console.error('[CRON] Error al enviar alerta de mantenimiento:', error.message);
  }
};

/**
 * Tarea: Verificar equipos con mantenimiento próximo (en 7 días).
 * Se ejecuta diariamente a las 8:00 AM.
 */
const checkMaintenanceAlerts = async () => {
  console.log('[CRON] Verificando alertas de mantenimiento...');

  try {
    // Verificar si la columna existe antes de ejecutar
    const [columnCheck] = await query(`
      SELECT COUNT(*) as existe 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'equipos' 
        AND COLUMN_NAME = 'proxima_fecha_mant'
    `);

    if (!columnCheck || columnCheck.existe === 0) {
      console.log('[CRON] La columna proxima_fecha_mant no existe aún. Saltando verificación.');
      return;
    }

    const sql = `
      SELECT id, marca, modelo, numero_serie, proxima_fecha_mant
      FROM equipos
      WHERE proxima_fecha_mant IS NOT NULL
        AND proxima_fecha_mant BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND id_status != 2
      ORDER BY proxima_fecha_mant ASC
    `;

    const equipos = await query(sql);

    if (equipos.length > 0) {
      console.log(`[CRON] Encontrados ${equipos.length} equipo(s) con mantenimiento próximo.`);
      await sendMaintenanceAlert(equipos);
    } else {
      console.log('[CRON] No hay equipos con mantenimiento próximo en los siguientes 7 días.');
    }
  } catch (error) {
    console.error('[CRON] Error al verificar mantenimientos:', error.message);
  }
};

/**
 * Inicializa todos los cron jobs del sistema.
 */
const initCronJobs = () => {
  console.log('⏰ Inicializando tareas programadas (Cron Jobs)...');

  // * Alerta de mantenimiento: Diariamente a las 8:00 AM
  cron.schedule('0 8 * * *', checkMaintenanceAlerts, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });

  console.log('   ✅ Alerta de mantenimiento: Diario a las 8:00 AM');

  // ? Opcional: Ejecutar verificación inicial al arrancar (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('   📋 Ejecutando verificación inicial de mantenimientos...');
    checkMaintenanceAlerts();
  }
};

module.exports = {
  initCronJobs,
  checkMaintenanceAlerts // Exportar para testing manual
};
