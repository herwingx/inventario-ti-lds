/**
 * @module Services/TicketNotification
 * @description Servicio de notificaciones por email para tickets.
 * Envía alertas cuando se crean tickets o hay nuevos comentarios.
 */
const nodemailer = require('nodemailer');
const prisma = require('../config/prisma');

// Colores corporativos
const COLORS = {
  primary: '#13B497',
  primaryDark: '#0e8670',
  background: '#f8fafa',
  cardBg: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e8e8e8'
};

/**
 * Transporter de nodemailer configurado con variables de entorno.
 */
const createTransporter = () => {
  const secureByEnv = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true';
  const secureByPort = String(process.env.EMAIL_PORT || '') === '465';

  console.log('[EMAIL] Configurando transporter con:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    secure: secureByEnv || secureByPort
  });

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: secureByEnv || secureByPort,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const getFromAddress = () => {
  const configuredFrom = (process.env.EMAIL_FROM || '').trim();
  if (!configuredFrom) return '"Soporte TI" <soporte@empresa.com>';

  // Si ya viene con formato "Nombre <correo>", se reutiliza tal cual.
  if (configuredFrom.includes('<') && configuredFrom.includes('>')) return configuredFrom;

  return `"Soporte TI" <${configuredFrom}>`;
};

const getAlertEmail = () => {
  return (process.env.ALERT_EMAIL || process.env.EMAIL_USER || '').trim();
};

const isCommentNotificationEnabled = () => {
  return String(process.env.TICKETS_EMAIL_COMMENTS || 'false').trim().toLowerCase() === 'true';
};

const getAdminRecipients = async () => {
  const configuredAlert = getAlertEmail();
  const recipients = new Set();

  if (configuredAlert) recipients.add(configuredAlert.toLowerCase());

  try {
    const admins = await prisma.usuarios_sistema.findMany({
      where: {
        id_rol: 1,
        id_status: 1,
        email: { not: null }
      },
      select: { email: true }
    });

    admins
      .map(a => String(a.email || '').trim().toLowerCase())
      .filter(Boolean)
      .forEach(email => recipients.add(email));
  } catch (error) {
    console.error('[EMAIL] Error obteniendo correos admin:', error.message);
  }

  return Array.from(recipients);
};

/**
 * URL base del frontend para construir links.
 * Prioridad: FRONTEND_URL → APP_URL → API_URL derivado → localhost fallback
 */
const getFrontendUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) return frontendUrl.replace(/\/$/, '');
  
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, '');
  
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  const url = apiUrl.replace(/\/api\/?$/, '');
  return url.replace(/\/$/, '');
};

/**
 * Header HTML común para todos los emails.
 */
const emailHeader = (title, subtitle) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 18px 18px 0 0;">
    <tr>
      <td style="padding: 34px 40px 30px 40px; text-align: center;">
        <div style="width: 54px; height: 54px; border-radius: 999px; background: rgba(255,255,255,0.18); margin: 0 auto 14px auto; text-align: center; line-height: 54px; font-size: 28px;">🖥️</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.2px;">${title}</h1>
        ${subtitle ? `<p style="color: rgba(255,255,255,0.92); margin: 10px 0 0 0; font-size: 14px; line-height: 1.5;">${subtitle}</p>` : ''}
      </td>
    </tr>
  </table>
`;

/**
 * Footer HTML común para todos los emails.
 */
const emailFooter = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
    <tr>
      <td style="padding: 24px 40px 26px 40px; text-align: center; background: ${COLORS.background}; border-radius: 0 0 18px 18px; border-top: 1px solid ${COLORS.border};">
        <p style="margin: 0 0 6px 0; color: ${COLORS.textLight}; font-size: 12px; line-height: 1.5;">
          Este correo fue enviado automáticamente por el sistema de soporte.
        </p>
        <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; line-height: 1.5;">
          <strong>Inventario TI</strong> • Sistema de Gestión de Soporte Técnico
        </p>
      </td>
    </tr>
  </table>
`;

/**
 * Wrapper HTML para el email.
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at top, #eef8f6 0%, ${COLORS.background} 45%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; background: ${COLORS.cardBg}; border-radius: 18px; border: 1px solid ${COLORS.border}; box-shadow: 0 10px 28px rgba(16,31,55,0.12); overflow: hidden;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Botón de acción HTML.
 */
