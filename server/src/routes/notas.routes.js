/**
 * @module Routes/Notas
 * @description Rutas para gestión de notas/bitácora.
 */
const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notas.controller');

/**
 * @openapi
 * tags:
 *   name: Notas
 *   description: Bitácora de eventos y observaciones
 */

/**
 * @openapi
 * /api/notas:
 *   get:
 *     summary: Listar todas las notas
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notas.
 */
router.get('/', notasController.getAllNotas);

/**
 * @openapi
 * /api/notas/{id}:
 *   get:
 *     summary: Obtener nota por ID
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle de la nota.
 */
router.get('/:id', notasController.getNotaById);

/**
 * @openapi
 * /api/notas/equipo/{equipoId}:
 *   get:
 *     summary: Listar notas de un equipo específico
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: equipoId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historial de notas del equipo.
 */
router.get('/equipo/:equipoId', notasController.getNotasByEquipo);

/**
 * @openapi
 * /api/notas:
 *   post:
 *     summary: Crear nueva nota
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               id_equipo: { type: integer }
 *               id_mantenimiento: { type: integer }
 *               titulo: { type: string }
 *               contenido: { type: string }
 *     responses:
 *       201:
 *         description: Nota creada.
 */
router.post('/', notasController.createNota);

/**
 * @openapi
 * /api/notas/{id}:
 *   put:
 *     summary: Actualizar nota
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo: { type: string }
 *               contenido: { type: string }
 *     responses:
 *       200:
 *         description: Nota actualizada.
 */
router.put('/:id', notasController.updateNota);

/**
 * @openapi
 * /api/notas/{id}:
 *   delete:
 *     summary: Eliminar nota
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Nota eliminada.
 */
router.delete('/:id', notasController.deleteNota);

module.exports = router;
