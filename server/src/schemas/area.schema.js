/**
 * @module Schemas/Area
 * @description Esquemas de validación Zod para la entidad 'Area'.
 */
const { z } = require('zod');

const createAreaSchema = z.object({
  body: z.object({
    nombre: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    id_sucursal: z.number({ required_error: 'La sucursal es obligatoria' }).int().positive(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateAreaSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    nombre: z.string().trim().min(2).optional(),
    id_sucursal: z.number().int().positive().optional(),
    id_status: z.number().int().optional()
  })
});

module.exports = {
  createAreaSchema,
  updateAreaSchema
};
