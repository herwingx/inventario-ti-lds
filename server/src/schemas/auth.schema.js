/**
 * @module Schemas/Auth
 * @description Esquemas de validación Zod para Autenticación.
 */
const { z } = require('zod');

const loginSchema = z.object({
  username: z.string({ required_error: 'El nombre de usuario es obligatorio' }).trim().min(1, 'El nombre de usuario no puede estar vacío'),
  password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña no puede estar vacía')
});

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'El correo electrónico es obligatorio' }).email('Formato de correo inválido')
});

const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'El token es obligatorio' }),
  newPassword: z.string({ required_error: 'La nueva contraseña es obligatoria' }).min(6, 'La contraseña debe tener al menos 6 caracteres')
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
