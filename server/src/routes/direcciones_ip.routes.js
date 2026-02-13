/**
 * @module Routes/DireccionesIp
 * @description Rutas para la gestión de direcciones IP.
 */
const express = require('express');
const router = express.Router();
const direccionesIpController = require('../controllers/direcciones_ip.controller');

/**
 * @openapi
 * tags:
 *   name: Direcciones IP
 *   description: Gestión de inventario de red (IPv4)
 */

/**
 * @openapi
 * /api/direcciones-ip:
 *   get:
 *     summary: Listar direcciones IP
 *     tags: [Direcciones IP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_sucursal
 *         schema: { type: integer }
 *       - in: query
 *         name: estado
 *         description: Filtrar por estado (LIBRE, ASIGNADA)
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de IPs.
 */
router.get('/', direccionesIpController.getAllDireccionesIp);

/**
 * @openapi
 * /api/direcciones-ip/resumen:
 *   get:
 *     summary: Resumen de uso por segmento
 *     tags: [Direcciones IP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de uso de red.
 */
router.get('/resumen', direccionesIpController.getSegmentosResumen);

/**
 * @openapi
 * /api/direcciones-ip/{id}:
 *   get:
 *     summary: Obtener IP por ID
 *     tags: [Direcciones IP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle de la IP.
 */
router.get('/:id', direccionesIpController.getDireccionIpById);

/**
 * @openapi
 * /api/direcciones-ip:
 *   post:
 *     summary: Registrar nueva IP
 *     tags: [Direcciones IP]
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
 *               direccion_ip: { type: string, example: "192.168.1.10" }
 *               id_sucursal: { type: integer }
 *               comentario: { type: string }
 *     responses:
 *       201:
 *         description: IP registrada.
 *       409:
 *         description: IP duplicada.
 */
router.post('/', direccionesIpController.createDireccionIp);

/**
 * @openapi
 * /api/direcciones-ip/{id}:
 *   put:
 *     summary: Actualizar IP
 *     tags: [Direcciones IP]
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
 *               direccion_ip: { type: string }
 *               id_sucursal: { type: integer }
 *               comentario: { type: string }
 *               id_status: { type: integer }
 *     responses:
 *       200:
 *         description: IP actualizada.
 */
router.put('/:id', direccionesIpController.updateDireccionIp);

/**
 * @openapi
 * /api/direcciones-ip/{id}:
 *   delete:
 *     summary: Eliminar IP
 *     tags: [Direcciones IP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: IP eliminada.
 */
router.delete('/:id', direccionesIpController.deleteDireccionIp);

module.exports = router;
