/**
 * @module Services/Status
 * @description Lógica de negocio para Status usando Prisma.
 */
const prisma = require('../config/prisma');

class StatusService {
  static async findAll() {
    return await prisma.status.findMany();
  }

  static async findById(id) {
    return await prisma.status.findUnique({
      where: { id: parseInt(id) }
    });
  }

  static async create(data) {
    try {
      return await prisma.status.create({ data });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El nombre de status ya existe.');
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.status.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El nombre de status ya existe.');
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.status.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el status porque está siendo utilizado.');
      }
      throw error;
    }
  }
}

module.exports = StatusService;
