/**
 * @module Schemas/Equipo
 * @description Esquemas de validación Zod para la entidad 'Equipo'.
 */
const { z } = require('zod');

// Regex para validar formato fecha YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createEquipoSchema = z.object({
  body: z.object({
    numero_serie: z.string({ required_error: 'El número de serie es obligatorio' }).trim().min(1, 'El número de serie no puede estar vacío'),
    nombre_equipo: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    id_tipo_equipo: z.number({ required_error: 'El ID de tipo de equipo es obligatorio' }).int().positive(),
    id_sucursal_actual: z.number({ required_error: 'El ID de sucursal es obligatorio' }).int().positive(),
    procesador: z.string().optional(),
    ram: z.string().optional(),
    disco_duro: z.string().optional(),
    sistema_operativo: z.string().optional(),
    mac_address: z.string().trim().optional().nullable().transform(val => val === '' ? null : val), // Permitir string vacío como null
    otras_caracteristicas: z.string().optional(),
    fecha_compra: z.string().regex(dateRegex, 'La fecha de compra debe tener formato YYYY-MM-DD').optional().nullable(),
    id_status: z.number().int().positive().optional().default(5) // Default a DISPONIBLE (5)
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
    nombre_equipo: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    id_tipo_equipo: z.number().int().positive().optional(),
    id_sucursal_actual: z.number().int().positive().optional(),
    procesador: z.string().optional(),
    ram: z.string().optional(),
    disco_duro: z.string().optional(),
    sistema_operativo: z.string().optional(),
    mac_address: z.string().trim().optional().nullable(),
    otras_caracteristicas: z.string().optional(),
    fecha_compra: z.string().regex(dateRegex, 'La fecha de compra debe tener formato YYYY-MM-DD').optional().nullable(),
    id_status: z.number().int().positive().optional()
  })
});

module.exports = {
  createEquipoSchema,
  updateEquipoSchema
};
