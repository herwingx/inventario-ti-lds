/**
 * @module Services/Empleado
 * @description Lógica de negocio para la entidad 'Empleado' usando Prisma.
 */
const prisma = require('../config/prisma');

class EmpleadoService {
  static async findAll() {
    const raw = await prisma.empleados.findMany({
      include: {
        empresas: true,
        areas: true,
        sucursales: true,
        status: true,
        cuentas_email_corporativo: true
      }
    });

    return raw.map(e => ({
      ...e,
      nombre_empresa: e.empresas?.nombre,
      nombre_area: e.areas?.nombre,
      nombre_sucursal: e.sucursales?.nombre,
      status_nombre: e.status?.nombre_status,
      email_corporativo: e.cuentas_email_corporativo[0]?.email
    }));
  }

  static async findById(id) {
    const e = await prisma.empleados.findUnique({
      where: { id: parseInt(id) },
      include: {
        empresas: true,
        areas: true,
        sucursales: true,
        status: true,
        cuentas_email_corporativo: true
      }
    });

    if (!e) return null;

    return {
      ...e,
      nombre_empresa: e.empresas?.nombre,
      nombre_area: e.areas?.nombre,
      nombre_sucursal: e.sucursales?.nombre,
      status_nombre: e.status?.nombre_status,
      email_corporativo: e.cuentas_email_corporativo[0]?.email
    };
  }

  static async create(data) {
    const { asignar_id_correo, ...empleadoData } = data;

    // Convertir fechas string a Date object para Prisma
    if (empleadoData.fecha_nacimiento) empleadoData.fecha_nacimiento = new Date(empleadoData.fecha_nacimiento);
    if (empleadoData.fecha_ingreso) empleadoData.fecha_ingreso = new Date(empleadoData.fecha_ingreso);

    try {
      const newEmpleado = await prisma.empleados.create({
        data: empleadoData
      });

      if (asignar_id_correo) {
        await prisma.cuentas_email_corporativo.update({
          where: { id: asignar_id_correo },
          data: { id_empleado_asignado: newEmpleado.id }
        });
      }

      return newEmpleado;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: El número de empleado o datos únicos ya existen.');
      }
      throw error;
    }
  }

  static async update(id, data) {
    const { asignar_id_correo, ...empleadoData } = data;
    const empleadoId = parseInt(id);

    // Convertir fechas string a Date object para Prisma
    if (empleadoData.fecha_nacimiento) empleadoData.fecha_nacimiento = new Date(empleadoData.fecha_nacimiento);
    if (empleadoData.fecha_ingreso) empleadoData.fecha_ingreso = new Date(empleadoData.fecha_ingreso);

    try {
      if (Object.keys(empleadoData).length > 0) {
        await prisma.empleados.update({
          where: { id: empleadoId },
          data: empleadoData
        });
      }

      if (asignar_id_correo !== undefined) {
        // Desasignar anterior
        await prisma.cuentas_email_corporativo.updateMany({
          where: { id_empleado_asignado: empleadoId },
          data: { id_empleado_asignado: null }
        });

        // Asignar nuevo si existe
        if (asignar_id_correo) {
          await prisma.cuentas_email_corporativo.update({
            where: { id: asignar_id_correo },
            data: { id_empleado_asignado: empleadoId }
          });
        }
      }

      return true;
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') {
        throw new Error('DUPLICATE_ENTRY: Datos únicos duplicados en la actualización.');
      }
      throw error;
    }
  }

  static async delete(id) {
    const empleadoId = parseInt(id);
    try {
      return await prisma.empleados.delete({
        where: { id: empleadoId }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        // Fallback a Soft Delete
        const statusBaja = await prisma.status.findFirst({
          where: {
            nombre_status: { in: ['BAJA', 'ELIMINADO', 'INACTIVO', 'DADO DE BAJA'] }
          }
        });

        if (!statusBaja) {
          throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar el empleado y no existe estado de BAJA para inhabilitarlo.');
        }

        const softDelete = await prisma.empleados.update({
          where: { id: empleadoId },
          data: {
            id_status: statusBaja.id,
            fecha_actualizacion: new Date()
          }
        });

        return !!softDelete;
      }
      throw error;
    }
  }
}

module.exports = EmpleadoService;
