const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Filtro de archivos.
 * Permitimos: Imágenes (jpg, png, webp) y Documentos (pdf, txt, log).
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|pdf|txt|plain/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }

  cb(new Error('Formato de archivo no soportado. (Solo imágenes y PDFs/TXT)'));
};

/**
 * Almacenamiento Dinámico.
 * Organiza los archivos en 'server/storage/tickets/{ticketId}/'.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Si la request viene con un parámetro :id (tickets/:id/...)
    let ticketId = req.params.id || 'temp';

    const uploadPath = path.join(__dirname, '../../storage/tickets', String(ticketId));

    // Crear carpeta recursivamente si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
