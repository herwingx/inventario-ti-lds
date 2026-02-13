/**
 * @module Schemas/Email
 * @description Esquemas de validación Zod para la entidad 'CuentaEmail'.
 */
const { z } = require('zod');

const emailSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'El email es obligatorio' }).email('Formato de email inválido'),
    password_clear: z.string().trim().optional().nullable(),
    id_sucursal: z.number().int().optional().nullable(),
    id_empleado_asignado: z.number().int().optional().nullable(),
    uso_descripcion: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateEmailSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    email: z.string().email('Formato de email inválido').optional(),
    password_clear: z.string().trim().optional().nullable(),
    id_sucursal: z.number().int().optional().nullable(),
    id_empleado_asignado: z.number().int().optional().nullable(),
    uso_descripcion: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional()
  })
});

module.exports = {
  emailSchema,
  updateEmailSchema
};
