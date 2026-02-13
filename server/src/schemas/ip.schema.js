/**
 * @module Schemas/Ip
 * @description Esquemas de validación Zod para la entidad 'DireccionIp'.
 */
const { z } = require('zod');

const ipSchema = z.object({
  body: z.object({
    direccion_ip: z.string({ required_error: 'La dirección IP es obligatoria' }).ip({ version: 'v4', message: 'Formato IPv4 inválido' }),
    id_sucursal: z.number().int().optional().nullable(),
    comentario: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateIpSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    direccion_ip: z.string().ip({ version: 'v4', message: 'Formato IPv4 inválido' }).optional(),
    id_sucursal: z.number().int().optional().nullable(),
    comentario: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional()
  })
});

module.exports = {
  ipSchema,
  updateIpSchema
};
