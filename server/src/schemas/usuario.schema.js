/**
 * @module Schemas/Usuario
 * @description Esquemas de validación Zod para la entidad 'UsuarioSistema'.
 */
const { z } = require('zod');

const createUsuarioSchema = z.object({
  body: z.object({
    username: z.string({ required_error: 'El usuario es obligatorio' }).trim().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: z.string().trim().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().nullable(),
    email: z.string().email('Formato de email inválido').optional().nullable(),
    id_empleado: z.number().int().positive().optional().nullable(),
    id_rol: z.number({ required_error: 'El Rol es obligatorio' }).int().positive(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateUsuarioSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    username: z.string().trim().min(3).optional(),
    password: z.string().trim().min(6).optional().nullable(),
    email: z.string().email().optional().nullable(),
    id_empleado: z.number().int().positive().optional().nullable(),
    id_rol: z.number().int().positive().optional(),
    id_status: z.number().int().optional()
  })
});

module.exports = {
  createUsuarioSchema,
  updateUsuarioSchema
};
