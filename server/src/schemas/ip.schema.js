const { z } = require('zod');

const ipSchema = z.object({
  body: z.object({
    direccion_ip: z.string().ip({ version: 'v4', message: 'Formato IPv4 inválido' }),
    id_sucursal: z.number().int().optional().nullable(),
    comentario: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional().default(1)
  })
});

const updateIpSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    direccion_ip: z.string().ip({ version: 'v4' }).optional(),
    id_sucursal: z.number().int().optional().nullable(),
    comentario: z.string().trim().optional().nullable(),
    id_status: z.number().int().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  ipSchema,
  updateIpSchema
};
