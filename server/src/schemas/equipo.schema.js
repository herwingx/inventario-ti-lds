/**
 * @module Schemas/Equipo
 * @description Esquemas de validación Zod para la entidad 'Equipo'.
 */
const { z } = require('zod');

// Regex para validar formato fecha YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const optionalNullableText = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().trim().optional().nullable()
);

const createEquipoSchema = z.object({
  body: z.object({
    numero_serie: z.string({ required_error: 'El número de serie es obligatorio' }).trim().min(1, 'El número de serie no puede estar vacío'),
    nombre_equipo: optionalNullableText,
    marca: optionalNullableText,
    modelo: optionalNullableText,
    id_tipo_equipo: z.coerce.number({ required_error: 'El ID de tipo de equipo es obligatorio' }).int().positive(),
    id_sucursal_actual: z.coerce.number({ required_error: 'El ID de sucursal es obligatorio' }).int().positive(),
    procesador: optionalNullableText,
    ram: optionalNullableText,
    disco_duro: optionalNullableText,
    sistema_operativo: optionalNullableText,
    mac_address: z.string().trim().optional().nullable().transform(val => val === '' ? null : val), // Permitir string vacío como null
    otras_caracteristicas: optionalNullableText,
    fecha_compra: z.string().regex(dateRegex, 'La fecha de compra debe tener formato YYYY-MM-DD').optional().nullable().transform(val => val ? new Date(`${val}T00:00:00.000Z`) : val),
    frecuencia_mantenimiento_meses: z.preprocess((val) => (val === '' || val === '0' || val === 0 ? null : val), z.coerce.number().int().positive().optional().nullable()),
    proxima_fecha_mantenimiento: z.preprocess((val) => (val === '' ? null : val), z.string().regex(dateRegex, 'La fecha debe tener formato YYYY-MM-DD').optional().nullable().transform(val => val ? new Date(`${val}T00:00:00.000Z`) : val)),
    id_status: z.coerce.number().int().positive().optional().default(5) // Default a DISPONIBLE (5)
  })
});

const updateEquipoSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    numero_serie: z.string().trim().min(1).optional(),
    nombre_equipo: optionalNullableText,
    marca: optionalNullableText,
    modelo: optionalNullableText,
    id_tipo_equipo: z.coerce.number().int().positive().optional(),
    id_sucursal_actual: z.coerce.number().int().positive().optional(),
    procesador: optionalNullableText,
    ram: optionalNullableText,
    disco_duro: optionalNullableText,
    sistema_operativo: optionalNullableText,
    mac_address: z.string().trim().optional().nullable(),
    otras_caracteristicas: optionalNullableText,
    fecha_compra: z.preprocess((val) => (val === '' ? null : val), z.string().regex(dateRegex, 'La fecha de compra debe tener formato YYYY-MM-DD').optional().nullable().transform(val => val ? new Date(`${val}T00:00:00.000Z`) : val)),
    frecuencia_mantenimiento_meses: z.preprocess((val) => (val === '' || val === '0' || val === 0 ? null : val), z.coerce.number().int().positive().optional().nullable()),
    proxima_fecha_mantenimiento: z.preprocess((val) => (val === '' ? null : val), z.string().regex(dateRegex, 'La fecha debe tener formato YYYY-MM-DD').optional().nullable().transform(val => val ? new Date(`${val}T00:00:00.000Z`) : val)),
    id_status: z.coerce.number().int().positive().optional()
  })
});

module.exports = {
  createEquipoSchema,
  updateEquipoSchema
};
