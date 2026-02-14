/**
 * @module Config/Upload
 * @description Configuración centralizada de Multer para subida de archivos.
 * Soporta evidencias de mantenimiento y tickets.
 */
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs'); // Importar el módulo fs

/**
 * Tipos MIME permitidos para subida de archivos.
 * @type {string[]}
 */
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

/**
 * Tamaño máximo de archivo en bytes (5MB).
 * @type {number}
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Genera configuración de storage para un directorio específico.
 * @param {string} subdir - Subdirectorio dentro de storage (ej: 'evidencias', 'tickets')
 * @returns {multer.StorageEngine}
 */
const createStorage = (subdir) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let finalSubdir = subdir;
      // Si es un ticket, usamos el ID del ticket para crear un subdirectorio
      if (subdir === 'tickets' && req.ticketId) {
        finalSubdir = path.join(subdir, String(req.ticketId));
      } else if (subdir === 'mantenimientos' && req.mantenimientoId) {
        // Ejemplo para mantenimientos, si se necesitara
        finalSubdir = path.join(subdir, String(req.mantenimientoId));
      }

      const uploadPath = path.join(__dirname, '../../storage', finalSubdir);

      // Asegurarse de que el directorio exista
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generar nombre único: uuid + extensión original
      const ext = path.extname(file.originalname).toLowerCase();
      // Asegurarse de que el nombre del archivo sea único para evitar colisiones
      const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      cb(null, uniqueName);
    }
  });
};

/**
 * Filtro de archivos para validar tipo MIME.
 * @param {Express.Request} req
 * @param {Express.Multer.File} file
 * @param {multer.FileFilterCallback} cb
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Formatos aceptados: JPG, PNG, WEBP, PDF`), false);
  }
};

/**
 * Instancia de Multer para evidencias de mantenimiento.
 */
const uploadEvidencias = multer({
  storage: createStorage('evidencias'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

/**
 * Instancia de Multer para evidencias de tickets.
 */
const uploadTickets = multer({
  storage: createStorage('tickets'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

/**
 * Middleware de manejo de errores de Multer.
 * @param {Error} err
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'El archivo excede el tamaño máximo permitido (5MB)'
      });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadEvidencias,
  uploadTickets,
  handleMulterError,
  ALLOWED_MIMES,
  MAX_FILE_SIZE
};
