/**
 * @module Schemas/TipoSucursal
 * @description Esquemas de validación Zod para la entidad 'TipoSucursal'.
 */
const { z } = require('zod');

const tipoSucursalSchema = z.object({
  body: z.object({
    nombre_tipo: z.string({ required_error: 'El nombre del tipo es obligatorio' }).trim().min(3, 'El nombre debe tener al menos 3 caracteres')
  })
});

const updateTipoSucursalSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    nombre_tipo: z.string().trim().min(3).optional()
  })
});

module.exports = {
  tipoSucursalSchema,
  updateTipoSucursalSchema
};
