/**
 * @module Services/Email
 * @description Lógica de negocio para Cuentas Email corporativas usando Prisma.
 */
const prisma = require('../config/prisma');

class EmailService {
  static async findAll() {
    const raw = await prisma.cuentas_email_corporativo.findMany({
      include: {
        empleados: {
          include: {
            sucursales: {
              include: { empresas: true }
            }
          }
        },
        status: true
      }
    });

    return raw.map(e => ({
      ...e,
      nombre_sucursal: e.empleados?.sucursales?.nombre,
      id_empresa: e.empleados?.sucursales?.id_empresa,
      nombre_empresa: e.empleados?.sucursales?.empresas?.nombre,
      nombre_empleado: e.empleados ? `${e.empleados.nombres} ${e.empleados.apellidos}` : null,
      status_nombre: e.status?.nombre_status
    }));
  }

  static async findById(id) {
    const e = await prisma.cuentas_email_corporativo.findUnique({
      where: { id: parseInt(id) },
      include: {
        empleados: {
          include: {
            sucursales: {
              include: { empresas: true }
            }
          }
        },
        status: true
      }
    });
    if (!e) return null;
    return {
      ...e,
      nombre_sucursal: e.empleados?.sucursales?.nombre,
      id_empresa: e.empleados?.sucursales?.id_empresa,
      nombre_empresa: e.empleados?.sucursales?.empresas?.nombre,
      nombre_empleado: e.empleados ? `${e.empleados.nombres} ${e.empleados.apellidos}` : null,
      status_nombre: e.status?.nombre_status
    };
  }

  static async create(data) {
    try {
      return await prisma.cuentas_email_corporativo.create({ data });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: La cuenta de correo ya existe.');
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.cuentas_email_corporativo.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: La cuenta de correo ya existe.');
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.cuentas_email_corporativo.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = EmailService;
