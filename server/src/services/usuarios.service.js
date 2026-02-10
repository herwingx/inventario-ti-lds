/**
 * @module Services/Usuario
 * @description Lógica de negocio para Usuarios del Sistema usando Prisma.
 */
const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

class UsuarioService {
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
    const password_hash = await bcrypt.hash(password, 10);

    try {
      const newUser = await prisma.usuarios_sistema.create({
        data: {
          ...userData,
          password_hash
        }
      });
      const { password_hash: _, ...rest } = newUser;
      return rest;
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