const actionButton = (text, url) => `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 25px 0;">
        <a href="${url}" style="display: inline-block; background: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 999px; font-weight: 700; font-size: 14px; letter-spacing: 0.2px; box-shadow: 0 6px 16px rgba(19,180,151,0.35);">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

const getFullName = (usuario = {}) => {
  if (usuario?.nombres && usuario?.apellidos) {
    return `${usuario.nombres} ${usuario.apellidos}`;
  }
  if (usuario?.empleados?.nombres && usuario?.empleados?.apellidos) {
    return `${usuario.empleados.nombres} ${usuario.empleados.apellidos}`;
  }
  const username = String(usuario?.username || '').trim();
  if (!username) return 'Usuario';

  return username
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const resolveTicketSummary = (ticket = {}, equipo = null) => {
  const equipoData = equipo || {};

  return {
    tipoFalla: ticket?.tipo_falla || ticket?.categoria || 'OTRO',
    prioridad: ticket?.prioridad || 'MEDIA',
    descripcion: ticket?.descripcion || 'Sin descripcion proporcionada.',
    marca: equipoData?.marca || 'N/A',
    modelo: equipoData?.modelo || 'N/A',
    numeroSerie: equipoData?.numero_serie || 'N/A'
  };
};

/**
 * Envía notificación de nuevo ticket al equipo de soporte.
 */
const notifyNewTicket = async (ticket, equipo) => {
  const recipients = await getAdminRecipients();
  if (recipients.length === 0) {
    console.log('[EMAIL] No hay destinatarios admin para notificar nuevo ticket');
    return;
  }

  const summary = resolveTicketSummary(ticket, equipo);

  try {
    const transporter = createTransporter();
    const adminUrl = `${getFrontendUrl()}/tickets/${ticket.id}`;

    const content = `
      ${emailHeader('Nuevo Ticket de Soporte', 'Se ha registrado un nuevo reporte desde el sistema')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Ticket</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 28px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
            <tr>
              <td width="50%" style="padding: 15px 20px 15px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Equipo</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${summary.marca} ${summary.modelo}</p>
              </td>
              <td width="50%" style="padding: 15px 0 15px 20px; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Número de Serie</p>
                <p style="margin: 0; color: ${COLORS.text}; font-family: monospace;">${summary.numeroSerie}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding: 15px 20px 15px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Tipo de Falla</p>
                <p style="margin: 0;"><span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${summary.tipoFalla}</span></p>
              </td>
              <td width="50%" style="padding: 15px 0 15px 20px; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Prioridad</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${summary.prioridad}</p>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 25px;">
            <p style="margin: 0 0 10px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Descripción del problema</p>
            <div style="background: ${COLORS.background}; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; white-space: pre-wrap;">${summary.descripcion}</p>
            </div>
          </div>
          
          ${actionButton('Ver Ticket en Panel Admin', adminUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: recipients,
      subject: `🎫 Nuevo Ticket #${ticket.id}: ${summary.tipoFalla} - ${summary.marca} ${summary.modelo}`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Notificación de nuevo ticket #${ticket.id} enviada`);
  } catch (error) {
    console.error('[EMAIL] Error:', error.message);
  }
};

/**
 * Envía notificación de respuesta al usuario.
 */
const notifyUserComment = async (ticket, comentario, emailUsuario) => {
  if (!emailUsuario) {
    console.log('[EMAIL] Sin email de usuario');
    return;
  }

  try {
    const transporter = createTransporter();
    const trackingUrl = `${getFrontendUrl()}/soporte/q/ticket/${ticket.token_acceso}`;

    const content = `
      ${emailHeader('Respuesta a tu Ticket', 'El equipo de soporte ha respondido a tu reporte')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Ticket de referencia</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 20px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 25px;">
            <p style="margin: 0 0 10px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Mensaje del equipo de soporte</p>
            <div style="background: #e8f5f1; padding: 20px; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
              <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; white-space: pre-wrap;">${comentario}</p>
            </div>
          </div>
          
          <p style="margin: 25px 0 0 0; color: ${COLORS.textLight}; font-size: 14px; text-align: center;">
            ¿Tienes más preguntas? Puedes responder directamente desde el enlace de seguimiento.
          </p>
          
          ${actionButton('Ver Conversación Completa', trackingUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: emailUsuario,
      subject: `💬 Respuesta a tu Ticket #${ticket.id}`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Notificación enviada a ${emailUsuario}`);
  } catch (error) {
    console.error('[EMAIL] Error:', error.message);
  }
};

/**
 * Envía notificación al admin cuando usuario comenta.
 */
const notifyAdminComment = async (ticket, comentario, nombreUsuario) => {
  const recipients = await getAdminRecipients();
  if (recipients.length === 0) return;

  try {
    const transporter = createTransporter();
    const adminUrl = `${getFrontendUrl()}/tickets/${ticket.id}`;

    const content = `
      ${emailHeader('Nueva Respuesta de Usuario', 'Un usuario ha respondido a un ticket abierto')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Ticket</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 20px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 25px;">
            <p style="margin: 0 0 10px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
              Mensaje de <strong style="color: ${COLORS.text};">${nombreUsuario || 'Usuario'}</strong>
            </p>
            <div style="background: #e8f5f1; padding: 20px; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
              <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; white-space: pre-wrap;">${comentario}</p>
            </div>
          </div>
          
          ${actionButton('Responder en Panel Admin', adminUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: recipients,
      subject: `💬 ${nombreUsuario || 'Usuario'} respondió en Ticket #${ticket.id}`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Notificación de comentario enviada`);
  } catch (error) {
    console.error('[EMAIL] Error:', error.message);
  }
};

/**
 * Envía confirmación de creación de ticket al usuario.
 */
const notifyTicketCreated = async (ticket, equipo, emailUsuario, nombreUsuario) => {
  if (!emailUsuario) {
    console.log('[EMAIL] Sin email de usuario para confirmación');
    return;
  }

  const summary = resolveTicketSummary(ticket, equipo);

  try {
    const transporter = createTransporter();
    const trackingUrl = `${getFrontendUrl()}/soporte/q/ticket/${ticket.token_acceso}`;

    const content = `
      ${emailHeader('Tu Reporte ha sido Registrado', 'Hemos recibido tu solicitud de soporte técnico')}
      <tr>
        <td style="padding: 35px 40px;">
          <p style="margin: 0 0 20px 0; color: ${COLORS.text}; font-size: 16px; line-height: 1.6;">
            Hola${nombreUsuario ? ` <strong>${nombreUsuario}</strong>` : ''},
          </p>
          <p style="margin: 0 0 25px 0; color: ${COLORS.text}; font-size: 15px; line-height: 1.6;">
            Tu reporte ha sido registrado exitosamente. Nuestro equipo de soporte técnico lo revisará y te responderá a la brevedad.
          </p>
          
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Número de Ticket</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 32px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
            <tr>
              <td width="50%" style="padding: 15px 20px 15px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Equipo Reportado</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${summary.marca} ${summary.modelo}</p>
              </td>
              <td width="50%" style="padding: 15px 0 15px 20px; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Tipo de Problema</p>
                <p style="margin: 0;"><span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${summary.tipoFalla}</span></p>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 30px; padding: 20px; background: #e8f5f1; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; color: ${COLORS.text}; font-size: 14px;">
              <strong>Guarda este enlace</strong> para dar seguimiento a tu ticket:
            </p>
            <p style="margin: 0; font-family: monospace; font-size: 12px; color: ${COLORS.primary}; word-break: break-all;">
              ${trackingUrl}
            </p>
          </div>
          
          ${actionButton('Ver Estado de mi Ticket', trackingUrl)}
          
          <p style="margin: 25px 0 0 0; color: ${COLORS.textLight}; font-size: 13px; text-align: center;">
            Te notificaremos por email cuando haya una respuesta de nuestro equipo.
          </p>
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: emailUsuario,
      subject: `✅ Ticket #${ticket.id} Registrado - ${summary.marca} ${summary.modelo}`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Confirmación de ticket #${ticket.id} enviada a ${emailUsuario}`);
  } catch (error) {
    console.error('[EMAIL] Error:', error.message);
  }
};

/**
 * Notifica al analista cuando se le asigna un ticket.
 */
const notifyAnalystAssignment = async (ticket, analyst, assignedBy = 'Administrador') => {
  const analystEmail = analyst?.email;
  if (!analystEmail) return;

  const summary = resolveTicketSummary(ticket);
  const analystFullName = getFullName(analyst);

  try {
    const transporter = createTransporter();
    const analystUrl = `${getFrontendUrl()}/tickets/${ticket.id}`;

    const content = `
      ${emailHeader('Nuevo Ticket Asignado', 'Tienes un ticket pendiente de atención')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Ticket asignado</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 24px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Asignado a</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${getFullName(analyst)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Asignado por</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${assignedBy}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Prioridad</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${summary.prioridad}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Tipo de falla</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${summary.tipoFalla}</p>
              </td>
            </tr>
          </table>

          <div style="margin-top: 20px; background: ${COLORS.background}; padding: 16px; border-radius: 8px;">
            <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; white-space: pre-wrap;">${summary.descripcion}</p>
          </div>

          ${actionButton('Abrir Ticket Asignado', analystUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: analystEmail,
      subject: `🆕 Ticket #${ticket.id} asignado para atención`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Notificación de asignación de ticket #${ticket.id} enviada a ${analystEmail} (${analystFullName})`);
  } catch (error) {
    console.error('[EMAIL] Error notif analista asignación:', error.message);
  }
};

/**
 * Notifica al solicitante cuando su ticket fue asignado a un responsable.
 */
const notifyUserTicketAssigned = async (ticket, emailUsuario, assignedToName = 'Soporte', changedBy = 'Soporte') => {
  if (!emailUsuario) return;

  try {
    const transporter = createTransporter();
    const trackingUrl = ticket?.token_acceso
      ? `${getFrontendUrl()}/soporte/q/ticket/${ticket.token_acceso}`
      : `${getFrontendUrl()}/tickets/${ticket.id}`;

    const content = `
      ${emailHeader('Ticket Asignado', 'Tu solicitud ya fue asignada a un responsable')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Ticket</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 24px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Asignado a</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 700;">${assignedToName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Asignado por</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${changedBy}</p>
              </td>
            </tr>
          </table>

          ${actionButton('Ver seguimiento del ticket', trackingUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: emailUsuario,
      subject: `📌 Ticket #${ticket.id} asignado a ${assignedToName}`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Notificación de asignación al solicitante enviada a ${emailUsuario} para ticket #${ticket.id}`);
  } catch (error) {
    console.error('[EMAIL] Error notif asignación solicitante:', error.message);
  }
};

/**
 * Notifica al analista asignado cuando el solicitante agrega comentario público.
 */
const notifyAnalystPublicComment = async (ticket, comentario, nombreUsuario, analyst) => {
  const analystEmail = analyst?.email;
  if (!analystEmail) return;

  try {
    const transporter = createTransporter();
    const analystUrl = `${getFrontendUrl()}/tickets/${ticket.id}`;

    const content = `
      ${emailHeader('Nueva Respuesta del Solicitante', 'El usuario respondió en un ticket bajo tu gestión')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Ticket</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 24px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <p style="margin: 0 0 10px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
              Comentario de ${nombreUsuario || 'Solicitante'}
            </p>
            <div style="background: #e8f5f1; padding: 20px; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
              <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; white-space: pre-wrap;">${comentario}</p>
            </div>
          </div>

          ${actionButton('Responder Ticket', analystUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: analystEmail,
      subject: `💬 Nuevo comentario en Ticket #${ticket.id}`,
      html: emailWrapper(content)
    });
  } catch (error) {
    console.error('[EMAIL] Error notif analista comentario:', error.message);
  }
};

