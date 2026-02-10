/**
 * @module Routes/CuentasEmail
 * @description Define las rutas para la gestión de cuentas de correo corporativo.
 */
// src/routes/cuentasEmail.routes.js
// Define las rutas HTTP para la entidad 'cuentas_email_corporativo'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de cuentas de email
const cuentasEmailController = require('../controllers/cuentas_email.controller');

/**
 * @openapi
 * tags:
 *   name: Recursos Digitales
 *   description: Gestión de correos corporativos y accesos
 */

/**
 * @openapi
 * /api/cuentas-email:
 *   get:
 *     summary: Listar cuentas de correo
 *     tags: [Recursos Digitales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas.
 */
router.get('/', cuentasEmailController.getAllCuentasEmail);

/**
 * @openapi
 * /api/cuentas-email/{id}:
 *   get:
 *     summary: Obtener cuenta por ID
 *     tags: [Recursos Digitales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de la cuenta.
 */
router.get('/:id', cuentasEmailController.getCuentaEmailById);

/**
 * @openapi
 * /api/cuentas-email:
 *   post:
 *     summary: Registrar nueva cuenta de correo
 *     tags: [Recursos Digitales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "usuario@empresa.com" }
 *               id_empleado_asignado: { type: integer }
 *     responses:
 *       201:
 *         description: Cuenta creada.
 */
router.post('/', cuentasEmailController.createCuentaEmail);

/**
 * @openapi
 * /api/cuentas-email/{id}:
 *   put:
 *     summary: Actualizar cuenta de correo
 *     tags: [Recursos Digitales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta actualizada.
 */
router.put('/:id', cuentasEmailController.updateCuentaEmail);

/**
 * @openapi
 * /api/cuentas-email/{id}:
 *   delete:
 *     summary: Eliminar cuenta de correo
 *     tags: [Recursos Digitales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta eliminada.
 */
router.delete('/:id', cuentasEmailController.deleteCuentaEmail);

module.exports = router;