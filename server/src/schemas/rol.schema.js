/**
 * @module Schemas/Rol
 * @description Esquemas de validación Zod para la entidad 'Rol'.
 */
const { z } = require('zod');

const rolesSchema = z.object({
  body: z.object({
    nombre_rol: z.string({ required_error: 'El nombre del rol es obligatorio' }).trim().min(3, 'El rol debe tener al menos 3 caracteres')
  })
});

const updateRolesSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    nombre_rol: z.string().trim().min(3).optional()
  })
});

module.exports = {
  rolesSchema,
  updateRolesSchema
};
