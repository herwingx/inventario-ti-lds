/**
 * @module Routes/Asignaciones
 * @description Define las rutas para la gestión de asignaciones de equipos a empleados o áreas.
 */
// src/routes/asignaciones.routes.js
// Define las rutas HTTP para la entidad 'asignaciones'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de asignaciones
const asignacionesController = require('../controllers/asignaciones.controller');

/**
 * @openapi
 * tags:
 *   name: Asignaciones
 *   description: Gestión de préstamos y vinculación de activos tecnológicos
 */

/**
 * @openapi
 * /api/asignaciones:
 *   get:
 *     summary: Listar todas las asignaciones
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asignaciones.
 */
router.get('/', asignacionesController.getAllAsignaciones);

/**
 * @openapi
 * /api/asignaciones/{id}:
 *   get:
 *     summary: Detalles de una asignación
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la asignación.
 */
router.get('/:id', asignacionesController.getAsignacionById);

/**
 * @openapi
 * /api/asignaciones:
 *   post:
 *     summary: Crear una nueva asignación simple
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_equipo, fecha_asignacion]
 *             properties:
 *               id_equipo: { type: integer }
 *               id_empleado: { type: integer }
 *               fecha_asignacion: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Asignación creada.
 */
router.post('/', asignacionesController.createAsignacion);

/**
 * @openapi
 * /api/asignaciones/con-componentes:
 *   post:
 *     summary: Crear una asignación vinculando componentes (periféricos)
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Asignación compleja creada.
 */
router.post('/con-componentes', asignacionesController.createAsignacionConComponentes);

/**
 * @openapi
 * /api/asignaciones/{id}/componentes:
 *   get:
 *     summary: Ver periféricos asociados a una asignación
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de componentes.
 */
router.get('/:id/componentes', asignacionesController.getComponentesAsignacion);

/**
 * @openapi
 * /api/asignaciones/{id}/componentes:
 *   put:
 *     summary: Actualizar vinculación de periféricos
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Componentes actualizados.
 */
router.put('/:id/componentes', asignacionesController.updateComponentesAsignacion);

/**
 * @openapi
 * /api/asignaciones/{id}:
 *   put:
 *     summary: Actualizar datos de asignación o finalizarla
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asignación actualizada.
 */
router.put('/:id', asignacionesController.updateAsignacion);

/**
 * @openapi
 * /api/asignaciones/{id}:
 *   delete:
 *     summary: Eliminar registro de asignación
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asignación eliminada.
 */
router.delete('/:id', asignacionesController.deleteAsignacion);

module.exports = router;