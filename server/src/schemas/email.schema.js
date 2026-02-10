const { z } = require('zod');

const emailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password_clear: z.string().trim().optional().nullable(), // Se almacena sin hash para propósitos administrativos (uso TI)
    id_sucursal: z.number().int().optional().nullable(),
    id_empleado_asignado: z.number().int().optional().nullable(),
    uso_descripcion: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateEmailSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    email: z.string().email().optional(),
    password_clear: z.string().trim().optional().nullable(),
    id_sucursal: z.number().int().optional().nullable(),
    id_empleado_asignado: z.number().int().optional().nullable(),
    uso_descripcion: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  emailSchema,
  updateEmailSchema
};
