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

  /**
   * Autentica un usuario.
   * @param {string} username 
   * @param {string} password 
   */
  static async login(username, password) {
    // 1. Buscar usuario con Prisma (incluyendo rol)
    const user = await prisma.usuarios_sistema.findUnique({
      where: {
        username: username,
      },
      include: {
        roles: true // JOIN automático con la tabla roles
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
      // sucursalId: user.id_sucursal // Prisma no trajo id_sucursal porque no está en el modelo usuarios_sistema según el schema.prisma
      // Ah, espera, usuarios_sistema tiene id_empleado que tiene id_sucursal.
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
        roleId: user.id_rol,
        roleName: user.roles ? user.roles.nombre_rol : 'UNKNOWN'
      }
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
