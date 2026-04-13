/**
 * @module Services/Usuario
 * @description Lógica de negocio para Usuarios del Sistema usando Prisma.
 */
const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

class UsuarioService {
  static generateTemporaryPassword() {
    return crypto.randomBytes(6).toString('base64url').slice(0, 10);
  }

  static async findAll() {
    const raw = await prisma.usuarios_sistema.findMany({
      include: {
        empleados: true,
        roles: true,
        status: true
      }
    });

    return raw.map(u => {
      const { password_hash, ...rest } = u;
      return {
        ...rest,
        nombre_empleado: u.empleados?.nombres,
        apellido_empleado: u.empleados?.apellidos,
        nombre_rol: u.roles?.nombre_rol,
        status_nombre: u.status?.nombre_status
      };
    });
  }

  static async findById(id) {
    const u = await prisma.usuarios_sistema.findUnique({
      where: { id: parseInt(id) },
      include: {
        empleados: true,
        roles: true,
        status: true
      }
    });

    if (!u) return null;

    const { password_hash, ...rest } = u;
    return {
      ...rest,
      nombre_empleado: u.empleados?.nombres,
      apellido_empleado: u.empleados?.apellidos,
      nombre_rol: u.roles?.nombre_rol,
      status_nombre: u.status?.nombre_status
    };
  }

  static async create(data) {
    const { password, ...userData } = data;
    const cleanPassword = typeof password === 'string' ? password.trim() : '';
    const passwordWasGenerated = !cleanPassword;
    const tempPassword = passwordWasGenerated ? this.generateTemporaryPassword() : cleanPassword;
    const password_hash = await bcrypt.hash(tempPassword, 10);

    try {
      const newUser = await prisma.usuarios_sistema.create({
        data: {
          ...userData,
          password_hash
        },
        include: {
          roles: true
        }
      });

      const cleanEmail = String(newUser.email || '').trim().toLowerCase();
      let emailDelivered = false;
      let emailErrorMessage = null;

      if (cleanEmail) {
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
            <h2 style="margin: 0 0 16px;">Acceso al sistema de TI</h2>
            <p>Hola ${newUser.username},</p>
            <p>Tu cuenta fue creada correctamente. Usa estas credenciales para ingresar:</p>
            <ul>
              <li><strong>Usuario:</strong> ${newUser.username}</li>
              <li><strong>Correo:</strong> ${cleanEmail}</li>
              <li><strong>Rol:</strong> ${newUser.roles?.nombre_rol || 'SIN_ROL'}</li>
              <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
            </ul>
            <p>Por seguridad, cambia tu contraseña al iniciar sesión.</p>
          </div>
        `;

        try {
          await sendEmail({
            to: cleanEmail,
            subject: 'Tus credenciales de acceso al sistema',
            html
          });
          emailDelivered = true;
        } catch (error) {
          emailErrorMessage = error?.message || 'No fue posible enviar el correo de acceso.';
          console.error('No se pudo enviar el correo de alta de usuario:', emailErrorMessage);
        }
      }

      const { password_hash: _, ...rest } = newUser;
      return {
        ...rest,
        emailDelivered,
        emailErrorMessage,
        tempPassword: emailDelivered ? null : tempPassword,
        passwordWasGenerated
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: El nombre de usuario o el empleado ya tienen una cuenta vinculada.');
      }
      throw error;
    }
  }

  static async update(id, data) {
    const { password, ...userData } = data;
    const userId = parseInt(id);

    if (password) {
      userData.password_hash = await bcrypt.hash(password, 10);
    }

    try {
      await prisma.usuarios_sistema.update({
        where: { id: userId },
        data: userData
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: Datos duplicados en la actualización.');
      }
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.usuarios_sistema.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el usuario porque ha creado registros asociados (logs, notas, tickets).');
      }
      throw error;
    }
  }
}

module.exports = UsuarioService;
