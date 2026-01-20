/**
 * @module Services/TicketNotification
 * @description Servicio de notificaciones por email para tickets.
 * Envía alertas cuando se crean tickets o hay nuevos comentarios.
 */
const nodemailer = require('nodemailer');

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
  console.log('[EMAIL] Configurando transporter con:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER
  });

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * URL base del frontend para construir links.
 */
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:5173/soporte';
};

/**
 * Header HTML común para todos los emails.
 */
const emailHeader = (title, subtitle) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background: ${COLORS.primary}; border-radius: 12px 12px 0 0;">
    <tr>
      <td style="padding: 30px 40px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">🖥️</div>
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">${title}</h1>
        ${subtitle ? `<p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">${subtitle}</p>` : ''}
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
      <td style="padding: 25px 40px; text-align: center; background: ${COLORS.background}; border-radius: 0 0 12px 12px; border-top: 1px solid ${COLORS.border};">
        <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">
          Este correo fue enviado automáticamente por el sistema de soporte.
        </p>
        <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px;">
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
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${COLORS.background};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: ${COLORS.cardBg}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
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
        <a href="${url}" style="display: inline-block; background: ${COLORS.primary}; color: white; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

/**
 * Envía notificación de nuevo ticket al equipo de soporte.
 */
const notifyNewTicket = async (ticket, equipo) => {
  const alertEmail = process.env.ALERT_EMAIL || process.env.EMAIL_FROM;
  if (!alertEmail) {
    console.log('[EMAIL] No hay email de alerta configurado');
    return;
  }

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
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${equipo.marca} ${equipo.modelo}</p>
              </td>
              <td width="50%" style="padding: 15px 0 15px 20px; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Número de Serie</p>
                <p style="margin: 0; color: ${COLORS.text}; font-family: monospace;">${equipo.numero_serie}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding: 15px 20px 15px 0; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Tipo de Falla</p>
                <p style="margin: 0;"><span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${ticket.tipo_falla}</span></p>
              </td>
              <td width="50%" style="padding: 15px 0 15px 20px; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Prioridad</p>
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${ticket.prioridad || 'MEDIA'}</p>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 25px;">
            <p style="margin: 0 0 10px 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Descripción del problema</p>
            <div style="background: ${COLORS.background}; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; white-space: pre-wrap;">${ticket.descripcion}</p>
            </div>
          </div>
          
          ${actionButton('Ver Ticket en Panel Admin', adminUrl)}
        </td>
      </tr>
      <tr><td>${emailFooter()}</td></tr>
    `;

    await transporter.sendMail({
      from: `"Soporte TI" <${process.env.EMAIL_FROM || 'soporte@empresa.com'}>`,
      to: alertEmail,
      subject: `🎫 Nuevo Ticket #${ticket.id}: ${ticket.tipo_falla} - ${equipo.marca} ${equipo.modelo}`,
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
    const trackingUrl = `${getFrontendUrl()}/q/ticket/${ticket.token_acceso}`;

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
      from: `"Soporte TI" <${process.env.EMAIL_FROM || 'soporte@empresa.com'}>`,
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
  const alertEmail = process.env.ALERT_EMAIL || process.env.EMAIL_FROM;
  if (!alertEmail) return;

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
      from: `"Soporte TI" <${process.env.EMAIL_FROM || 'soporte@empresa.com'}>`,
      to: alertEmail,
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

  try {
    const transporter = createTransporter();
    const trackingUrl = `${getFrontendUrl()}/q/ticket/${ticket.token_acceso}`;

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
                <p style="margin: 0; color: ${COLORS.text}; font-weight: 600;">${equipo.marca} ${equipo.modelo}</p>
              </td>
              <td width="50%" style="padding: 15px 0 15px 20px; border-bottom: 1px solid ${COLORS.border};">
                <p style="margin: 0 0 5px 0; color: ${COLORS.textLight}; font-size: 12px;">Tipo de Problema</p>
                <p style="margin: 0;"><span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${ticket.tipo_falla}</span></p>
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
      from: `"Soporte TI" <${process.env.EMAIL_FROM || 'soporte@empresa.com'}>`,
      to: emailUsuario,
      subject: `✅ Ticket #${ticket.id} Registrado - ${equipo.marca} ${equipo.modelo}`,
      html: emailWrapper(content)
    });

    console.log(`[EMAIL] Confirmación de ticket #${ticket.id} enviada a ${emailUsuario}`);
  } catch (error) {
    console.error('[EMAIL] Error:', error.message);
  }
};

module.exports = {
  notifyNewTicket,
  notifyUserComment,
  notifyAdminComment,
  notifyTicketCreated
};
