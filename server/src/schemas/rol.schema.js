const { z } = require('zod');

const rolesSchema = z.object({
  body: z.object({
    nombre_rol: z.string().trim().min(3)
  })
});

const updateRolesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    nombre_rol: z.string().trim().min(3)
  })
});

module.exports = {
  rolesSchema,
  updateRolesSchema
};
