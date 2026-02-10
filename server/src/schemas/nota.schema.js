const { z } = require('zod');

const notaSchema = z.object({
  body: z.object({
    id_equipo: z.number().int(),
    titulo: z.string().trim().min(3),
    comentario: z.string().trim().min(5),
    id_status: z.number().int().optional().default(1)
  })
});

const updateNotaSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional(),
    comentario: z.string().trim().min(5).optional(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  notaSchema,
  updateNotaSchema
};
