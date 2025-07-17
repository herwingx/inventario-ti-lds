# 🛠️ Inventario Soporte - Guía de Desarrollo

Guía completa para desarrolladores que trabajen en el sistema de **Inventario Soporte**.

## 📋 Tabla de Contenidos

- [🚀 Configuración del Entorno](#-configuración-del-entorno)
- [🏗️ Arquitectura del Código](#️-arquitectura-del-código)
- [📝 Estándares de Código](#-estándares-de-código)
- [🔧 Flujo de Desarrollo](#-flujo-de-desarrollo)
- [🧪 Testing](#-testing)
- [📊 Base de Datos](#-base-de-datos)
- [🔐 Autenticación](#-autenticación)
- [🚨 Debugging](#-debugging)

## 🚀 Configuración del Entorno

### **Prerrequisitos**
- Node.js 18+
- Docker y Docker Compose
- Git
- Editor de código (VS Code recomendado)

### **Configuración Inicial**
```bash
# 1. Clonar repositorio
git clone <url-del-repositorio>
cd inventario_soporte

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp docker/.env.example docker/.env
# Editar docker/.env con tu configuración

# ⚠️ IMPORTANTE: Generar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copiar el resultado al archivo docker/.env

# 4. Iniciar con Docker
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh start
./scripts/docker-dev.sh seed

# 🔥 MODO DESARROLLO (Recomendado)
# Para desarrollo activo con recarga automática:
./scripts/docker-dev.sh dev
```

### **Extensiones VS Code Recomendadas**
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

## 🏗️ Arquitectura del Código

### **Estructura MVC**
```
src/
├── controllers/          # Lógica de negocio
│   ├── auth.controller.js
│   ├── empresas.controller.js
│   ├── equipos.controller.js
│   └── ...
├── routes/              # Definición de rutas
│   ├── auth.routes.js
│   ├── empresas.routes.js
│   └── ...
├── middleware/          # Middleware personalizado
│   ├── auth.middleware.js
│   └── validation.middleware.js
├── config/             # Configuraciones
│   ├── db.js
│   └── jwt.js
└── database/           # Schema y migraciones
    └── db_soporte.sql
```

### **Patrón de Controladores**
```javascript
// Ejemplo: src/controllers/empresas.controller.js
const { pool } = require('../config/db');

const empresasController = {
    // GET /api/empresas
    getAll: async (req, res) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM empresas WHERE id_status = 1'
            );
            res.json(rows);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },

    // POST /api/empresas
    create: async (req, res) => {
        // Implementación...
    }
};

module.exports = empresasController;
```

### **Patrón de Rutas**
```javascript
// Ejemplo: src/routes/empresas.routes.js
const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresas.controller');

router.get('/', empresasController.getAll);
router.post('/', empresasController.create);
router.get('/:id', empresasController.getById);
router.put('/:id', empresasController.update);
router.delete('/:id', empresasController.delete);

module.exports = router;
```

## 📝 Estándares de Código

### **Convenciones de Nomenclatura**

**Variables y Funciones:**
```javascript
// ✅ Correcto - camelCase
const nombreUsuario = 'juan';
const obtenerEmpresas = () => {};

// ❌ Incorrecto
const nombre_usuario = 'juan';
const ObtenerEmpresas = () => {};
```

**Constantes:**
```javascript
// ✅ Correcto - UPPER_SNAKE_CASE
const MAX_INTENTOS_LOGIN = 3;
const JWT_SECRET_KEY = process.env.JWT_SECRET;
```

**Archivos:**
```javascript
// ✅ Correcto - kebab-case
empresas.controller.js
auth.middleware.js
tipos-equipo.routes.js
```

### **Comentarios**
```javascript
// * Comentarios informativos con asterisco
// ! Comentarios de advertencia con exclamación
// ? Comentarios de pregunta/duda
// TODO: Tareas pendientes

/**
 * Función para obtener todas las empresas activas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise} Lista de empresas
 */
const obtenerEmpresas = async (req, res) => {
    // * Consulta solo empresas activas (status = 1)
    const [rows] = await pool.execute(
        'SELECT * FROM empresas WHERE id_status = 1'
    );
    
    // ! Verificar que existan resultados antes de enviar
    if (rows.length === 0) {
        return res.status(404).json({ message: 'No se encontraron empresas' });
    }
    
    res.json(rows);
};
```

### **Manejo de Errores**
```javascript
// ✅ Patrón estándar para controladores
const controllerFunction = async (req, res) => {
    try {
        // Lógica del controlador
        const result = await someAsyncOperation();
        res.json(result);
    } catch (error) {
        console.error('Error en controllerFunction:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
```

### **Validación de Datos**
```javascript
// Ejemplo de validación básica
const validarEmpresa = (req, res, next) => {
    const { nombre } = req.body;
    
    if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El nombre de la empresa es requerido' 
        });
    }
    
    if (nombre.length > 100) {
        return res.status(400).json({ 
            message: 'El nombre no puede exceder 100 caracteres' 
        });
    }
    
    next();
};
```

## 🔧 Flujo de Desarrollo

### **🔥 Desarrollo con Recarga Automática (Recomendado)**

El proyecto está configurado para desarrollo óptimo con **recarga automática**:

```bash
# 1. Crear rama para la funcionalidad
git checkout -b feature/nueva-funcionalidad

# 2. Iniciar en modo desarrollo
./scripts/docker-dev.sh dev

# 3. ¡Desarrollar! Los cambios se reflejan automáticamente
# - Edita cualquier archivo .js
# - Nodemon detecta cambios y reinicia automáticamente
# - No necesitas rebuild ni restart manual
```

**✅ Ventajas del modo desarrollo:**
- **Cambios instantáneos**: Edita código y ve resultados inmediatamente
- **Sin rebuilds**: Los archivos se montan como volúmenes
- **Logs en vivo**: Ve todos los logs en tiempo real
- **Desarrollo rápido**: Ciclo de desarrollo ultra-rápido

**🔧 Comandos de desarrollo:**
```bash
# Modo desarrollo (recomendado para desarrollo activo)
./scripts/docker-dev.sh dev

# Modo background (para desarrollo en segundo plano)
./scripts/docker-dev.sh start

# Ver logs en tiempo real
./scripts/docker-dev.sh logs-app

# Reiniciar solo si cambias dependencias
./scripts/docker-dev.sh rebuild
```

### **📝 Cuándo usar cada comando:**

| Comando | Cuándo usar | Recarga automática |
|---------|-------------|-------------------|
| `dev` | Desarrollo activo | ✅ Sí |
| `start` | Desarrollo en background | ✅ Sí |
| `restart` | Cambios de configuración | ✅ Sí |
| `rebuild` | Cambios en package.json | ❌ No |

### **1. Crear Nueva Funcionalidad**
```bash
# 1. Crear rama para la funcionalidad
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar usando modo dev
./scripts/docker-dev.sh dev

# 3. Hacer cambios y probar
# Los cambios se reflejan automáticamente
# Solo usa rebuild si cambias dependencias
```

### **2. Agregar Nueva Entidad**

**Paso 1: Crear Controlador**
```javascript
// src/controllers/nueva-entidad.controller.js
const { pool } = require('../config/db');

const nuevaEntidadController = {
    getAll: async (req, res) => {
        // Implementación
    },
    
    create: async (req, res) => {
        // Implementación
    }
    // ... más métodos
};

module.exports = nuevaEntidadController;
```

**Paso 2: Crear Rutas**
```javascript
// src/routes/nueva-entidad.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/nueva-entidad.controller');

router.get('/', controller.getAll);
router.post('/', controller.create);

module.exports = router;
```

**Paso 3: Registrar en server.js**
```javascript
// server.js
const nuevaEntidadRoutes = require('./src/routes/nueva-entidad.routes');
app.use('/api/nueva-entidad', nuevaEntidadRoutes);
```

### **3. Modificar Base de Datos**
```sql
-- Agregar nueva tabla en src/database/db_soporte.sql
CREATE TABLE `nueva_tabla` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `id_status` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_nueva_tabla_status`
    FOREIGN KEY (`id_status`)
    REFERENCES `status` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;
```

## 🧪 Testing

### **Testing Manual**
```bash
# 1. Probar endpoints con curl
curl -X GET http://localhost/soporte/api/empresas

# 2. Probar autenticación
curl -X POST http://localhost/soporte/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"linea","password":"digital"}'

# 3. Usar token en requests
curl -X GET http://localhost/soporte/api/equipos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Testing con Postman**
```json
{
  "name": "Inventario Soporte API",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "{{base_url}}/api/auth/login",
      "body": {
        "username": "linea",
        "password": "digital"
      }
    }
  ],
  "variables": [
    {
      "key": "base_url",
      "value": "http://localhost/soporte"
    }
  ]
}
```

## 📊 Base de Datos

### **Conexión**
```javascript
// src/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { pool };
```

### **Consultas Comunes**
```javascript
// Consulta simple
const [rows] = await pool.execute('SELECT * FROM empresas');

// Consulta con parámetros
const [rows] = await pool.execute(
    'SELECT * FROM empresas WHERE id = ?', 
    [empresaId]
);

// Inserción
const [result] = await pool.execute(
    'INSERT INTO empresas (nombre, id_status) VALUES (?, ?)',
    [nombre, 1]
);

// Actualización
const [result] = await pool.execute(
    'UPDATE empresas SET nombre = ? WHERE id = ?',
    [nuevoNombre, empresaId]
);
```

### **Transacciones**
```javascript
const connection = await pool.getConnection();
try {
    await connection.beginTransaction();
    
    // Operaciones de base de datos
    await connection.execute('INSERT INTO ...');
    await connection.execute('UPDATE ...');
    
    await connection.commit();
} catch (error) {
    await connection.rollback();
    throw error;
} finally {
    connection.release();
}
```

## 🔐 Autenticación

### **Middleware de Autenticación**
```javascript
// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = { protect };
```

### **Generar Token**
```javascript
// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            id_rol: user.id_rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};
```

## 🚨 Debugging

### **Logs de Desarrollo**
```javascript
// Usar console.log con prefijos descriptivos
console.log('🔍 DEBUG - Variable:', variable);
console.log('✅ SUCCESS - Operación completada');
console.log('❌ ERROR - Algo salió mal:', error);
console.log('⚠️  WARNING - Advertencia:', mensaje);
```

### **Debugging con Docker**
```bash
# Ver logs en tiempo real
./scripts/docker-dev.sh logs-app

# Entrar al contenedor para debugging
./scripts/docker-dev.sh shell-app

# Verificar variables de entorno
./scripts/docker-dev.sh shell-app
printenv | grep DB_

# Verificar conectividad a base de datos
./scripts/docker-dev.sh shell-app
node -e "require('./src/config/db').pool.execute('SELECT 1').then(console.log)"
```

### **Debugging de Base de Datos**
```bash
# Conectar a MySQL
./scripts/docker-dev.sh shell-db
mysql -u herwingxtech -p'herwingx-dev' inventario_soporte

# Consultas útiles
SHOW TABLES;
DESCRIBE empresas;
SELECT COUNT(*) FROM usuarios_sistema;
```

## 🔄 Flujo de Commits

### **Convención de Commits**
```bash
# Formato: tipo(scope): descripción
git commit -m "feat(empresas): agregar endpoint para crear empresa"
git commit -m "fix(auth): corregir validación de token JWT"
git commit -m "docs(readme): actualizar guía de instalación"
git commit -m "refactor(controllers): simplificar manejo de errores"
```

### **Tipos de Commits**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Cambios de formato
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

---

## 🔐 Seguridad de Variables de Entorno

### **JWT_SECRET - Configuración Segura**

**❌ NUNCA hacer esto:**
```env
# En .env.example (MAL)
JWT_SECRET=mi_secreto_hardcodeado
```

**✅ Configuración correcta:**
```env
# En .env.example (BIEN)
JWT_SECRET=
# O con instrucciones
JWT_SECRET=# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Generar JWT_SECRET Seguro**

**Opción 1: Node.js (Recomendado)**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opción 2: OpenSSL**
```bash
openssl rand -hex 64
```

**Opción 3: Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

### **Ejemplo de .env Completo**
```env
# 🔧 CONFIGURACIÓN PRINCIPAL
APP_URL=http://192.168.0.253/soporte
API_URL=http://192.168.0.253/soporte/api
PORT=3000
NODE_ENV=development

# 🗄️ BASE DE DATOS
DB_HOST=inventario-db
DB_USER=herwingxtech
DB_PASSWORD=herwingx-dev
DB_NAME=inventario_soporte
DB_PORT=3306

# 🔐 JWT (GENERAR SECRETO ÚNICO)
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef123456
JWT_EXPIRE=24h

# 🐳 MYSQL DOCKER
MYSQL_ROOT_PASSWORD=herwingx-dev
MYSQL_DATABASE=inventario_soporte
MYSQL_USER=herwingxtech
MYSQL_PASSWORD=herwingx-dev
```

### **Verificar JWT_SECRET**
```javascript
// Verificar que el secreto sea lo suficientemente largo
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET debe tener al menos 32 caracteres');
    process.exit(1);
}
```

---

## 🎯 Mejores Prácticas

### **Seguridad**
- ✅ **JWT_SECRET único** para cada entorno
- ✅ **Nunca commitear** secretos reales al repositorio
- ✅ Siempre validar entrada de usuario
- ✅ Usar parámetros preparados en SQL
- ✅ Verificar autenticación en rutas protegidas
- ✅ No exponer información sensible en logs

### **Performance**
- ✅ Usar índices en consultas de base de datos
- ✅ Implementar paginación en listados grandes
- ✅ Cerrar conexiones de base de datos
- ✅ Optimizar consultas SQL

### **Mantenibilidad**
- ✅ Código autodocumentado con nombres descriptivos
- ✅ Funciones pequeñas y específicas
- ✅ Separación de responsabilidades
- ✅ Comentarios en lógica compleja

---

¡Listo para desarrollar! 🚀 Usa `./scripts/docker-dev.sh start` para comenzar.