/**
 * @module Controllers/Asignaciones
 * @description Controlador para la gestión de asignaciones de activos.
 * Implementa generación de PDFs y firmas digitales.
 */
const fs = require('fs');
const path = require('path');
const AsignacionService = require('../services/asignaciones.service');
const { createAsignacionSchema, updateAsignacionSchema } = require('../schemas/asignacion.schema');
const logger = require('../utils/logger');
const { generateResponsiva } = require('../utils/pdfGenerator');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las asignaciones con filtros opcionales.
 * @route GET /api/asignaciones
 */
const getAllAsignaciones = asyncHandler(async (req, res) => {
    const asignaciones = await AsignacionService.findAll(req.query);
    res.status(200).json(asignaciones);
});

/**
 * Obtiene una asignación por ID.
 * @route GET /api/asignaciones/:id
 */
const getAsignacionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const asignacion = await AsignacionService.findById(id);

    if (!asignacion) {
        const error = new Error(`Asignación con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(asignacion);
});

/**
 * Crea una nueva asignación.
 * @route POST /api/asignaciones
 */
const createAsignacion = asyncHandler(async (req, res) => {
    const validation = createAsignacionSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de asignación inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const newAsignacion = await AsignacionService.create(validation.data.body);
    logger.info(`Asignación creada: ID ${newAsignacion.id} para Equipo ${newAsignacion.id_equipo}`);
    
    res.status(201).json({
        status: 'success',
        message: 'Asignación creada y estados actualizados.',
        data: { id: newAsignacion.id }
    });
});

/**
 * Actualiza una asignación existente.
 * @route PUT /api/asignaciones/:id
 */
const updateAsignacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateAsignacionSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await AsignacionService.update(id, validation.data.body);
    
    if (!updated) {
        const error = new Error(`Asignación con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }
    
    logger.info(`Asignación ID ${id} actualizada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Asignación actualizada exitosamente' 
    });
});

/**
 * Elimina una asignación.
 * @route DELETE /api/asignaciones/:id
 */
const deleteAsignacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await AsignacionService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Asignación con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Asignación ID ${id} eliminada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Asignación eliminada exitosamente' 
    });
});

/**
 * Genera o entrega el PDF de la Carta Responsiva.
 * @route GET /api/asignaciones/:id/pdf
 */
const getResponsivaPDF = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const asignacionData = await AsignacionService.findById(id);
    
    if (!asignacionData) {
        const error = new Error('Asignación no encontrada.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // 1. Si ya existe un PDF firmado, entregarlo directamente
    if (asignacionData.url_responsiva_pdf) {
        const filePath = path.join(__dirname, '../../storage/responsivas', asignacionData.url_responsiva_pdf);
        
        if (fs.existsSync(filePath)) {
            logger.info(`Entregando PDF firmado existente para Asignación ID ${id}`);
            return res.download(filePath, asignacionData.url_responsiva_pdf);
        }
        logger.warn(`El registro indica PDF (${asignacionData.url_responsiva_pdf}) pero no existe en disco.`);
    }

    // 2. Generar borrador al vuelo
    logger.info(`Generando borrador de PDF para Asignación ID ${id}`);
    const data = await AsignacionService.getDetailsForPDF(id);
    const pdfDoc = await generateResponsiva(data);

    const filename = `BORRADOR_Responsiva_${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);

    pdfDoc.pipe(res);
    pdfDoc.end();
});

/**
 * Procesa la firma digital y guarda el PDF final.
 * @route POST /api/asignaciones/:id/firmar
 */
const signAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firma } = req.body; // Imagen Base64

    if (!firma) {
        const error = new Error('La firma es obligatoria.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
    }

    // 1. Obtener datos
    const data = await AsignacionService.getDetailsForPDF(id);
    if (!data) {
        const error = new Error('Asignación no encontrada para firmar.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // 2. Guardar imagen firma
    const signatureFileName = `firma_${id}_${Date.now()}.png`;
    const signaturePath = path.join(__dirname, '../../storage/firmas', signatureFileName);
    
    // Asegurar directorio
    const dir = path.dirname(signaturePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const base64Data = firma.replace(/^data:image\/png;base64,/, "");
    await fs.promises.writeFile(signaturePath, base64Data, 'base64');

    // 3. Generar PDF (usar data URL para evitar fallos de resolución de rutas en pdfmake)
    const signatureDataUrl = /^data:image\//.test(firma)
        ? firma
        : `data:image/png;base64,${base64Data}`;

    const pdfData = { ...data, signaturePath, signatureDataUrl };
    const pdfDoc = await generateResponsiva(pdfData);

    // 4. Guardar PDF
    const pdfFileName = `Responsiva_Firmada_${id}.pdf`;
    const pdfFilePath = path.join(__dirname, '../../storage/responsivas', pdfFileName);
    
    // Asegurar directorio PDF
    const pdfDir = path.dirname(pdfFilePath);
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const writeStream = fs.createWriteStream(pdfFilePath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });

    // 5. Actualizar BD
    await AsignacionService.update(id, {
        firma_receptor: signatureFileName,
        url_responsiva_pdf: pdfFileName,
        id_status_asignacion: 2 // Asumimos 2 = Firmado/Entregado, ajustar según lógica de negocio
    });

    res.status(200).json({ 
        status: 'success',
        message: 'Documento firmado y almacenado con éxito.',
        data: { pdfUrl: pdfFileName }
    });
});

/**
 * Obtiene los componentes de una asignación.
 * @route GET /api/asignaciones/:id/componentes
 */
const getComponentesAsignacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const componentes = await AsignacionService.getComponentes(id);
    
    if (!componentes) {
        const error = new Error('Asignación no encontrada.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }
    
    res.status(200).json(componentes);
});

/**
 * Actualiza los componentes de una asignación.
 * @route PUT /api/asignaciones/:id/componentes
 */
const updateComponentesAsignacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { componentes } = req.body; // Array de IDs

    if (!Array.isArray(componentes)) {
         const error = new Error('El campo componentes debe ser un arreglo de IDs.');
         error.statusCode = 400;
         error.isOperational = true;
         throw error;
    }

    await AsignacionService.updateComponentes(id, componentes);
    
    logger.info(`Componentes actualizados para Asignación ID ${id}.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Componentes actualizados exitosamente' 
    });
});

module.exports = {
    getAllAsignaciones,
    getAsignacionById,
    createAsignacion,
    updateAsignacion,
    deleteAsignacion,
    getResponsivaPDF,
    signAssignment,
    createAsignacionConComponentes: createAsignacion, // Alias para compatibilidad si se usa en rutas
    getComponentesAsignacion,
    updateComponentesAsignacion
};
