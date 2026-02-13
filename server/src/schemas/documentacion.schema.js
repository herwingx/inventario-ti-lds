/**
 * @module Schemas/Documentacion
 * @description Esquemas de validación Zod para la entidad 'Documento'.
 */
const { z } = require('zod');

const documentoSchema = z.object({
  body: z.object({
    titulo: z.string({ required_error: 'El título es obligatorio' }).trim().min(3, 'El título debe tener al menos 3 caracteres'),
    descripcion: z.string().trim().optional().nullable(),
    tipo_documento: z.string().trim().optional().nullable(),
    url_archivo: z.string({ required_error: 'La URL del archivo es obligatoria' }).trim().min(5),
    id_status: z.number().int().optional().default(1)
  })
});

const updateDocumentoSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional(),
    descripcion: z.string().trim().optional().nullable(),
    tipo_documento: z.string().trim().optional().nullable(),
    url_archivo: z.string().trim().min(5).optional(),
    id_status: z.number().int().optional()
  })
});

module.exports = {
  documentoSchema,
  updateDocumentoSchema
};
