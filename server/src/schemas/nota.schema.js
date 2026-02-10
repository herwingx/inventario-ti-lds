const { z } = require('zod');

const notaSchema = z.object({
  body: z.object({
    id_equipo: z.number().int().optional().nullable(),
    id_mantenimiento: z.number().int().optional().nullable(),
    id_cuenta_email: z.number().int().optional().nullable(),
    titulo: z.string().trim().min(3).optional().nullable(),
    contenido: z.string().trim().min(5).optional(),
    comentario: z.string().trim().min(5).optional()
  }).refine(data => data.contenido || data.comentario, {
    message: 'Debe proporcionar el contenido de la nota (contenido o comentario)'
  }).transform(data => {
    const { comentario, ...rest } = data;
    return {
      ...rest,
      contenido: data.contenido || comentario
    };
  })
});

const updateNotaSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional().nullable(),
    contenido: z.string().trim().min(5).optional(),
    comentario: z.string().trim().min(5).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  }).transform(data => {
    const { comentario, ...rest } = data;
    if (comentario && !rest.contenido) {
      rest.contenido = comentario;
    }
    return rest;
  })
});

module.exports = {
  notaSchema,
  updateNotaSchema
};
