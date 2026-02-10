/**
 * @fileoverview Punto de entrada principal del servidor Express.
 * Configura middleware, rutas, conexión a BD y manejo de errores.
 */
// ! Archivo principal del servidor Express para el sistema de inventario
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env') }); // * Cargo las variables de entorno desde .env
const validateEnv = require('./src/utils/validateEnv');
validateEnv();

const prisma = require('./src/config/prisma'); // * Importo Prisma Client configurado
const statusRoutes = require('./src/routes/status.routes'); // * Rutas para el estado del sistema
const empresasRoutes = require('./src/routes/empresas.routes'); // * Rutas para empresas
const sucursalesRoutes = require('./src/routes/sucursales.routes'); // * Rutas para sucursales
const areasRoutes = require('./src/routes/areas.routes'); // * Rutas para áreas
const tiposSucursalRoutes = require('./src/routes/tipos_sucursal.routes'); // * Rutas para tipos de sucursal
const tiposEquipoRoutes = require('./src/routes/tipos_equipo.routes'); // * Rutas para tipos de equipo
const empleadosRoutes = require('./src/routes/empleados.routes'); // * Rutas para empleados
const direccionesIpRoutes = require('./src/routes/direcciones_ip.routes'); // * Rutas para direcciones IP
const equiposRoutes = require('./src/routes/equipos.routes'); // * Rutas para equipos
const rolesRoutes = require('./src/routes/roles.routes'); // * Rutas para roles
const usuariosSistemaRoutes = require('./src/routes/usuarios_sistema.routes'); // * Rutas para usuarios del sistema
const cuentasEmailRoutes = require('./src/routes/cuentas_email.routes'); // * Rutas para cuentas de email
const mantenimientosRoutes = require('./src/routes/mantenimientos.routes'); // * Rutas para mantenimientos
const notasRoutes = require('./src/routes/notas.routes'); // * Rutas para notas
const asignacionesRoutes = require('./src/routes/asignaciones.routes'); // * Rutas para asignaciones
const authRoutes = require('./src/routes/auth.routes'); // * Rutas de autenticación
const profileRoutes = require('./src/routes/profile.routes'); // * Rutas de perfil de usuario
const dashboardRoutes = require('./src/routes/dashboard.routes'); // * Rutas de dashboard
const ticketsRoutes = require('./src/routes/tickets.routes'); // * Rutas de tickets de soporte (Fase 2)
const qrPublicRoutes = require('./src/routes/qr-public.routes'); // * Rutas públicas QR (Fase 2)
const { protect } = require('./src/middleware/auth.middleware'); // * Middleware de protección JWT
const { auditMiddleware } = require('./src/middleware/audit.middleware'); // * Middleware de auditoría (Fase 2)
const { initCronJobs } = require('./src/config/cron.config'); // * Tareas programadas (Fase 2)

const app = express();
const port = process.env.PORT || 3000; // * Puerto del servidor (por defecto 3000 si no hay .env)

// * Middleware de seguridad Helmet
app.use(helmet());

// * Middleware de CORS
app.use(cors({
  origin: 'http://localhost:5173', // Permitir el frontend de Vue
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// * Rate Limiting (Protección contra DoS y Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Limite de 500 peticiones por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos.' }
});
app.use('/api', limiter);

// * Logger de peticiones HTTP
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});


// * Middleware para manejar el prefijo /soporte y /soporte/ en producción
app.use((req, res, next) => {
  // Si la URL comienza exactamente con /soporte (sin slash), redirigir a /soporte/
  if (req.url === '/soporte') {
    return res.redirect(301, '/soporte/');
  }

  // Si la URL comienza con /soporte/, la procesamos removiendo el prefijo
  if (req.url.startsWith('/soporte/')) {
    req.url = req.url.replace('/soporte', '');
    // Si queda solo /, lo convertimos a /
    if (req.url === '') {
      req.url = '/';
    }
  }
  next();
});

// * Configuración de MIME types para archivos estáticos
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  } else if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.url.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
  }
  next();
});

// * Middleware para servir archivos estáticos desde la carpeta 'public'.
// * Todo lo que esté en 'public' se puede acceder directamente por URL.
app.use(express.static('public', {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
  }
}));

