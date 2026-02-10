const { z } = require('zod');

const createUsuarioSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3),
    password: z.string().trim().min(6),
    email: z.string().email().optional().nullable(),
    id_empleado: z.number().int().optional().nullable(),
    id_rol: z.number().int(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateUsuarioSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    username: z.string().trim().min(3).optional(),
    password: z.string().trim().min(6).optional().nullable(),
    email: z.string().email().optional().nullable(),
    id_empleado: z.number().int().optional().nullable(),
    id_rol: z.number().int().optional(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createUsuarioSchema,
  updateUsuarioSchema
};
