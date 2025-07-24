// src/routes/equipos.routes.js
// Define las rutas HTTP para la entidad 'equipos'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de equipos
const equiposController = require('../controllers/equipos.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Estas rutas se montarán bajo el prefijo /api/equipos en server.js.
// ===============================================================

// * [GET] /api/equipos - Trae todos los equipos
router.get('/', equiposController.getAllEquipos);

// * [GET] /api/equipos/disponibles-componentes - Trae equipos disponibles para ser componentes
router.get('/disponibles-componentes', equiposController.getEquiposDisponiblesParaComponentes);

// * [GET] /api/equipos/debug-componentes - Debug: todos los componentes
router.get('/debug-componentes', async (req, res) => {
    try {
        const { query } = require('../config/db');
        const sql = `
          SELECT e.id, e.numero_serie, e.nombre_equipo, te.nombre_tipo, e.id_status, st.nombre_status
          FROM equipos e
          JOIN tipos_equipo te ON e.id_tipo_equipo = te.id
          LEFT JOIN status st ON e.id_status = st.id
          WHERE te.id NOT IN (1, 2)
          ORDER BY te.nombre_tipo, e.numero_serie
        `;
        const equipos = await query(sql);
        res.status(200).json({
            total: equipos.length,
            disponibles: equipos.filter(e => e.id_status === 5).length,
            asignados: equipos.filter(e => e.id_status === 4).length,
            equipos: equipos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// * [GET] /api/equipos/:id - Trae un equipo específico por su ID
router.get('/:id', equiposController.getEquipoById);

// * [POST] /api/equipos - Crea un nuevo equipo
router.post('/', equiposController.createEquipo);

// * [PUT] /api/equipos/:id - Actualiza un equipo por su ID
router.put('/:id', equiposController.updateEquipo);

// * [DELETE] /api/equipos/:id - Elimina un equipo por su ID
router.delete('/:id', equiposController.deleteEquipo);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;