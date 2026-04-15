/**
 * @fileoverview Main entry point for the Express server.
 * Professional implementation with security best practices and centralized error handling.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const logger = require('./src/utils/logger');
const validateEnv = require('./src/utils/validateEnv');
const prisma = require('./src/config/prisma');
const errorHandler = require('./src/middleware/error.middleware');
const { protect, enforceReadOnlySupervisor } = require('./src/middleware/auth.middleware');
const { initCronJobs } = require('./src/config/cron.config');

// Route Imports
const authRoutes = require('./src/routes/auth.routes');
const statusRoutes = require('./src/routes/status.routes');
const empresasRoutes = require('./src/routes/empresas.routes');
const sucursalesRoutes = require('./src/routes/sucursales.routes');
const areasRoutes = require('./src/routes/areas.routes');
const tiposSucursalRoutes = require('./src/routes/tipos_sucursal.routes');
const tiposEquipoRoutes = require('./src/routes/tipos_equipo.routes');
const empleadosRoutes = require('./src/routes/empleados.routes');
const direccionesIpRoutes = require('./src/routes/direcciones_ip.routes');
const equiposRoutes = require('./src/routes/equipos.routes');
const rolesRoutes = require('./src/routes/roles.routes');
const usuariosSistemaRoutes = require('./src/routes/usuarios_sistema.routes');
const cuentasEmailRoutes = require('./src/routes/cuentas_email.routes');
const mantenimientosRoutes = require('./src/routes/mantenimientos.routes');
const notasRoutes = require('./src/routes/notas.routes');
const asignacionesRoutes = require('./src/routes/asignaciones.routes');
const profileRoutes = require('./src/routes/profile.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const ticketsRoutes = require('./src/routes/tickets.routes');
const qrPublicRoutes = require('./src/routes/qr-public.routes');

// Initialize validation
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const ENABLE_HTTPS_UPGRADE = process.env.ENABLE_HTTPS_UPGRADE === 'true';
const ENABLE_ISOLATION_HEADERS = process.env.ENABLE_ISOLATION_HEADERS === 'true';

// --- SECURITY MIDDLEWARE ---

// Helmet for security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: ENABLE_ISOLATION_HEADERS ? { policy: 'same-origin' } : false,
    originAgentCluster: ENABLE_ISOLATION_HEADERS,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'upgrade-insecure-requests': (IS_PROD && ENABLE_HTTPS_UPGRADE) ? [] : null,
        },
    },
}));

// En entornos HTTP (LAN/IP), evita forzar HTTPS y headers de aislamiento
// que generan advertencias o bloqueos en navegadores sin TLS.
app.use((req, res, next) => {
    if (!ENABLE_HTTPS_UPGRADE) {
        const cspHeader = res.getHeader('Content-Security-Policy');
        if (typeof cspHeader === 'string') {
            const sanitizedCsp = cspHeader
                .replace(/;\s*upgrade-insecure-requests\s*;?/i, '; ')
                .replace(/\s{2,}/g, ' ')
                .replace(/;\s*$/, '')
                .trim();
            res.setHeader('Content-Security-Policy', sanitizedCsp);
        }
    }

    if (!ENABLE_ISOLATION_HEADERS) {
        res.removeHeader('Cross-Origin-Opener-Policy');
        res.removeHeader('Origin-Agent-Cluster');
    }

    next();
});

// CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas peticiones. Intente más tarde.' }
});
app.use('/api', globalLimiter);

// --- REQUEST LOGGING & PARSING ---

app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- STATIC FILES & SPA LOGIC ---

const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
const legacyPublicPath = path.join(__dirname, 'public');
const staticPath = fs.existsSync(clientDistPath) ? clientDistPath : legacyPublicPath;

// Special handling for /soporte prefix (Legacy support or sub-path routing)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    
    if (req.url === '/soporte') return res.redirect(301, '/soporte/');
    
    if (req.url.startsWith('/soporte/')) {
        req.url = req.url.replace('/soporte/', '/');
        if (req.url === '') req.url = '/';
    }
    next();
});

// Serve public static files
app.use(express.static(staticPath));

// Securely serve storage (Fase 2)
// NOTE: In production, consider protecting these with authentication middleware
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// --- SWAGGER DOCUMENTATION ---

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Inventario TI & Soporte LDS',
            version: '1.1.0',
            description: 'Documentación interactiva de la API.',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- API ROUTES ---

// Database Health Check
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'UP', database: 'CONNECTED' });
    } catch (error) {
        logger.error('Health Check Failed:', error);
        res.status(503).json({ status: 'DOWN', database: 'DISCONNECTED' });
    }
});

// Authentication (Public)
app.use('/api/auth', authRoutes);

// Public QR Service (Public but Rate Limited)
const qrLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: { message: 'Límite de peticiones QR excedido.' }
});
app.use('/api/q', qrLimiter, qrPublicRoutes);

// Protected API Routes
app.use('/api', protect); // Authorization middleware
app.use('/api', enforceReadOnlySupervisor); // Analista (rol 3) en modo solo lectura

app.use('/api/status', statusRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/tipos-sucursal', tiposSucursalRoutes);
app.use('/api/tipos-equipo', tiposEquipoRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/direcciones-ip', direccionesIpRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios-sistema', usuariosSistemaRoutes);
app.use('/api/cuentas-email', cuentasEmailRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tickets', ticketsRoutes);

// --- SPA FALLBACK ---

app.get(/^\/(?!api\/|.*\..*$).*/, (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// --- ERROR HANDLING ---

app.use(errorHandler);

// --- BOOTSTRAP ---

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected successfully.');
        
        initCronJobs();
        
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        logger.error('❌ Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
