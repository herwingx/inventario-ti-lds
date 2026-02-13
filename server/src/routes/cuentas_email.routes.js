/**
 * @module Routes/CuentasEmail
 * @description Rutas para gestión de cuentas de correo corporativo.
 */
const express = require('express');
const router = express.Router();
const cuentasEmailController = require('../controllers/cuentas_email.controller');

/**
 * @openapi
 * tags:
 *   name: Correos
 *   description: Gestión de cuentas de email corporativo
 */

/**
 * @openapi
 * /api/cuentas-email:
 *   get:
 *     summary: Listar cuentas de correo
 *     tags: [Correos]
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
 *     tags: [Correos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle de la cuenta.
 */
router.get('/:id', cuentasEmailController.getCuentaEmailById);

/**
 * @openapi
 * /api/cuentas-email:
 *   post:
 *     summary: Registrar cuenta de correo
 *     tags: [Correos]
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
 *               email: { type: string, format: email }
 *               password_clear: { type: string }
 *               id_sucursal: { type: integer }
 *               id_empleado_asignado: { type: integer }
 *               uso_descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Cuenta creada.
 *       409:
 *         description: Email duplicado.
 */
router.post('/', cuentasEmailController.createCuentaEmail);

/**
 * @openapi
 * /api/cuentas-email/{id}:
 *   put:
 *     summary: Actualizar cuenta de correo
 *     tags: [Correos]
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
 *               email: { type: string }
 *               password_clear: { type: string }
 *               id_sucursal: { type: integer }
 *               id_empleado_asignado: { type: integer }
 *               uso_descripcion: { type: string }
 *               id_status: { type: integer }
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
 *     tags: [Correos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cuenta eliminada.
 */
router.delete('/:id', cuentasEmailController.deleteCuentaEmail);

module.exports = router;
