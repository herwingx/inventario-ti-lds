/**
 * @module Schemas/Empleado
 * @description Esquemas de validación Zod para la entidad 'Empleado'.
 */
const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createEmpleadoSchema = z.object({
  body: z.object({
    numero_empleado: z.string().trim().min(1).optional().nullable(),
    nombres: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    apellidos: z.string({ required_error: 'El apellido es obligatorio' }).trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email_personal: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
    telefono: z.string().trim().optional().nullable(),
    puesto: z.string().trim().optional().nullable(),
    fecha_nacimiento: z.string().regex(dateRegex, 'Formato YYYY-MM-DD').optional().nullable(),
    fecha_ingreso: z.string().regex(dateRegex, 'Formato YYYY-MM-DD').optional().nullable(),
    id_empresa: z.number().int().positive().optional().nullable(),
    id_sucursal: z.number().int().positive().optional().nullable(),
    id_area: z.number().int().positive().optional().nullable(),
    id_status: z.number().int().optional().default(1),
    asignar_id_correo: z.number().int().positive().optional().nullable()
  })
});

const updateEmpleadoSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    numero_empleado: z.string().trim().min(1).optional().nullable(),
    nombres: z.string().trim().min(2).optional(),
    apellidos: z.string().trim().min(2).optional(),
    email_personal: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
    telefono: z.string().trim().optional().nullable(),
    puesto: z.string().trim().optional().nullable(),
    fecha_nacimiento: z.string().regex(dateRegex, 'Formato YYYY-MM-DD').optional().nullable(),
    fecha_ingreso: z.string().regex(dateRegex, 'Formato YYYY-MM-DD').optional().nullable(),
    id_empresa: z.number().int().positive().optional().nullable(),
    id_sucursal: z.number().int().positive().optional().nullable(),
    id_area: z.number().int().positive().optional().nullable(),
    id_status: z.number().int().optional(),
    asignar_id_correo: z.number().int().positive().optional().nullable()
  })
});

module.exports = {
  createEmpleadoSchema,
  updateEmpleadoSchema
};
