/**
 * @module Services/Profile
 * @description Lógica de negocio para el perfil del usuario autenticado usando Prisma.
 */
const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

class ProfileService {
  static ACTIVE_ASIGNACION_STATUS_ID = 1;

  static async getProfile(userId) {
    const u = await prisma.usuarios_sistema.findUnique({
      where: { id: parseInt(userId) },
      include: {
        empleados: {
          include: {
            cuentas_email_corporativo: {
              where: { id_status: 1 },
              select: {
                id: true,
                email: true
              },
              orderBy: { id: 'asc' },
              take: 1
            },
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
        },
        roles: true,
        status: true
      }
    });

    if (!u) return null;

    const { password_hash, reset_password_token, reset_password_expires, ...rest } = u;
    return {
      ...rest,
      email: u.email || '',
      nombres: u.nombres || '',
      apellidos: u.apellidos || '',
      nombre_empleado: u.empleados?.nombres,
      apellido_empleado: u.empleados?.apellidos,
      puesto: u.empleados?.puesto,
      email_corporativo: u.empleados?.cuentas_email_corporativo?.[0]?.email || u.email || '',
      id_equipo_asignado: u.empleados?.asignaciones?.[0]?.id_equipo || null,
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
