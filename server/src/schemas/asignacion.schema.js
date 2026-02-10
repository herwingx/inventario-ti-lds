const { z } = require('zod');

const createAsignacionSchema = z.object({
  body: z.object({
    id_equipo: z.number().int(),
    id_empleado: z.number().int().optional().nullable(),
    id_sucursal_asignado: z.number().int().optional().nullable(),
    id_area_asignado: z.number().int().optional().nullable(),
    id_equipo_padre: z.number().int().optional().nullable(),
    id_ip: z.number().int().optional().nullable(),
    fecha_asignacion: z.string().regex(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/, 'Formato YYYY-MM-DD [HH:MM:SS]'),
    observacion: z.string().trim().optional().nullable(),
    id_status_asignacion: z.number().int().optional().default(1),
    componentes: z.array(z.number().int()).optional() // Para creación con componentes
  }).refine(data => data.id_empleado || data.id_sucursal_asignado || data.id_area_asignado, {
    message: 'Una asignación activa debe estar vinculada a un empleado, sucursal o área.'
  })
});

const updateAsignacionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    id_equipo: z.number().int().optional(),
    id_empleado: z.number().int().optional().nullable(),
    id_sucursal_asignado: z.number().int().optional().nullable(),
    id_area_asignado: z.number().int().optional().nullable(),
    id_equipo_padre: z.number().int().optional().nullable(),
    id_ip: z.number().int().optional().nullable(),
    fecha_asignacion: z.string().optional(),
    fecha_fin_asignacion: z.string().optional().nullable(),
    observacion: z.string().trim().optional().nullable(),
    id_status_asignacion: z.number().int().optional(),
    componentes: z.array(z.number().int()).optional() // Para actualización de componentes
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createAsignacionSchema,
  updateAsignacionSchema
};
