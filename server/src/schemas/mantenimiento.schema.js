/**
 * @module Schemas/Mantenimiento
 * @description Esquemas de validación Zod para la entidad 'Mantenimiento'.
 */
const { z } = require('zod');

const maintenanceEstatus = z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO', 'VENCIDO']);
const maintenanceTipo = z.enum(['PREVENTIVO', 'CORRECTIVO', 'ACTUALIZACION']);

const createMantenimientoSchema = z.object({
  body: z.object({
    id_equipo: z.number({ required_error: 'El ID del equipo es obligatorio' }).int().positive(),
    tipo: maintenanceTipo.default('PREVENTIVO'),
    titulo: z.string({ required_error: 'El título es obligatorio' }).trim().min(3, 'El título debe tener al menos 3 caracteres'),
    descripcion: z.string().trim().optional().nullable(),
    fecha_programada: z.string().transform(val => {
      // Intentar limpiar la fecha si viene con hora o formato ISO
      if (!val) return val;
      return val.split('T')[0].split(' ')[0];
    }).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')),
    id_tecnico_asignado: z.preprocess(val => (val === '' || val === 'null' ? null : val), z.coerce.number().int().positive().optional().nullable())
  })
});

const updateMantenimientoSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    estatus: maintenanceEstatus.optional(),
    notas_cierre: z.string().trim().optional().nullable(),
    costo: z.coerce.number().min(0).optional(),
    fecha_realizada: z.string().optional().nullable().transform(val => {
      if (!val) return val;
      return val.split('T')[0].split(' ')[0];
    }),
    titulo: z.string().trim().min(3).optional(),
    descripcion: z.string().trim().optional().nullable(),
    fecha_programada: z.string().optional().transform(val => {
      if (!val) return val;
      return val.split('T')[0].split(' ')[0];
    }),
    id_tecnico_asignado: z.preprocess(val => (val === '' || val === 'null' ? null : val), z.coerce.number().int().positive().optional().nullable())
  })
});

module.exports = {
  createMantenimientoSchema,
  updateMantenimientoSchema
};
