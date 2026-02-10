const { z } = require('zod');

const statusSchema = z.object({
  body: z.object({
    nombre_status: z.string().trim().min(2)
  })
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    nombre_status: z.string().trim().min(2)
  })
});

module.exports = {
  statusSchema,
  updateStatusSchema
};
