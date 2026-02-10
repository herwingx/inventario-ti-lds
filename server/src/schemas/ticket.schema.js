const { z } = require('zod');

const ticketSchema = z.object({
  body: z.object({
    titulo: z.string().trim().min(3),
    descripcion: z.string().trim().min(5),
    prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
    id_equipo_relacionado: z.number().int().optional().nullable(),
    id_sucursal: z.number().int().optional().nullable()
  })
});

const updateTicketSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional(),
    descripcion: z.string().trim().min(5).optional(),
    prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
    estatus: z.enum(['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO', 'CANCELADO']).optional(),
    id_tecnico_asignado: z.number().int().optional().nullable(),
    comentarios_tecnicos: z.string().trim().optional().nullable()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

module.exports = {
  ticketSchema,
  updateTicketSchema
};
