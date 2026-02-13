/**
 * @module Schemas/Asignacion
 * @description Esquemas de validación Zod para la entidad 'Asignacion'.
 */
const { z } = require('zod');

// Regex para validar formato fecha YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
// Regex para fecha con hora opcional
const dateTimeRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;

const createAsignacionSchema = z.object({
  body: z.object({
    id_equipo: z.number({ required_error: 'El ID del equipo es obligatorio' }).int().positive(),
    id_empleado: z.number().int().positive().optional().nullable(),
    id_sucursal_asignado: z.number().int().positive().optional().nullable(),
    id_area_asignado: z.number().int().positive().optional().nullable(),
    id_equipo_padre: z.number().int().positive().optional().nullable(),
    id_ip: z.number().int().positive().optional().nullable(),
    fecha_asignacion: z.string().regex(dateTimeRegex, 'Formato inválido. Use YYYY-MM-DD [HH:MM:SS]').optional(),
    observacion: z.string().trim().optional().nullable(),
    id_status_asignacion: z.number().int().optional().default(1),
    componentes: z.array(z.number().int().positive()).optional()
  }).refine(data => data.id_empleado || data.id_sucursal_asignado || data.id_area_asignado, {
    message: 'Una asignación debe estar vinculada a un empleado, sucursal o área.'
  })
});

const updateAsignacionSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    id_equipo: z.number().int().positive().optional(),
    id_empleado: z.number().int().positive().optional().nullable(),
    id_sucursal_asignado: z.number().int().positive().optional().nullable(),
    id_area_asignado: z.number().int().positive().optional().nullable(),
    id_equipo_padre: z.number().int().positive().optional().nullable(),
    id_ip: z.number().int().positive().optional().nullable(),
    fecha_asignacion: z.string().regex(dateTimeRegex).optional(),
    fecha_fin_asignacion: z.string().regex(dateTimeRegex).optional().nullable(),
    observacion: z.string().trim().optional().nullable(),
    id_status_asignacion: z.number().int().optional(),
    componentes: z.array(z.number().int().positive()).optional()
  })
});

module.exports = {
  createAsignacionSchema,
  updateAsignacionSchema
};
