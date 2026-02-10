/**
 * @module Routes/Documentacion
 * @description Define las rutas para la gestión de documentos asociados.
 */
const express = require('express');
const router = express.Router();
const documentacionController = require('../controllers/documentacion.controller');

/**
 * @openapi
 * tags:
 *   name: Documentos
 *   description: Gestión de archivos y manuales asociados al sistema
 */

/**
 * @openapi
 * /api/documentacion:
 *   get:
 *     summary: Listar documentos registrados
 *     tags: [Documentos]
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
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del documento.
 */
router.get('/:id', documentacionController.getDocumentoById);

/**
 * @openapi
 * /api/documentacion:
 *   post:
 *     summary: Registrar un nuevo documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Documento registrado.
 */
router.post('/', documentacionController.createDocumento);

module.exports = router;
