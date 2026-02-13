/**
 * @module Routes/Documentacion
 * @description Rutas para gestión de documentos del sistema.
 */
const express = require('express');
const router = express.Router();
const documentacionController = require('../controllers/documentacion.controller');

/**
 * @openapi
 * tags:
 *   name: Documentacion
 *   description: Gestión de archivos y manuales
 */

/**
 * @openapi
 * /api/documentacion:
 *   get:
 *     summary: Listar documentos
 *     tags: [Documentacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos.
 */
router.get('/', documentacionController.getAllDocumentos);

/**
 * @openapi
 * /api/documentacion/{id}:
 *   get:
 *     summary: Obtener documento por ID
 *     tags: [Documentacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle del documento.
 */
router.get('/:id', documentacionController.getDocumentoById);

/**
 * @openapi
 * /api/documentacion:
 *   post:
 *     summary: Registrar documento
 *     tags: [Documentacion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, url_archivo]
 *             properties:
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               tipo_documento: { type: string }
 *               url_archivo: { type: string }
 *     responses:
 *       201:
 *         description: Documento registrado.
 */
router.post('/', documentacionController.createDocumento);

/**
 * @openapi
 * /api/documentacion/{id}:
 *   put:
 *     summary: Actualizar documento
 *     tags: [Documentacion]
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
 *               descripcion: { type: string }
 *               url_archivo: { type: string }
 *               id_status: { type: integer }
 *     responses:
 *       200:
 *         description: Documento actualizado.
 */
router.put('/:id', documentacionController.updateDocumento);

/**
 * @openapi
 * /api/documentacion/{id}:
 *   delete:
 *     summary: Eliminar documento
 *     tags: [Documentacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Documento eliminado.
 */
router.delete('/:id', documentacionController.deleteDocumento);

module.exports = router;
