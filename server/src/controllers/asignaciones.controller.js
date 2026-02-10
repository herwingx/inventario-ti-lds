/**
 * @module Controllers/Asignaciones
 * @description Controlador para la gestión de asignaciones.
 */
const AsignacionService = require('../services/asignaciones.service');
const { createAsignacionSchema, updateAsignacionSchema } = require('../schemas/asignacion.schema');
const logger = require('../utils/logger');
const { generateResponsiva } = require('../utils/pdfGenerator');

const getAllAsignaciones = async (req, res) => {
    const asignaciones = await AsignacionService.findAll(req.query);
    res.status(200).json(asignaciones);
};

/**
 * Genera o entrega el PDF de la Carta Responsiva.
 */
const getResponsivaPDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const asignacionData = await AsignacionService.findById(id);
        
        if (!asignacionData) {
            return res.status(404).json({ message: 'Asignación no encontrada.' });
        }

        // 1. Si ya existe un PDF firmado, entregarlo directamente
        if (asignacionData.url_responsiva_pdf) {
            const filePath = path.join(__dirname, '../../storage/responsivas', asignacionData.url_responsiva_pdf);
            
            if (fs.existsSync(filePath)) {
                logger.info(`Entregando PDF firmado existente para Asignación ID ${id}`);
                return res.download(filePath, asignacionData.url_responsiva_pdf);
            }
            logger.warn(`El registro indica que existe un PDF (${asignacionData.url_responsiva_pdf}) pero el archivo físico no se encontró.`);
        }

        // 2. Si no existe o no se encontró el archivo, generar un borrador al vuelo
        logger.info(`Generando borrador de PDF para Asignación ID ${id}`);
        const data = await AsignacionService.getDetailsForPDF(id);
        const pdfDoc = await generateResponsiva(data);

        const filename = `BORRADOR_Responsiva_${id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${filename}`);

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        logger.error(`Error procesando PDF: ${error.message}`);
        next(error);
    }
};

const fs = require('fs');
const path = require('path');

/**
 * Procesa la firma digital y genera el PDF final almacenado.
 */
const signAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firma } = req.body; // Imagen en Base64

        if (!firma) {
            return res.status(400).json({ message: 'La firma es obligatoria.' });
        }

        // 1. Obtener datos detallados
        const data = await AsignacionService.getDetailsForPDF(id);
        if (!data) return res.status(404).json({ message: 'Asignación no encontrada.' });

        // 2. Procesar y guardar la imagen de la firma
        const signatureFileName = `firma_${id}_${Date.now()}.png`;
        const signaturePath = path.join(__dirname, '../../storage/firmas', signatureFileName);
        
        const base64Data = firma.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(signaturePath, base64Data, 'base64');

        // 3. Generar el PDF con la firma incrustada
        // Pasamos la ruta de la firma a la data para el generador
        const pdfData = { ...data, signaturePath };
        const pdfDoc = await generateResponsiva(pdfData);

        // 4. Guardar el PDF en almacenamiento privado
        const pdfFileName = `Responsiva_Firmada_${id}.pdf`;
        const pdfFilePath = path.join(__dirname, '../../storage/responsivas', pdfFileName);
        
        const writeStream = fs.createWriteStream(pdfFilePath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        // Esperar a que el stream termine de escribir
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // 5. Actualizar Base de Datos con Prisma
        await AsignacionService.update(id, {
            firma_receptor: signatureFileName,
            url_responsiva_pdf: pdfFileName
        });

        res.status(200).json({ 
            message: 'Documento firmado y almacenado con éxito.',
            pdfUrl: pdfFileName
        });

    } catch (error) {
        logger.error(`Error en proceso de firma: ${error.message}`);
        next(error);
    }
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
    getResponsivaPDF,
    signAssignment,
    createAsignacion,
    updateAsignacion,
    deleteAsignacion,
    createAsignacionConComponentes: createAsignacion,
    getComponentesAsignacion,
    updateComponentesAsignacion
};