/**
 * Notifica al solicitante cuando cambia el estatus del ticket.
 */
const notifyUserStatusChange = async (ticket, newStatus, emailUsuario, changedBy = 'Soporte') => {
  if (!emailUsuario) return;

  try {
    const transporter = createTransporter();
    const trackingUrl = ticket?.token_acceso
      ? `${getFrontendUrl()}/soporte/q/ticket/${ticket.token_acceso}`
      : `${getFrontendUrl()}/tickets/${ticket.id}`;

    const content = `
      ${emailHeader('Actualización de Ticket', 'Tu solicitud cambió de estatus')}
      <tr>
        <td style="padding: 35px 40px;">
          <table width="100%" style="background: ${COLORS.background}; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Ticket</p>
                <p style="margin: 0; color: ${COLORS.primary}; font-size: 24px; font-weight: bold;">#${ticket.id}</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Nuevo estatus</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 700;">${String(newStatus || '').replace(/_/g, ' ')}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: ${COLORS.textLight}; font-size: 12px;">Actualizado por</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${changedBy}</p>
              </td>
            </tr>
          </table>

          ${actionButton('Ver estado del ticket', trackingUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: emailUsuario,
      subject: `🔔 Ticket #${ticket.id} actualizado a ${newStatus}`,
      html: emailWrapper(content)
    });
  } catch (error) {
    console.error('[EMAIL] Error notif cambio estatus:', error.message);
  }
};

module.exports = {
  notifyNewTicket,
  notifyUserComment,
  notifyAdminComment,
  notifyTicketCreated,
  notifyAnalystAssignment,
  notifyAnalystPublicComment,
  notifyUserStatusChange,
  notifyUserTicketAssigned,
  isCommentNotificationEnabled
};
