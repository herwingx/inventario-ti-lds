/**
 * @module Services/Rol
 * @description Lógica de negocio para Roles usando Prisma.
 */
const prisma = require('../config/prisma');

class RolService {
  static async findAll() {
    return await prisma.roles.findMany();
  }

  static async findById(id) {
    return await prisma.roles.findUnique({
      where: { id: parseInt(id) }
    });
  }

  static async create(data) {
    try {
      return await prisma.roles.create({ data });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El nombre de rol ya existe.');
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.roles.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El nombre de rol ya existe.');
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.roles.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el rol porque tiene usuarios asociados.');
      }
      throw error;
    }
  }
}

module.exports = RolService;
