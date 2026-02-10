/**
 * @module Controllers/Asignaciones
 * @description Controlador para la gestión de asignaciones.
 */
const AsignacionService = require('../services/asignaciones.service');
const { createAsignacionSchema, updateAsignacionSchema } = require('../schemas/asignacion.schema');
const logger = require('../utils/logger');

const getAllAsignaciones = async (req, res) => {
    const asignaciones = await AsignacionService.findAll(req.query);
    res.status(200).json(asignaciones);
};

const getAsignacionById = async (req, res) => {
    const { id } = req.params;
    const asignacion = await AsignacionService.findById(id);

    if (!asignacion) {
        return res.status(404).json({ message: `Asignación con ID ${id} no encontrada.` });
    }

    res.status(200).json(asignacion);
};

const createAsignacion = async (req, res) => {
    const validation = createAsignacionSchema.parse({ body: req.body });

    try {
        const newAsignacion = await AsignacionService.create(validation.body);
        logger.info(`Asignación creada: ID ${newAsignacion.id} para Equipo ${newAsignacion.id_equipo}`);
        res.status(201).json({
            message: 'Asignación creada y estados actualizados.',
            id: newAsignacion.id
        });
    } catch (error) {
        if (error.message.includes('CONFLICT')) {
            return res.status(409).json({ message: error.message });
        }
        throw error;
    }
};

const updateAsignacion = async (req, res) => {
    const validation = updateAsignacionSchema.parse({ params: req.params, body: req.body });

    try {
        const updated = await AsignacionService.update(validation.params.id, validation.body);
        if (!updated) {
            return res.status(404).json({ message: `Asignación con ID ${validation.params.id} no encontrada.` });
        }
        logger.info(`Asignación ID ${validation.params.id} actualizada.`);
        res.status(200).json({ message: 'Asignación actualizada exitosamente' });
    } catch (error) {
        if (error.message.includes('CONFLICT')) {
            return res.status(409).json({ message: error.message });
        }
        throw error;
    }
};

const deleteAsignacion = async (req, res) => {
    const { id } = req.params;
    const deleted = await AsignacionService.delete(id);
    if (!deleted) {
        return res.status(404).json({ message: `Asignación con ID ${id} no encontrada.` });
    }

    logger.info(`Asignación ID ${id} eliminada.`);
    res.status(200).json({ message: 'Asignación eliminada exitosamente' });
};

const getComponentesAsignacion = async (req, res) => {
    const { id } = req.params;
    const componentes = await AsignacionService.getComponentes(id);
    if (!componentes) return res.status(404).json({ message: 'Asignación no encontrada' });
    res.status(200).json(componentes);
};

const updateComponentesAsignacion = async (req, res) => {
    const { id } = req.params;
    try {
        await AsignacionService.updateComponentes(id, req.body.componentes || []);
        logger.info(`Componentes actualizados para Asignación ID ${id}.`);
        res.status(200).json({ message: 'Componentes actualizados exitosamente' });
    } catch (error) {
        if (error.message.includes('NOT_FOUND')) {
            return res.status(404).json({ message: error.message });
        }
        throw error;
    }
};

module.exports = {
    getAllAsignaciones,
    getAsignacionById,
    createAsignacion,
    updateAsignacion,
    deleteAsignacion,
    createAsignacionConComponentes: createAsignacion,
    getComponentesAsignacion,
    updateComponentesAsignacion
};