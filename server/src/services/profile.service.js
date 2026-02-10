/**
 * @module Services/Profile
 * @description Lógica de negocio para el perfil del usuario autenticado usando Prisma.
 */
const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

class ProfileService {
  static async getProfile(userId) {
    const u = await prisma.usuarios_sistema.findUnique({
      where: { id: parseInt(userId) },
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
      puesto: u.empleados?.puesto,
      nombre_rol: u.roles?.nombre_rol,
      status_nombre: u.status?.nombre_status
    };
  }

  static async updateProfile(userId, data) {
    const { email, currentPassword, newPassword } = data;
    const user = await prisma.usuarios_sistema.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return null;

    let updateData = {};
    if (email) updateData.email = email;

    if (newPassword) {
      if (!currentPassword) throw new Error('MISSING_PASSWORD: Se requiere la contraseña actual.');
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) throw new Error('INVALID_PASSWORD: La contraseña actual es incorrecta.');
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }

    try {
      await prisma.usuarios_sistema.update({
        where: { id: parseInt(userId) },
        data: updateData
      });
      return true;
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El email ya está en uso.');
      throw error;
    }
  }
}

module.exports = ProfileService;
