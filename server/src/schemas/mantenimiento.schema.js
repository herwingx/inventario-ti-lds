const { z } = require('zod');

const maintenanceEstatus = z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO']);

const createMantenimientoSchema = z.object({
  body: z.object({
    id_equipo: z.number().int(),
    tipo: z.enum(['PREVENTIVO', 'CORRECTIVO']).default('PREVENTIVO'),
    titulo: z.string().trim().min(3),
    descripcion: z.string().trim().optional(),
    fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    id_tecnico_asignado: z.number().int().optional().nullable()
  })
});

const updateMantenimientoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    estatus: maintenanceEstatus.optional(),
    notas_cierre: z.string().trim().optional(),
    costo: z.number().optional(),
    fecha_realizada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
    titulo: z.string().trim().min(3).optional(),
    descripcion: z.string().trim().optional(),
    fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
    id_tecnico_asignado: z.number().int().optional().nullable()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createMantenimientoSchema,
  updateMantenimientoSchema
};
