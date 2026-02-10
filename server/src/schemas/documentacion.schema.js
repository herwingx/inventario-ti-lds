const { z } = require('zod');

const documentoSchema = z.object({
  body: z.object({
    titulo: z.string().trim().min(3),
    descripcion: z.string().trim().optional().nullable(),
    tipo_documento: z.string().trim().optional().nullable(),
    url_archivo: z.string().trim().min(5),
    id_status: z.number().int().optional().default(1)
  })
});

const updateDocumentoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional(),
    descripcion: z.string().trim().optional().nullable(),
    tipo_documento: z.string().trim().optional().nullable(),
    url_archivo: z.string().trim().min(5).optional(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  documentoSchema,
  updateDocumentoSchema
};
