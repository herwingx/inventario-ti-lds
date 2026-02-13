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
 *     parameters:
 *       - in: query
 *         name: id_empleado
 *         schema: { type: integer }
 *       - in: query
 *         name: id_equipo
 *         schema: { type: integer }
 *       - in: query
 *         name: activas
 *         schema: { type: boolean }
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
 *       404:
 *         description: Asignación no encontrada.
 */
router.get('/:id', asignacionesController.getAsignacionById);

/**
 * @openapi
 * /api/asignaciones/{id}/pdf:
 *   get:
 *     summary: Descargar Carta Responsiva en PDF
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
 *         description: Archivo PDF generado exitosamente.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       404:
 *         description: Asignación no encontrada.
 */
router.get('/:id/pdf', asignacionesController.getResponsivaPDF);

/**
 * @openapi
 * /api/asignaciones/{id}/sign:
 *   post:
 *     summary: Firmar digitalmente una asignación y generar PDF final
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firma]
 *             properties:
 *               firma: { type: string, description: "Imagen de la firma en Base64 (PNG)" }
 *     responses:
 *       200:
 *         description: Documento firmado y guardado.
 *       400:
 *         description: Falta la firma.
 */
router.post('/:id/sign', asignacionesController.signAssignment);

/**
 * @openapi
 * /api/asignaciones:
 *   post:
 *     summary: Crear una nueva asignación
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_equipo]
 *             properties:
 *               id_equipo: { type: integer }
 *               id_empleado: { type: integer, nullable: true }
 *               id_sucursal_asignado: { type: integer, nullable: true }
 *               id_area_asignado: { type: integer, nullable: true }
 *               fecha_asignacion: { type: string, format: date-time, example: "2024-03-20 10:00:00" }
 *               observacion: { type: string }
 *               componentes: 
 *                 type: array
 *                 items: { type: integer }
 *                 description: "IDs de equipos hijos (periféricos) a asignar en conjunto"
 *     responses:
 *       201:
 *         description: Asignación creada.
 *       400:
 *         description: Faltan datos obligatorios (ej. empleado/sucursal).
 */
router.post('/', asignacionesController.createAsignacion);

/**
 * @openapi
 * /api/asignaciones/con-componentes:
 *   post:
 *     summary: Crear asignación con componentes (Alias)
 *     deprecated: true
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/AsignacionBody'
 *     responses:
 *       201:
 *         description: Asignación creada.
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
 *       404:
 *         description: Asignación no encontrada.
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [componentes]
 *             properties:
 *               componentes:
 *                 type: array
 *                 items: { type: integer }
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
 *               fecha_fin_asignacion: { type: string, format: date-time }
 *               observacion: { type: string }
 *               id_status_asignacion: { type: integer }
 *     responses:
 *       200:
 *         description: Asignación actualizada.
 *       404:
 *         description: Asignación no encontrada.
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Asignación eliminada.
 *       404:
 *         description: Asignación no encontrada.
 */
router.delete('/:id', asignacionesController.deleteAsignacion);

module.exports = router;
