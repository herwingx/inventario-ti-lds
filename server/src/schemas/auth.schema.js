/**
 * @module Schemas/Auth
 * @description Esquemas de validación Zod para Autenticación.
 */
const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    username: z.string({ required_error: 'El nombre de usuario es obligatorio' }).trim().min(1),
    password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1)
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'El correo electrónico es obligatorio' }).email('Formato de correo inválido')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'El token es obligatorio' }),
    newPassword: z.string({ required_error: 'La nueva contraseña es obligatoria' }).min(6, 'La contraseña debe tener al menos 6 caracteres')
  })
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
