/**
 * @module Schemas/Sucursal
 * @description Esquemas de validación Zod para la entidad 'Sucursal'.
 */
const { z } = require('zod');

const createSucursalSchema = z.object({
  body: z.object({
    nombre: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    direccion: z.string().trim().optional(),
    numero_telefono: z.string().trim().optional(),
    id_empresa: z.number({ required_error: 'La empresa es obligatoria' }).int().positive(),
    id_tipo_sucursal: z.number({ required_error: 'El tipo de sucursal es obligatorio' }).int().positive(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateSucursalSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    nombre: z.string().trim().min(2).optional(),
    direccion: z.string().trim().optional(),
    numero_telefono: z.string().trim().optional(),
    id_empresa: z.number().int().positive().optional(),
    id_tipo_sucursal: z.number().int().positive().optional(),
    id_status: z.number().int().optional()
  })
});

module.exports = {
  createSucursalSchema,
  updateSucursalSchema
};
