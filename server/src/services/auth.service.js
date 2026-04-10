/**
 * @module Services/Auth
 * @description Lógica de negocio para autenticación usando Prisma ORM.
 */
const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

class AuthService {
  static ACTIVE_STATUS_ID = 1;
  static ACTIVE_ASIGNACION_STATUS_ID = 1;

  static normalizeText(value) {
    return String(value || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '')
      .toLowerCase();
  }

  static async generateUniqueUsername(baseUsername) {
    const cleanBase = this.normalizeText(baseUsername) || 'usuario';
    let candidate = cleanBase;
    let suffix = 1;

    while (await prisma.usuarios_sistema.findUnique({ where: { username: candidate }, select: { id: true } })) {
      suffix += 1;
      candidate = `${cleanBase}${suffix}`;
    }

    return candidate;
  }

  static generateTemporaryPassword() {
    return crypto.randomBytes(6).toString('base64url').slice(0, 10);
  }

  static async resolveDefaultRoleId() {
    const role = await prisma.roles.findFirst({
      where: {
        nombre_rol: {
          in: ['VIEWER', 'Usuario Normal', 'Usuario', 'USER']
        }
      },
      select: { id: true }
    });

    return role?.id || 2;
  }

  /**
   * Autentica un usuario.
   * @param {string} username 
   * @param {string} password 
   */
  static async login(identifier, password) {
    const cleanIdentifier = String(identifier || '').trim();
    const normalizedIdentifier = cleanIdentifier.toLowerCase();

    // 1. Buscar usuario con Prisma (incluyendo rol)
    const user = await prisma.usuarios_sistema.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
          { email: normalizedIdentifier }
        ]
      },
      include: {
        roles: true,
        empleados: {
          select: {
            id_sucursal: true,
            nombres: true,
            apellidos: true,
            email_personal: true,
            asignaciones: {
              where: {
                fecha_fin_asignacion: null,
                id_status_asignacion: this.ACTIVE_ASIGNACION_STATUS_ID
              },
              select: {
                id_equipo: true
              },
              orderBy: [
                { fecha_asignacion: 'desc' },
                { id: 'desc' }
              ],
              take: 1
            }
          }
        }
      }
    });

    // Si no existe o está inactivo (id_status != 1)
    if (!user || user.id_status !== 1) return null;

    // 2. Comparar password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return null;

    // 3. Generar token
    const payload = {
      userId: user.id,
      username: user.username,
      roleId: user.id_rol,
      sucursalId: user.empleados?.id_sucursal || null
    };

    // Si necesitas sucursal, podrías hacer un include profundo: include: { empleados: true }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '24h' // Corregido: JWT_EXPIRE según .env
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nombres: user.nombres || user.empleados?.nombres || '',
        apellidos: user.apellidos || user.empleados?.apellidos || '',
        email: user.email || user.empleados?.email_personal || '',
        roleId: user.id_rol,
        roleName: user.roles ? user.roles.nombre_rol : 'UNKNOWN',
        idEmpleado: user.id_empleado || null,
        idEquipoAsignado: user.empleados?.asignaciones?.[0]?.id_equipo || null
      }
    };
  }

  static async signup({ email }) {
    const cleanEmail = String(email || '').trim().toLowerCase();

    const existingUser = await prisma.usuarios_sistema.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanEmail }
        ]
      },
      select: { id: true }
    });

    if (existingUser) {
      const error = new Error('El correo ya tiene una cuenta vinculada.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    const cuentaCorporativa = await prisma.cuentas_email_corporativo.findFirst({
      where: {
        email: cleanEmail,
        id_status: this.ACTIVE_STATUS_ID
      },
      include: {
        empleados: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            id_status: true
          }
        }
      }
    });

    if (!cuentaCorporativa || !cuentaCorporativa.empleados) {
      const error = new Error('Solo puedes registrarte con un correo corporativo activo y vinculado a un empleado.');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    if (cuentaCorporativa.empleados.id_status !== this.ACTIVE_STATUS_ID) {
      const error = new Error('El empleado vinculado a este correo está inactivo. Contacta a soporte.');
      error.statusCode = 403;
      error.isOperational = true;
      throw error;
    }

    const empleado = cuentaCorporativa.empleados;

    const existingEmployeeLink = await prisma.usuarios_sistema.findFirst({
      where: {
        id_empleado: empleado.id
      },
      select: {
        id: true
      }
    });

    if (existingEmployeeLink) {
      const error = new Error('Este empleado ya tiene una cuenta de acceso vinculada.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    const roleId = await this.resolveDefaultRoleId();
    const tempPassword = this.generateTemporaryPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);
    const cleanNombres = String(empleado.nombres || '').trim();
    const cleanApellidos = String(empleado.apellidos || '').trim();
    const usernameBase = cleanEmail.split('@')[0] || `${cleanNombres}.${cleanApellidos}`;
    const username = await this.generateUniqueUsername(usernameBase);

    const createdUser = await prisma.usuarios_sistema.create({
      data: {
        username,
        email: cleanEmail,
        nombres: cleanNombres,
        apellidos: cleanApellidos,
        password_hash,
        id_rol: roleId,
        id_status: 1,
        id_empleado: empleado.id
      },
      include: {
        roles: true,
        empleados: true
      }
    });

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin: 0 0 16px;">Acceso al sistema de TI</h2>
        <p>Hola ${cleanNombres} ${cleanApellidos},</p>
        <p>Tu cuenta fue creada correctamente. Usa estas credenciales para ingresar:</p>
        <ul>
          <li><strong>Usuario:</strong> ${username}</li>
          <li><strong>Correo:</strong> ${cleanEmail}</li>
          <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
        </ul>
        <p>Después de iniciar sesión, conserva esta información en un lugar seguro.</p>
      </div>
    `;

    let emailDelivered = false;
    let emailErrorMessage = null;

    try {
      await sendEmail({
        to: cleanEmail,
        subject: 'Tus credenciales de acceso al sistema',
        html
      });
      emailDelivered = true;
    } catch (error) {
      emailErrorMessage = error?.message || 'No fue posible enviar el correo de acceso.';
      console.error('No se pudo enviar el correo de registro:', emailErrorMessage);
    }

    return {
      id: createdUser.id,
      username: createdUser.username,
      nombres: createdUser.nombres,
      apellidos: createdUser.apellidos,
      email: createdUser.email,
      roleId: createdUser.id_rol,
      roleName: createdUser.roles?.nombre_rol || 'UNKNOWN',
      idEmpleado: createdUser.id_empleado || null,
      emailDelivered,
      warning: emailDelivered ? null : 'La cuenta se creó, pero no se pudo enviar el correo. Guarda esta contraseña temporal para iniciar sesión.',
      tempPassword: emailDelivered ? null : tempPassword,
      emailErrorMessage
    };
  }

  static async forgotPassword(email) {
    const user = await prisma.usuarios_sistema.findUnique({
      where: { email: email }
    });

    if (!user) return true;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.usuarios_sistema.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetToken,
        reset_password_expires: expires
      }
    });

    const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`; // APP_URL según .env
    const message = `
          <h1>Recuperación de Contraseña</h1>
          <p>Has solicitado restablecer tu contraseña.</p>
          <a href="${resetUrl}">${resetUrl}</a>
      `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Solicitud de Restablecimiento de Contraseña',
        html: message
      });
    } catch (error) {
      console.error('Error enviando email:', error);
    }

    return true;
  }

  static async resetPassword(token, newPassword) {
    // Prisma no permite buscar por campos que no son únicos fácilmente con findFirst
    const user = await prisma.usuarios_sistema.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date() // Mayor que ahora
        }
      }
    });

    if (!user) return false;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.usuarios_sistema.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null
      }
    });

    return true;
  }
}

module.exports = AuthService;
