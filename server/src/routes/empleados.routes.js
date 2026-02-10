/**
 * @module Routes/Empleados
 * @description Define las rutas para la gestión del directoria de empleados.
 */
// src/routes/empleados.routes.js
// Define las rutas HTTP para la entidad 'empleados'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de empleados
const empleadosController = require('../controllers/empleados.controller');

/**
 * @openapi
 * tags:
 *   name: Empleados
 *   description: Directorio de personal y gestión de responsables de activos
 */

/**
 * @openapi
 * /api/empleados:
 *   get:
 *     summary: Obtener lista de empleados
 *     tags: [Empleados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empleados.
 */
router.get('/', empleadosController.getAllEmpleados);

/**
 * @openapi
 * /api/empleados/{id}:
 *   get:
 *     summary: Obtener detalles de un empleado
 *     tags: [Empleados]
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
 *         description: Datos del empleado.
 *       404:
 *         description: Empleado no encontrado.
 */
router.get('/:id', empleadosController.getEmpleadoById);

/**
 * @openapi
 * /api/empleados:
 *   post:
 *     summary: Registrar un nuevo empleado
 *     tags: [Empleados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombres, apellidos]
 *             properties:
 *               nombres: { type: string }
 *               apellidos: { type: string }
 *               email_personal: { type: string }
 *               id_empresa: { type: integer }
 *     responses:
 *       201:
 *         description: Empleado creado.
 */
router.post('/', empleadosController.createEmpleado);

/**
 * @openapi
 * /api/empleados/{id}:
 *   put:
 *     summary: Actualizar datos de un empleado
 *     tags: [Empleados]
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
 *     responses:
 *       200:
 *         description: Empleado actualizado.
 */
router.put('/:id', empleadosController.updateEmpleado);

/**
 * @openapi
 * /api/empleados/{id}:
 *   delete:
 *     summary: Eliminar (baja lógica) un empleado
 *     tags: [Empleados]
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
 *         description: Empleado dado de baja.
 */
router.delete('/:id', empleadosController.deleteEmpleado);

module.exports = router;