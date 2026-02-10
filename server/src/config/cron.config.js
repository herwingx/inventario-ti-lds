/**
 * @module Config/Cron
 * @description Configuración de tareas programadas con node-cron usando Prisma.
 * Incluye alertas de mantenimiento preventivo.
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
 * Transporter de nodemailer (reutiliza configuración existente de Fase 2).
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
const sendMaintenanceAlert = async (equipos) => {
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
            <p>Los siguientes equipos requieren mantenimiento preventivo en los próximos 7 días:</p>
            <ul style="padding-left: 20px;">
              ${equipos.map(e => `
                <li style="margin-bottom: 10px;">
                  <strong>${e.marca} ${e.modelo}</strong><br>
                  <span style="color: ${COLORS.textLight}; font-size: 13px;">S/N: ${e.numero_serie} | Fecha: ${e.proxima_fecha_mant?.toLocaleDateString()}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Sistema Inventario" <${process.env.EMAIL_FROM}>`,
      to: alertEmail,
      subject: `⚠️ Alerta: ${equipos.length} mantenimiento(s) próximos`,
      html: htmlContent
    });

    console.log(`[CRON] Alerta enviada para ${equipos.length} equipos.`);
  } catch (error) {
    console.error('[CRON] Error al enviar email:', error.message);
  }
};

/**
 * Tarea: Verificar equipos con mantenimiento próximo.
 */
const checkMaintenanceAlerts = async () => {
  console.log('[CRON] Verificando mantenimientos próximos...');

  try {
    const hoy = new Date();
    const proximaSemana = new Date();
    proximaSemana.setDate(hoy.getDate() + 7);

    const equipos = await prisma.equipos.findMany({
      where: {
        proxima_fecha_mant: {
          gte: hoy,
          lte: proximaSemana
        },
        id_status: { not: 2 } // No dados de baja
      },
      orderBy: { proxima_fecha_mant: 'asc' }
    });

    if (equipos.length > 0) {
      await sendMaintenanceAlert(equipos);
    } else {
      console.log('[CRON] Sin mantenimientos próximos.');
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
