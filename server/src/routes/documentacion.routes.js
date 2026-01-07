/**
 * @module Routes/Documentacion
 * @description Define las rutas para la gestión de documentos asociados.
 */
const express = require('express');
const router = express.Router();
const documentacionController = require('../controllers/documentacion.controller');

// Rutas para Documentación
router.get('/', documentacionController.getAllDocumentos);
router.get('/:id', documentacionController.getDocumentoById);
router.post('/', documentacionController.createDocumento);
router.put('/:id', documentacionController.updateDocumento);
router.delete('/:id', documentacionController.deleteDocumento);

module.exports = router;
