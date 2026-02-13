/**
 * @module Schemas/Status
 * @description Esquemas de validación Zod para la entidad 'Status'.
 */
const { z } = require('zod');

const statusSchema = z.object({
  body: z.object({
    nombre_status: z.string({ required_error: 'El nombre del status es obligatorio' }).trim().min(2, 'El status debe tener al menos 2 caracteres')
  })
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    nombre_status: z.string().trim().min(2).optional()
  })
});

module.exports = {
  statusSchema,
  updateStatusSchema
};
