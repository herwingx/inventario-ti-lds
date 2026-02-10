const { z } = require('zod');

const createSucursalSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2),
    direccion: z.string().trim().optional(),
    numero_telefono: z.string().trim().optional(),
    id_empresa: z.number().int(),
    id_tipo_sucursal: z.number().int(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateSucursalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    nombre: z.string().trim().min(2).optional(),
    direccion: z.string().trim().optional(),
    numero_telefono: z.string().trim().optional(),
    id_empresa: z.number().int().optional(),
    id_tipo_sucursal: z.number().int().optional(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createSucursalSchema,
  updateSucursalSchema
};
