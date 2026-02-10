/**
 * @module Services/Nota
 * @description Lógica de negocio para Notas usando Prisma.
 */
const prisma = require('../config/prisma');

class NotaService {
  static async findAll() {
    return await prisma.notas.findMany({
      include: {
        usuarios_sistema: { select: { id: true, username: true } },
        equipos: { select: { id: true, nombre_equipo: true } }
      },
      orderBy: { fecha_creacion: 'desc' }
    });
  }

  static async findById(id) {
    return await prisma.notas.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios_sistema: { select: { id: true, username: true } },
        equipos: true
      }
    });
  }

  static async findAllByEquipo(equipoId) {
    return await prisma.notas.findMany({
      where: { id_equipo: parseInt(equipoId) },
      include: {
        usuarios_sistema: { select: { id: true, username: true } }
      },
      orderBy: { fecha_creacion: 'desc' }
    });
  }

  static async create(data, userId) {
    return await prisma.notas.create({
      data: {
        ...data,
        id_usuario_creacion: userId
      }
    });
  }

  static async update(id, data) {
    try {
      return await prisma.notas.update({
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
      return await prisma.notas.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = NotaService;
