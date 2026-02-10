/**
 * @module Services/Empresa
 * @description Lógica de negocio para la entidad 'Empresa' usando Prisma.
 */
const prisma = require('../config/prisma');

class EmpresaService {
  /**
   * Obtiene todas las empresas.
   */
  static async findAll() {
    return await prisma.empresas.findMany({
      include: {
        status: true
      }
    });
  }

  /**
   * Busca una empresa por ID.
   */
  static async findById(id) {
    return await prisma.empresas.findUnique({
      where: { id: parseInt(id) },
      include: {
        status: true
      }
    });
  }

  /**
   * Crea una nueva empresa.
   */
  static async create(data) {
    try {
      return await prisma.empresas.create({
        data: data
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: El nombre de la empresa ya existe.');
      }
      throw error;
    }
  }

  /**
   * Actualiza una empresa.
   */
  static async update(id, data) {
    try {
      return await prisma.empresas.update({
        where: { id: parseInt(id) },
        data: data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: El nombre de la empresa ya existe.');
      }
      throw error;
    }
  }

  /**
   * Elimina una empresa.
   */
  static async delete(id) {
    try {
      return await prisma.empresas.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar la empresa porque tiene sucursales o empleados asociados.');
      }
      throw error;
    }
  }
}

module.exports = EmpresaService;
