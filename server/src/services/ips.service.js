/**
 * @module Services/Ip
 * @description Lógica de negocio para Direcciones IP usando Prisma.
 */
const prisma = require('../config/prisma');

class IpService {
  static async findAll(filters) {
    const { segmento, status, disponibles } = filters;

    let where = {};
    if (status) where.id_status = parseInt(status);
    if (disponibles === 'true') {
      where.id_status = 5;
      where.asignaciones = { none: { fecha_fin_asignacion: null } };
    }
    if (segmento) {
      where.direccion_ip = { startsWith: `192.168.${segmento}.` };
    }

    const raw = await prisma.direcciones_ip.findMany({
      where,
      include: {
        sucursales: { include: { empresas: true } },
        status: true,
        asignaciones: { where: { fecha_fin_asignacion: null } }
      }
    });

    return raw.map(di => ({
      ...di,
      nombre_sucursal: di.sucursales?.nombre,
      id_empresa: di.sucursales?.id_empresa,
      nombre_empresa: di.sucursales?.empresas?.nombre,
      status_nombre: di.status?.nombre_status,
      asignacion_activa: di.asignaciones.length > 0 ? 1 : 0
    }));
  }

  static async getResumenBySegmento() {
    // Nota: Prisma no soporta extraer partes de string en group by fácilmente sin raw query
    // pero podemos obtener todas las IPs y agruparlas en JS para mantener la lógica de nombres
    const ips = await prisma.direcciones_ip.findMany({
      where: { direccion_ip: { startsWith: '192.168.' } },
      include: { asignaciones: { where: { fecha_fin_asignacion: null } } }
    });

    const nombresSegmentos = {
      0: 'INFRAESTRUCTURA Y TI', 1: 'DIRECCIÓN GENERAL TMT', 2: 'CONTABILIDAD TMT',
      3: 'OPERACIONES TMT', 4: 'ALMACÉN TMT', 5: 'MESA DE CONTROL TMT',
      6: 'RECURSOS HUMANOS TMT', 7: 'COMERCIAL VENTAS/CADENAS', 8: 'COMERCIAL TAE',
      9: 'COMERCIAL TARIFARIOS', 10: 'COMERCIAL PUBLICIDAD', 11: 'COMERCIAL PLATAFORMAS',
      12: 'ATENCIÓN Y DESARROLLO', 13: 'INVITADOS Y MÓVILES', 14: 'CORPORATIVO LIDIFON',
      15: 'RESERVADO EXPANSIÓN'
    };

    const resumen = {};
    ips.forEach(ip => {
      const seg = parseInt(ip.direccion_ip.split('.')[2]);
      if (!resumen[seg]) {
        resumen[seg] = { segmento: seg, total: 0, disponibles: 0, asignadas: 0, reservadas: 0, otros: 0, nombre: nombresSegmentos[seg] || `SEGMENTO ${seg}` };
      }
      resumen[seg].total++;
      const hasAsignacion = ip.asignaciones.length > 0;
      if (ip.id_status === 5 && !hasAsignacion) resumen[seg].disponibles++;
      else if (ip.id_status === 4 || hasAsignacion) resumen[seg].asignadas++;
      else if (ip.id_status === 8) resumen[seg].reservadas++;
      else resumen[seg].otros++;
    });

    return Object.values(resumen);
  }

  static async findById(id) {
    const di = await prisma.direcciones_ip.findUnique({
      where: { id: parseInt(id) },
      include: {
        sucursales: { include: { empresas: true } },
        status: true,
        asignaciones: { where: { fecha_fin_asignacion: null } }
      }
    });
    if (!di) return null;
    return {
      ...di,
      nombre_sucursal: di.sucursales?.nombre,
      id_empresa: di.sucursales?.id_empresa,
      nombre_empresa: di.sucursales?.empresas?.nombre,
      status_nombre: di.status?.nombre_status,
      asignacion_activa: di.asignaciones.length > 0 ? 1 : 0
    };
  }

  static async create(data) {
    try {
      return await prisma.direcciones_ip.create({ data });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: La dirección IP ya existe.');
      throw error;
    }
  }

  static async update(id, data) {
    try {
      return await prisma.direcciones_ip.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') throw new Error('DUPLICATE_ENTRY: La dirección IP ya existe.');
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.direcciones_ip.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2003') {
        throw new Error('REFERENTIAL_INTEGRITY: No se puede eliminar la IP porque está en uso.');
      }
      throw error;
    }
  }
}

module.exports = IpService;
