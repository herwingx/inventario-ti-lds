/**
 * @module Routes/DireccionesIP
 * @description Define las rutas para la gestión del inventario de direcciones IP.
 */
// src/routes/direccionesIp.routes.js
// Define las rutas HTTP para la entidad 'direcciones_ip'.

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo las funciones controladoras de direcciones IP
const direccionesIpController = require('../controllers/direcciones_ip.controller');

/**
 * @openapi
 * tags:
 *   name: Infraestructura
 *   description: Gestión de red, IPs y recursos tecnológicos
 */

/**
 * @openapi
 * /api/direcciones-ip:
 *   get:
 *     summary: Listar direcciones IP
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: segmento
 *         schema: { type: integer }
 *         description: Filtrar por segmento (0-15)
 *     responses:
 *       200:
 *         description: Lista de IPs.
 */
router.get('/', direccionesIpController.getAllDireccionesIp);

/**
 * @openapi
 * /api/direcciones-ip/segmentos:
 *   get:
 *     summary: Resumen de IPs por segmento
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen estadístico de segmentos.
 */
router.get('/segmentos', direccionesIpController.getSegmentosResumen);

/**
 * @openapi
 * /api/direcciones-ip/{id}:
 *   get:
 *     summary: Obtener IP por ID
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la IP.
 */
router.get('/:id', direccionesIpController.getDireccionIpById);

/**
 * @openapi
 * /api/direcciones-ip:
 *   post:
 *     summary: Registrar una nueva IP
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [direccion_ip]
 *             properties:
 *               direccion_ip: { type: string, example: "10.10.1.50" }
 *               id_sucursal: { type: integer }
 *     responses:
 *       201:
 *         description: IP creada.
 */
router.post('/', direccionesIpController.createDireccionIp);

/**
 * @openapi
 * /api/direcciones-ip/{id}:
 *   put:
 *     summary: Actualizar una IP
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: IP actualizada.
 */
router.put('/:id', direccionesIpController.updateDireccionIp);

/**
 * @openapi
 * /api/direcciones-ip/{id}:
 *   delete:
 *     summary: Eliminar una IP
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: IP eliminada.
 */
router.delete('/:id', direccionesIpController.deleteDireccionIp);

module.exports = router;