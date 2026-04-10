/**
 * @module Schemas/Ticket
 * @description Esquemas de validación Zod para la entidad 'Ticket'.
 */
const { z } = require('zod');

const ticketSchema = z.object({
  body: z.object({
    titulo: z.string({ required_error: 'El título es obligatorio' }).trim().min(3, 'El título debe tener al menos 3 caracteres'),
    categoria: z.string({ required_error: 'La categoría es obligatoria' }).trim().min(2, 'La categoría debe tener al menos 2 caracteres'),
    descripcion: z.string({ required_error: 'La descripción es obligatoria' }).trim().min(5, 'La descripción debe ser detallada'),
    prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).default('MEDIA'),
    tipo_falla: z.enum(['HARDWARE', 'SOFTWARE', 'RED', 'IMPRESORA', 'OTRO']).optional().default('OTRO'),
    id_equipo_relacionado: z.number().int().optional().nullable()
  })
});

const updateTicketSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional(),
    descripcion: z.string().trim().min(5).optional(),
    prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
    estatus: z.enum(['ABIERTO', 'EN_PROGRESO', 'PENDIENTE', 'RESUELTO', 'CERRADO']).optional(),
    id_asignado_a: z.number().int().optional().nullable(),
    comentarios_tecnicos: z.string().trim().optional().nullable()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

// Esquema para creación de ticket público
const publicTicketSchema = z.object({
  body: z.object({
    email_reporta: z.string().email('Email inválido').optional().nullable(),
    nombre_reporta: z.string().trim().min(2, 'Nombre requerido').optional().nullable(),
    descripcion: z.string({ required_error: 'La descripción del problema es obligatoria' }).trim().min(10, 'Por favor detalle el problema (mínimo 10 caracteres)'),
    prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA']).optional().default('MEDIA')
  })
});

// Esquema para comentario público
const publicCommentSchema = z.object({
  body: z.object({
    contenido: z.string({ required_error: 'El comentario no puede estar vacío' }).trim().min(2),
    nombre: z.string().trim().optional().default('Usuario')
  })
});

module.exports = {
  ticketSchema,
  updateTicketSchema,
  publicTicketSchema,
  publicCommentSchema
};
