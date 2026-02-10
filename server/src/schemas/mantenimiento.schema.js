const { z } = require('zod');

const maintenanceEstatus = z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO', 'VENCIDO']);

const createMantenimientoSchema = z.object({
  body: z.object({
    id_equipo: z.coerce.number().int(),
    tipo: z.enum(['PREVENTIVO', 'CORRECTIVO', 'ACTUALIZACION']).default('PREVENTIVO'),
    titulo: z.string().trim().min(3),
    descripcion: z.string().trim().optional().nullable(),
    fecha_programada: z.string().transform(val => {
      // Intentar limpiar la fecha si viene con hora o formato ISO
      return val.split('T')[0].split(' ')[0];
    }).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')),
    id_tecnico_asignado: z.preprocess(val => (val === '' || val === 'null' ? null : val), z.coerce.number().int().optional().nullable())
  })
});

const updateMantenimientoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    estatus: maintenanceEstatus.optional(),
    notas_cierre: z.string().trim().optional().nullable(),
    costo: z.coerce.number().optional(),
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
    id_tecnico_asignado: z.preprocess(val => (val === '' || val === 'null' ? null : val), z.coerce.number().int().optional().nullable())
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createMantenimientoSchema,
  updateMantenimientoSchema
};
