const { z } = require('zod');

const tipoSucursalSchema = z.object({
  body: z.object({
    nombre_tipo: z.string().trim().min(3)
  })
});

const updateTipoSucursalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    nombre_tipo: z.string().trim().min(3)
  })
});

module.exports = {
  tipoSucursalSchema,
  updateTipoSucursalSchema
};
