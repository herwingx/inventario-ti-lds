const { z } = require('zod');

const createEmpresaSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    id_status: z.number().int().optional().default(1)
  })
});

const updateEmpresaSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    nombre: z.string().trim().min(2).optional(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createEmpresaSchema,
  updateEmpresaSchema
};
