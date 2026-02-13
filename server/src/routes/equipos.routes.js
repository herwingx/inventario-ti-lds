// src/routes/equipos.routes.js
// Define las rutas HTTP para la entidad 'equipos'.

const express = require('express');

/**
 * @module routes/equipos
 * @description Rutas API para la gestión de equipos (Hardware).
 */
const router = express.Router();

// * Importo las funciones controladoras de equipos
const equiposController = require('../controllers/equipos.controller');

/**
 * @openapi
 * tags:
 *   name: Equipos
 *   description: Gestión del inventario de hardware y activos tecnológicos
 */

/**
 * @openapi
 * /api/equipos:
 *   get:
 *     summary: Listar todos los equipos
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipos obtenida exitosamente.
 *       401:
 *         description: No autorizado.
 */
router.get('/', equiposController.getAllEquipos);

/**
 * @openapi
 * /api/equipos/disponibles-componentes:
 *   get:
 *     summary: Listar equipos disponibles para ser usados como componentes
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de componentes disponibles.
 */
router.get('/disponibles-componentes', equiposController.getEquiposDisponiblesParaComponentes);

/**
 * @openapi
 * /api/equipos/{id}:
 *   get:
 *     summary: Obtener detalles de un equipo por ID
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del equipo.
 *       404:
 *         description: Equipo no encontrado.
 */
router.get('/:id', equiposController.getEquipoById);

/**
 * @openapi
 * /api/equipos:
 *   post:
 *     summary: Registrar un nuevo equipo
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_serie
 *               - id_tipo_equipo
 *               - id_sucursal_actual
 *             properties:
 *               numero_serie:
 *                 type: string
 *               nombre_equipo:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               id_tipo_equipo:
 *                 type: integer
 *               id_sucursal_actual:
 *                 type: integer
 *               procesador:
 *                 type: string
 *               ram:
 *                 type: string
 *               disco_duro:
 *                 type: string
 *               sistema_operativo:
 *                 type: string
 *               mac_address:
 *                 type: string
 *               otras_caracteristicas:
 *                 type: string
 *               fecha_compra:
 *                 type: string
 *                 format: date
 *               frecuencia_mantenimiento_meses:
 *                 type: integer
 *               proxima_fecha_mantenimiento:
 *                 type: string
 *                 format: date
 *               id_status:
 *                 type: integer
 *                 default: 5
 *     responses:
 *       201:
 *         description: Equipo creado exitosamente.
 *       400:
 *         description: Error de validación.
 *       409:
 *         description: Número de serie duplicado.
 */
router.post('/', equiposController.createEquipo);

/**
 * @openapi
 * /api/equipos/{id}:
 *   put:
 *     summary: Actualizar datos de un equipo
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_serie:
 *                 type: string
 *               nombre_equipo:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               id_tipo_equipo:
 *                 type: integer
 *               id_sucursal_actual:
 *                 type: integer
 *               procesador:
 *                 type: string
 *               ram:
 *                 type: string
 *               disco_duro:
 *                 type: string
 *               sistema_operativo:
 *                 type: string
 *               mac_address:
 *                 type: string
 *               otras_caracteristicas:
 *                 type: string
 *               fecha_compra:
 *                 type: string
 *                 format: date
 *               frecuencia_mantenimiento_meses:
 *                 type: integer
 *               proxima_fecha_mantenimiento:
 *                 type: string
 *                 format: date
 *               id_status:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Equipo actualizado.
 *       404:
 *         description: Equipo no encontrado.
 */
router.put('/:id', equiposController.updateEquipo);

/**
 * @openapi
 * /api/equipos/{id}:
 *   delete:
 *     summary: Dar de baja un equipo
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Equipo eliminado (Soft delete).
 *       404:
 *         description: Equipo no encontrado.
 */
router.delete('/:id', equiposController.deleteEquipo);

module.exports = router;
