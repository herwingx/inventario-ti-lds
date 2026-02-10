const { z } = require('zod');

const tipoEquipoSchema = z.object({
  body: z.object({
    nombre_tipo: z.string().trim().min(2),
    descripcion: z.string().trim().optional()
  })
});

const updateTipoEquipoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    nombre_tipo: z.string().trim().min(2).optional(),
    descripcion: z.string().trim().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  tipoEquipoSchema,
  updateTipoEquipoSchema
};
