/**
 * @module Controllers/Equipos
 * @description Controlador para la gestión de equipos.
 * Utiliza el patrón Service-Repository y validación Zod.
 */
const EquipoService = require('../services/equipos.service');
const { createEquipoSchema, updateEquipoSchema } = require('../schemas/equipo.schema');
const logger = require('../utils/logger');

/**
 * Obtiene la lista completa de equipos.
 * @route GET /api/equipos
 */
const getAllEquipos = async (req, res, next) => {
    try {
        const equipos = await EquipoService.findAll();
        res.status(200).json(equipos);
    } catch (error) {
        logger.error(`Error en getAllEquipos: ${error.message}`);
        next(error);
    }
};

/**
 * Busca un equipo por ID.
 * @route GET /api/equipos/:id
 */
const getEquipoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const equipo = await EquipoService.findById(id);

        if (!equipo) {
            return res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
        }

        res.status(200).json(equipo);
    } catch (error) {
        logger.error(`Error en getEquipoById(${req.params.id}): ${error.message}`);
        next(error);
    }
};

/**
 * Crea un nuevo equipo con validación estricta Zod.
 * @route POST /api/equipos
 */
const createEquipo = async (req, res, next) => {
    try {
        // 1. Validar entrada con Zod
        const validation = createEquipoSchema.safeParse({ body: req.body });

        if (!validation.success) {
            // Formatear errores de Zod para el cliente de forma segura
            let errors = [];
            if (validation.error && Array.isArray(validation.error.errors)) {
                errors = validation.error.errors.map(e => e.message);
            } else {
                errors = [validation.error?.message || 'Error de validación desconocido'];
            }

            logger.warn(`Intento de creación de equipo inválido: ${errors.join(', ')}`);
            return res.status(400).json({ message: 'Datos inválidos', errors });
        }

        // 2. Llamar al servicio con datos limpios
        const newEquipo = await EquipoService.create(validation.data.body);

        logger.info(`Equipo creado: ID ${newEquipo.id} (${newEquipo.numero_serie})`);
        res.status(201).json({ message: 'Equipo creado exitosamente', equipo: newEquipo });

    } catch (error) {
        if (error.message.includes('DUPLICATE_ENTRY')) {
            return res.status(409).json({ message: error.message });
        }
        logger.error(`Error creando equipo: ${error.message}`);
        next(error);
    }
};

/**
 * Actualiza un equipo existente.
 * @route PUT /api/equipos/:id
 */
const updateEquipo = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validar Body (params id se valida implícitamente al convertir a int en servicio/db o zod)
        const validation = updateEquipoSchema.safeParse({ params: { id }, body: req.body });

        if (!validation.success) {
            const errors = validation.error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Datos inválidos', errors });
        }

        // 2. Llamar servicio
        try {
            const updated = await EquipoService.update(id, validation.data.body);

            if (!updated) {
                // Puede ser que no exista o que no hubo cambios, pero asumimos no encontrado para simpleza
                const exists = await EquipoService.findById(id);
                if (!exists) return res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
            }

            logger.info(`Equipo ID ${id} actualizado.`);
            res.status(200).json({ message: `Equipo con ID ${id} actualizado exitosamente.` });

        } catch (err) {
            if (err.message.includes('BUSINESS_RULE')) {
                return res.status(409).json({ message: err.message });
            }
            throw err;
        }

    } catch (error) {
        logger.error(`Error actualizando equipo ${req.params.id}: ${error.message}`);
        next(error);
    }
};

/**
 * Elimina un equipo.
 * @route DELETE /api/equipos/:id
 */
const deleteEquipo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await EquipoService.delete(id);

        if (!deleted) {
            return res.status(404).json({ message: `Equipo con ID ${id} no encontrado.` });
        }

        logger.info(`Equipo ID ${id} eliminado.`);
        res.status(200).json({ message: `Equipo con ID ${id} eliminado exitosamente.` });

    } catch (error) {
        if (error.message.includes('REFERENTIAL_INTEGRITY')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Obtiene componentes disponibles.
 */
const getEquiposDisponiblesParaComponentes = async (req, res, next) => {
    try {
        const components = await EquipoService.getAvailableComponents();
        res.status(200).json(components);
    } catch (error) {
        logger.error(`Error en getEquiposDisponiblesParaComponentes: ${error.message}`);
        next(error);
    }
};

module.exports = {
    getAllEquipos,
    getEquipoById,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    getEquiposDisponiblesParaComponentes
};