/**
 * @module Config/Cron
 * @description Configuración de tareas programadas con node-cron usando Prisma.
 * Incluye alertas de mantenimiento preventivo y correctivo programado.
 */
const cron = require('node-cron');
const prisma = require('./prisma');
const nodemailer = require('nodemailer');

const COLORS = {
  primary: '#13B497',
  background: '#f8fafa',
  cardBg: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e8e8e8'
};

/**
 * Transporter de nodemailer (reutiliza configuración existente).
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

/**
 * Envía alerta de mantenimiento próximo por email.
 */
const sendMaintenanceAlert = async (alertas) => {
  const alertEmail = process.env.ALERT_EMAIL || process.env.EMAIL_FROM;
  if (!alertEmail) {
    console.log('[CRON] No hay email configurado para alertas.');
    return;
  }

  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: sans-serif; background: ${COLORS.background}; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: ${COLORS.cardBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background: ${COLORS.primary}; padding: 30px; text-align: center; color: white;">
            <h2 style="margin: 0;">⚠️ Alerta de Mantenimiento</h2>
          </div>
          <div style="padding: 30px;">
            <p>Los siguientes equipos tienen mantenimientos pendientes o programados para los próximos 7 días:</p>
            <ul style="padding-left: 20px;">
              ${alertas.map(a => `
                <li style="margin-bottom: 15px; list-style: none; border-left: 4px solid ${COLORS.primary}; padding-left: 15px;">
                  <strong style="color: ${COLORS.text}; font-size: 16px;">${a.titulo || 'Mantenimiento Preventivo'}</strong><br>
                  <span style="color: ${COLORS.textLight}; font-size: 14px;">
                    <strong>Equipo:</strong> ${a.equipo_nombre} (S/N: ${a.numero_serie})<br>
                    <strong>Fecha:</strong> ${a.fecha_texto}<br>
                    <strong>Tipo:</strong> ${a.tipo_manto}
                  </span>
                </li>
              `).join('')}
            </ul>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.APP_URL}/mantenimientos" style="background: ${COLORS.primary}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver en el Sistema</a>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Eduardo Macías | Soporte" <${process.env.EMAIL_FROM}>`,
      to: alertEmail,
      subject: `⚠️ Alerta: ${alertas.length} mantenimiento(s) próximos`,
      html: htmlContent
    });

    console.log(`[CRON] Alerta enviada para ${alertas.length} eventos de mantenimiento.`);
  } catch (error) {
    console.error('[CRON] Error al enviar email:', error.message);
  }
};

/**
 * Tarea: Verificar equipos y eventos de mantenimiento próximo.
 */
const checkMaintenanceAlerts = async () => {
  console.log('[CRON] Verificando mantenimientos próximos...');

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximaSemana = new Date();
    proximaSemana.setDate(hoy.getDate() + 7);
    proximaSemana.setHours(23, 59, 59, 999);

    const alertas = [];

    // 1. Buscar en la tabla de Equipos (Mantenimientos Preventivos Automáticos)
    const equiposAuto = await prisma.equipos.findMany({
      where: {
        proxima_fecha_mantenimiento: { gte: hoy, lte: proximaSemana },
        id_status: { not: 2 }
      }
    });

    equiposAuto.forEach(e => {
      alertas.push({
        titulo: 'Mantenimiento Preventivo (Auto)',
        equipo_nombre: `${e.marca || ''} ${e.modelo || ''}`,
        numero_serie: e.numero_serie,
        fecha_texto: e.proxima_fecha_mantenimiento.toLocaleDateString('es-MX'),
        tipo_manto: 'PREVENTIVO'
      });
    });

    // 2. Buscar en la tabla de Mantenimientos (Eventos Programados Manuales)
    const mantenimientosManuales = await prisma.mantenimientos.findMany({
      where: {
        fecha_programada: { gte: hoy, lte: proximaSemana },
        estatus: 'PENDIENTE'
      },
      include: { equipos: true }
    });

    mantenimientosManuales.forEach(m => {
      // Evitar duplicados si el equipo ya está en la lista de auto (opcional, pero mejor ser redundante si son registros diferentes)
      alertas.push({
        titulo: m.titulo || 'Mantenimiento Programado',
        equipo_nombre: m.equipos ? `${m.equipos.marca || ''} ${m.equipos.modelo || ''}` : 'Equipo no especificado',
        numero_serie: m.equipos?.numero_serie || 'N/A',
        fecha_texto: m.fecha_programada.toLocaleDateString('es-MX'),
        tipo_manto: m.tipo || 'MANUAL'
      });
    });

    if (alertas.length > 0) {
      await sendMaintenanceAlert(alertas);
    } else {
      console.log('[CRON] Sin mantenimientos próximos detectados en Equipos ni Mantenimientos.');
    }
  } catch (error) {
    console.error('[CRON] Error en checkMaintenanceAlerts:', error.message);
  }
};

const initCronJobs = () => {
  console.log('⏰ Inicializando Cron Jobs...');

  // Diariamente a las 8:00 AM
  cron.schedule('0 8 * * *', checkMaintenanceAlerts, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });

  if (process.env.NODE_ENV === 'development') {
    checkMaintenanceAlerts();
  }
};

module.exports = {
  initCronJobs,
  checkMaintenanceAlerts
};
