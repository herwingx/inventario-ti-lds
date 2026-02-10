/**
 * @module Routes/Notas
 * @description Define las rutas para la gestión de notas y observaciones.
 */
// src/routes/notas.routes.js
// Define las rutas HTTP para la entidad 'notas'.

const express = require('express');
// Creamos una instancia del enrutador de Express.
const router = express.Router();

// Importamos las funciones controladoras.
const notasController = require('../controllers/notas.controller');

/**
 * @openapi
 * tags:
 *   name: Notas
 *   description: Sistema de observaciones y documentación técnica interna
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
 *         description: Datos de la nota.
 */
router.get('/:id', notasController.getNotaById);

/**
 * @openapi
 * /api/notas:
 *   post:
 *     summary: Crear una nueva nota vinculada a un recurso
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
 *               titulo: { type: string }
 *               contenido: { type: string }
 *               id_equipo: { type: integer }
 *               id_mantenimiento: { type: integer }
 *     responses:
 *       201:
 *         description: Nota creada.
 */
router.post('/', notasController.createNota);

/**
 * @openapi
 * /api/notas/{id}:
 *   put:
 *     summary: Actualizar una nota
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nota actualizada.
 */
router.put('/:id', notasController.updateNota);

/**
 * @openapi
 * /api/notas/{id}:
 *   delete:
 *     summary: Eliminar una nota
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nota eliminada.
 */
router.delete('/:id', notasController.deleteNota);

module.exports = router;