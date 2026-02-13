/**
 * @module Schemas/Nota
 * @description Esquemas de validación Zod para la entidad 'Nota'.
 */
const { z } = require('zod');

const notaSchema = z.object({
  body: z.object({
    id_equipo: z.number().int().positive().optional().nullable(),
    id_mantenimiento: z.number().int().positive().optional().nullable(),
    id_cuenta_email: z.number().int().positive().optional().nullable(),
    titulo: z.string().trim().min(3).optional().nullable(),
    contenido: z.string().trim().min(5).optional(),
    comentario: z.string().trim().min(5).optional()
  }).refine(data => data.contenido || data.comentario, {
    message: 'Debe proporcionar el contenido de la nota (contenido o comentario)'
  }).transform(data => {
    // Normalizar campo 'comentario' a 'contenido' para consistencia
    const { comentario, ...rest } = data;
    return {
      ...rest,
      contenido: data.contenido || comentario
    };
  })
});

const updateNotaSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
      message: 'El ID debe ser un número positivo',
    })
  }),
  body: z.object({
    titulo: z.string().trim().min(3).optional().nullable(),
    contenido: z.string().trim().min(5).optional(),
    comentario: z.string().trim().min(5).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  }).transform(data => {
    const { comentario, ...rest } = data;
    if (comentario && !rest.contenido) {
      rest.contenido = comentario;
    }
    return rest;
  })
});

module.exports = {
  notaSchema,
  updateNotaSchema
};
