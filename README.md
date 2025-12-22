# 🖥️ Sistema de Inventario TI - Línea Digital

Sistema de gestión de inventario de equipos de TI desarrollado con Node.js, Express y MySQL.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **MySQL** 5.7 o superior
- **npm** o **yarn**

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventario-ti-lds
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus credenciales:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Cambiar por la IP de tu máquina
APP_URL=http://TU_IP/soporte
API_URL=http://TU_IP/soporte/api
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=TU_IP
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=inventario_soporte
DB_PORT=3306

# JWT (ver sección de generación)
JWT_SECRET=tu_jwt_secret
JWT_EXPIRE=24h
```

---

## 🔐 Generación de JWT Secret

Para generar un token JWT seguro, ejecuta:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Esto generará una cadena hexadecimal de 128 caracteres. Cópiala y pégala en tu archivo `.env` como `JWT_SECRET`.

**Ejemplo de salida:**
```
cab2e4b1ec7560f8ac7cb807fcb9570b1cbebc6f3ff76d56439735b2eb414b4489e29867a007743f8b161f74f25284febc08625a5a5784752d65ce3b4fc95836
```

> ⚠️ **Importante:** Nunca compartas tu JWT_SECRET ni lo subas a Git.

---

## 🗄️ Base de Datos

### Crear backup

```bash
# Backup básico
mysqldump -h TU_IP -u usuario -p inventario_soporte > backup.sql

# Backup con fecha
mysqldump -h TU_IP -u usuario -p inventario_soporte > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
mysqldump -h TU_IP -u usuario -p inventario_soporte | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restaurar backup

```bash
# Desde archivo .sql
mysql -h TU_IP -u usuario -p inventario_soporte < backup.sql

# Desde archivo comprimido .sql.gz
gunzip < backup.sql.gz | mysql -h TU_IP -u usuario -p inventario_soporte
```

### Crear la base de datos (primera vez)

```bash
mysql -h TU_IP -u usuario -p -e "CREATE DATABASE IF NOT EXISTS inventario_soporte CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 💻 Ejecutar la Aplicación

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000/soporte/`

### Modo Producción

```bash
npm start
```

---

## 📁 Estructura del Proyecto

```
inventario-ti-lds/
├── public/              # Archivos estáticos (frontend)
│   ├── css/            # Estilos CSS
│   ├── js/             # JavaScript del frontend
│   │   ├── views/      # Vistas de la SPA
│   │   ├── utils/      # Utilidades
│   │   └── api.js      # Cliente API
│   ├── vendor/         # Librerías de terceros
│   └── index.html      # Punto de entrada
├── src/                 # Código del backend
│   ├── config/         # Configuración
│   ├── controllers/    # Controladores
│   ├── middleware/     # Middlewares
│   └── routes/         # Rutas de la API
├── server.js           # Servidor Express
├── package.json
├── .env                # Variables de entorno (no subir a Git)
└── .env.example        # Ejemplo de configuración
```

---

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor en producción |
| `npm run dev` | Inicia el servidor con nodemon (desarrollo) |

---

## 🌐 Endpoints de la API

Base URL: `/soporte/api`

| Módulo | Endpoint |
|--------|----------|
| Autenticación | `/auth/login`, `/auth/register` |
| Equipos | `/equipos` |
| Empleados | `/empleados` |
| Asignaciones | `/asignaciones` |
| Direcciones IP | `/direcciones-ip` |
| Cuentas Email | `/cuentas-email` |
| Mantenimientos | `/mantenimientos` |
| Notas | `/notas` |

---

## 🛠️ Solución de Problemas

### Error de conexión a la base de datos

1. Verifica que MySQL esté corriendo
2. Confirma las credenciales en `.env`
3. Asegúrate que el host/IP sea accesible

### Error de JWT

Si recibes errores de token:
1. Genera un nuevo JWT_SECRET
2. Reinicia el servidor
3. Vuelve a iniciar sesión

### Puerto en uso

Si el puerto 3000 está ocupado:
```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Cambiar el puerto en .env
PORT=3001
```

---

## 👨‍💻 Autor

Desarrollado con ❤️ por [herwingxtech](https://github.com/herwingxtech)

---

## 📄 Licencia

Este proyecto es privado y de uso interno.
