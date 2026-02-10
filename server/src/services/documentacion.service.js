/**
 * @module Services/Documento
 * @description Lógica de negocio para Documentación usando Prisma.
 */
const prisma = require('../config/prisma');

class DocumentoService {
  static async findAll() {
    return await prisma.documentacion.findMany({
      include: { status: true },
      orderBy: { fecha_subida: 'desc' }
    });
  }

  static async findById(id) {
    return await prisma.documentacion.findUnique({
      where: { id: parseInt(id) },
      include: { status: true }
    });
  }

  static async create(data) {
    return await prisma.documentacion.create({
      data: {
        ...data,
        fecha_subida: new Date()
      }
    });
  }

  static async update(id, data) {
    try {
      return await prisma.documentacion.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.documentacion.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = DocumentoService;
