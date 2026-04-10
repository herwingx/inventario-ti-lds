/**
 * @module Schemas/Auth
 * @description Esquemas de validación Zod para Autenticación.
 */
const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().trim().optional(),
  username: z.string().trim().optional(),
  email: z.string().trim().email('Formato de correo inválido').optional(),
  password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña no puede estar vacío')
}).refine((data) => Boolean(data.identifier || data.username || data.email), {
  message: 'El correo o nombre de usuario es obligatorio',
  path: ['identifier']
});

const signupSchema = z.object({
  nombres: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  apellidos: z.string({ required_error: 'El apellido es obligatorio' }).trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido no puede exceder 100 caracteres'),
  email: z.string({ required_error: 'El correo electrónico es obligatorio' }).trim().email('Formato de correo inválido').max(100, 'El correo no puede exceder 100 caracteres')
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
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
