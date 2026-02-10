const { z } = require('zod');

const createEmpleadoSchema = z.object({
  body: z.object({
    numero_empleado: z.string().trim().min(1).optional().nullable(),
    nombres: z.string().trim().min(2),
    apellidos: z.string().trim().min(2),
    email_personal: z.string().email('Email inválido').optional().nullable(),
    telefono: z.string().trim().optional().nullable(),
    puesto: z.string().trim().optional().nullable(),
    fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional().nullable(),
    fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional().nullable(),
    id_empresa: z.number().int().optional().nullable(),
    id_sucursal: z.number().int().optional().nullable(),
    id_area: z.number().int().optional().nullable(),
    id_status: z.number().int().optional().default(1),
    asignar_id_correo: z.number().int().optional().nullable()
  })
});

const updateEmpleadoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    numero_empleado: z.string().trim().min(1).optional().nullable(),
    nombres: z.string().trim().min(2).optional(),
    apellidos: z.string().trim().min(2).optional(),
    email_personal: z.string().email('Email inválido').optional().nullable(),
    telefono: z.string().trim().optional().nullable(),
    puesto: z.string().trim().optional().nullable(),
    fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional().nullable(),
    fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional().nullable(),
    id_empresa: z.number().int().optional().nullable(),
    id_sucursal: z.number().int().optional().nullable(),
    id_area: z.number().int().optional().nullable(),
    id_status: z.number().int().optional(),
    asignar_id_correo: z.number().int().optional().nullable()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  createEmpleadoSchema,
  updateEmpleadoSchema
};
