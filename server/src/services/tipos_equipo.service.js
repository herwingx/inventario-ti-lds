/**
 * @module Services/TipoEquipo
 * @description Lógica de negocio para Tipos de Equipo usando Prisma.
 */
const prisma = require('../config/prisma');

class TipoEquipoService {
  static async findAll() {
    return await prisma.tipos_equipo.findMany();
  }

  static async findById(id) {
    return await prisma.tipos_equipo.findUnique({
      where: { id: parseInt(id) }
    });
  }

  static async create(data) {
    try {
      return await prisma.tipos_equipo.create({ data });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El nombre de tipo de equipo ya existe.');
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.tipos_equipo.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El nombre de tipo de equipo ya existe.');
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.tipos_equipo.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el tipo de equipo porque tiene equipos asociados.');
      }
      throw error;
    }
  }
}

module.exports = TipoEquipoService;
