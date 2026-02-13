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
 *               numero_empleado: { type: string }
 *               nombres: { type: string }
 *               apellidos: { type: string }
 *               email_personal: { type: string, format: email }
 *               telefono: { type: string }
 *               puesto: { type: string }
 *               fecha_nacimiento: { type: string, format: date }
 *               fecha_ingreso: { type: string, format: date }
 *               id_empresa: { type: integer }
 *               id_sucursal: { type: integer }
 *               id_area: { type: integer }
 *               asignar_id_correo: { type: integer, description: "ID de una cuenta de correo del sistema para asignar" }
 *     responses:
 *       201:
 *         description: Empleado creado.
 *       409:
 *         description: Empleado duplicado (email o número).
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
 *             properties:
 *               numero_empleado: { type: string }
 *               nombres: { type: string }
 *               apellidos: { type: string }
 *               email_personal: { type: string, format: email }
 *               telefono: { type: string }
 *               puesto: { type: string }
 *               fecha_nacimiento: { type: string, format: date }
 *               fecha_ingreso: { type: string, format: date }
 *               id_empresa: { type: integer }
 *               id_sucursal: { type: integer }
 *               id_area: { type: integer }
 *               asignar_id_correo: { type: integer }
 *               id_status: { type: integer }
 *     responses:
 *       200:
 *         description: Empleado actualizado.
 *       404:
 *         description: Empleado no encontrado.
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
 *       404:
 *         description: Empleado no encontrado.
 */
router.delete('/:id', empleadosController.deleteEmpleado);

module.exports = router;