// * Servir archivos subidos (evidencias, tickets) - Fase 2
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// * Middleware para parsear JSON en las peticiones (body-parser integrado)
app.use(express.json());
// * Middleware para parsear datos de formularios (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// ? Ruta de prueba para verificar conexión a la base de datos
app.get('/db-test', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 + 1 AS solution`;
    res.json({
      message: 'Conexión a base de datos exitosa!',
      solution: result[0].solution
    });
  } catch (error) {
    logger.error('Error al conectar o consultar la base de datos:', error);
    res.status(500).json({
      message: 'Error al conectar a la base de datos.',
      error: error.message
    });
  }
});

// * Rutas de Autenticación (Públicas - NO protegidas por el middleware `protect`)
// * El login debe ser accesible sin un token.
app.use('/api/auth', authRoutes);

// * Rutas Públicas QR (Fase 2) - Acceso sin autenticación para escaneo de equipos
// ! Estas rutas permiten a usuarios externos reportar fallas y dar seguimiento
app.use('/q', qrPublicRoutes);

// * Middleware de Protección JWT
// ! Todas las rutas definidas DESPUÉS de esta línea requerirán un token JWT válido.
// ! Aplico el middleware a todas las rutas que comiencen con /api.
app.use('/api', protect);

// * Middleware de Auditoría (Fase 2)
// * Registra operaciones de escritura (POST/PUT/DELETE) en logs_sistema
// app.use('/api', auditMiddleware); // Deshabilitado temporalmente para pruebas de timeout
// TODO: Aquí se montan las rutas principales de la API
// * Cada entidad tiene su propio archivo de rutas
// * (Se reiniciará el servidor automáticamente si se usa nodemon)
app.use('/api/status', statusRoutes); // * Estado
app.use('/api/empresas', empresasRoutes); // * Empresas
app.use('/api/sucursales', sucursalesRoutes); // * Sucursales
app.use('/api/areas', areasRoutes); // * Áreas
app.use('/api/tipos-sucursal', tiposSucursalRoutes); // * Tipos de sucursal
app.use('/api/tipos-equipo', tiposEquipoRoutes); // * Tipos de equipo
app.use('/api/empleados', empleadosRoutes); // * Empleados
app.use('/api/direcciones-ip', direccionesIpRoutes); // * Direcciones IP
app.use('/api/equipos', equiposRoutes); // * Equipos
app.use('/api/roles', rolesRoutes); // * Roles
app.use('/api/usuarios-sistema', usuariosSistemaRoutes); // * Usuarios del sistema
app.use('/api/cuentas-email', cuentasEmailRoutes); // * Cuentas de email
app.use('/api/mantenimientos', mantenimientosRoutes); // * Mantenimientos
app.use('/api/notas/', notasRoutes); // * Notas
app.use('/api/asignaciones/', asignacionesRoutes); // * Asignaciones
app.use('/api/profile', profileRoutes); // * Perfil de usuario
app.use('/api/dashboard', dashboardRoutes); // * Dashboard y estadísticas generales
app.use('/api/tickets', ticketsRoutes); // * Tickets de soporte (Fase 2)

// ? Middleware para rutas limpias de SPA: sirve index.html para cualquier ruta que no sea API ni archivo estático
app.get(/^\/(?!api\/|.*\..*$).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ! Middleware global para manejo de errores
// * Si ocurre un error en cualquier parte, cae aquí
app.use((err, req, res, next) => {
  logger.error('-------- ERROR CAPTURADO POR MIDDLEWARE GLOBAL --------');
  logger.error(err.stack);
  logger.error('-----------------------------------------------------');

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    message: err.message || 'Ocurrió un error interno en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// ! Inicio del servidor
app.listen(port, '0.0.0.0', () => {
  logger.info(`🚀 Servidor corriendo en: http://localhost:${port}`);
  logger.info(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);

  // * Pruebo la conexión de Prisma al arrancar
  prisma.$connect()
    .then(() => {
      logger.info('✅ Base de datos (Prisma) conectada exitosamente.');
      // * Inicializar tareas programadas (Fase 2)
      initCronJobs();
    })
    .catch(err => {
      // ! Si falla la conexión inicial, aviso por consola
      logger.error('❌ Error al conectar a la base de datos con Prisma:', err.message);
      logger.error('   Verifica que las credenciales en .env sean correctas.');
    });
});
