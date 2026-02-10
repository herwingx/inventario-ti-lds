/**
 * @module Services/TipoSucursal
 * @description Lógica de negocio para Tipos de Sucursal usando Prisma.
 */
const prisma = require('../config/prisma');

class TipoSucursalService {
  static async findAll() {
    return await prisma.tipos_sucursal.findMany();
  }

  static async findById(id) {
    return await prisma.tipos_sucursal.findUnique({
      where: { id: parseInt(id) }
    });
  }

  static async create(data) {
    try {
      return await prisma.tipos_sucursal.create({ data });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El tipo de sucursal ya existe.');
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.tipos_sucursal.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: El tipo de sucursal ya existe.');
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.tipos_sucursal.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el tipo de sucursal porque tiene sucursales asociadas.');
      }
      throw error;
    }
  }
}

module.exports = TipoSucursalService;
