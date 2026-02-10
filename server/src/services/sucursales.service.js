/**
 * @module Services/Sucursal
 * @description Lógica de negocio para la entidad 'Sucursal' usando Prisma.
 */
const prisma = require('../config/prisma');

class SucursalService {
  static async findAll() {
    return await prisma.sucursales.findMany({
      include: {
        empresas: true,
        tipos_sucursal: true,
        status: true
      }
    });
  }

  static async findById(id) {
    return await prisma.sucursales.findUnique({
      where: { id: parseInt(id) },
      include: {
        empresas: true,
        tipos_sucursal: true,
        status: true
      }
    });
  }

  static async create(data) {
    try {
      return await prisma.sucursales.create({
        data: data
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: Ya existe una sucursal con ese nombre para esta empresa.');
      }
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.sucursales.update({
        where: { id: parseInt(id) },
        data: data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: Ya existe una sucursal con ese nombre para esta empresa.');
      }
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.sucursales.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar la sucursal porque tiene áreas o empleados asociados.');
      }
      throw error;
    }
  }
}

module.exports = SucursalService;
