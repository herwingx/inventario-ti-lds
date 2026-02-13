/**
 * @module Schemas/TipoEquipo
 * @description Esquemas de validación Zod para la entidad 'TipoEquipo'.
 */
const { z } = require('zod');

const tipoEquipoSchema = z.object({
  body: z.object({
    nombre_tipo: z.string({ required_error: 'El nombre del tipo es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    descripcion: z.string().trim().optional()
  })
});

const updateTipoEquipoSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    nombre_tipo: z.string().trim().min(2).optional(),
    descripcion: z.string().trim().optional()
  })
});

module.exports = {
  tipoEquipoSchema,
  updateTipoEquipoSchema
};
