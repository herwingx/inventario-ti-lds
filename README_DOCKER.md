# Inventario Soporte - Guía de Desarrollo con Docker

Este documento explica cómo configurar y ejecutar el proyecto **Inventario Soporte** en un entorno de desarrollo usando Docker y Docker Compose.

## 📋 Importante: Entorno de Desarrollo

**Esta configuración con Docker es exclusivamente para desarrollo local.** En producción, el proyecto se desplegará en un servidor con Apache y MySQL nativos, sin contenedores Docker.

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd inventario_soporte
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

**Edita el archivo `.env`** y modifica las siguientes variables según tu configuración:

```env
# ================================================
# CONFIGURACIÓN DE LA BASE DE DATOS
# ================================================
DB_HOST=inventario-db
DB_USER=herwingxtech
DB_PASSWORD=herwingx-dev
DB_NAME=inventario_soporte
DB_PORT=3306

# ================================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ================================================
# Cambia la IP por la de tu máquina para acceso desde la red
APP_URL=http://192.168.0.253/soporte
API_URL=http://192.168.0.253/soporte/api
PORT=3000
NODE_ENV=development

# ================================================
# CONFIGURACIÓN DE MYSQL DOCKER
# ================================================
MYSQL_ROOT_PASSWORD=herwingx-dev
MYSQL_DATABASE=inventario_soporte
MYSQL_USER=herwingxtech
MYSQL_PASSWORD=herwingx-dev
```

### 3. Levantar los Servicios
```bash
docker compose up -d
```

### 4. Crear Usuario Administrador
Una vez que los contenedores estén ejecutándose y la base de datos esté lista (puede tardar 1-2 minutos), ejecuta:

```bash
docker compose exec inventario-app node seedAdmin.js
```

### 5. Verificar el Estado
```bash
docker compose ps
```

### 6. Acceder a la Aplicación
Abre tu navegador y ve a: `http://<TU_IP_LOCAL>/soporte`

**Credenciales por defecto:**
- **Usuario**: `linea`
- **Contraseña**: `digital`

---

## 🏗️ Arquitectura del Proyecto

### Servicios Docker

El proyecto utiliza 3 contenedores orquestados por `docker-compose.yml`:

1. **`inventario-mysql-db`**
   - **Imagen**: `mysql:8.0`
   - **Puerto**: 3306
   - **Propósito**: Base de datos MySQL con persistencia de datos
   - **Volumen**: `mysql_data` para persistir datos

2. **`inventario-nodejs-app`**
   - **Imagen**: Construida desde `Dockerfile.nodejs`
   - **Puerto**: 3000 (interno)
   - **Propósito**: API y lógica de negocio de la aplicación
   - **Dependencias**: Espera a que la base de datos esté lista

3. **`apache-proxy`**
   - **Imagen**: Construida desde `Dockerfile.apache`
   - **Puerto**: 80 (expuesto)
   - **Propósito**: Proxy inverso que sirve archivos estáticos y redirige API calls
   - **Configuración**: `soporte.conf` con reglas de proxy

### Red Docker
Los contenedores se comunican a través de una red bridge llamada `inventario-network`.

---

## 📁 Estructura del Proyecto

```
inventario_soporte/
├── .env                          # Variables de entorno (configurar)
├── .env.example                  # Ejemplo de configuración
├── docker-compose.yml            # Orquestación de servicios
├── Dockerfile.apache             # Imagen del proxy Apache
├── Dockerfile.nodejs             # Imagen de la aplicación Node.js
├── Dockerfile.mysql.simple       # Imagen de MySQL con schema inicial
├── seedAdmin.js                  # Script para crear usuario admin
├── server.js                     # Servidor principal de la aplicación
├── soporte.conf                  # Configuración de Apache
├── package.json                  # Dependencias de Node.js
├── public/                       # Archivos estáticos (CSS, JS, imágenes)
└── src/
    ├── controllers/              # Controladores de la API
    ├── database/                 # Schema y configuración de DB
    ├── middleware/               # Middleware de autenticación
    ├── routes/                   # Rutas de la API
    └── utils/                    # Utilidades y helpers
```

---

## 🔧 Comandos Útiles

### Gestión de Contenedores
```bash
# Levantar servicios
docker compose up -d

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (reinicio completo)
docker compose down -v

# Ver estado de contenedores
docker compose ps

# Reconstruir imágenes
docker compose up -d --build

# Reconstruir sin caché
docker compose up -d --build --no-cache
```

### Logs y Debugging
```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f inventario-app
docker compose logs -f inventario-db
docker compose logs -f apache-proxy

# Ejecutar comandos dentro del contenedor
docker compose exec inventario-app bash
docker compose exec inventario-db mysql -u root -p
```

### Base de Datos
```bash
# Crear usuario admin
docker compose exec inventario-app node seedAdmin.js

# Conectar a MySQL
docker compose exec inventario-db mysql -u herwingxtech -p'herwingx-dev' inventario_soporte

# Backup de la base de datos
docker compose exec inventario-db mysqldump -u herwingxtech -p'herwingx-dev' inventario_soporte > backup.sql
```

---

## 🔄 Configuraciones Específicas para Docker

### Problemas Resueltos

1. **Redirección de Rutas**: Se añadió `RedirectMatch ^/soporte$ /soporte/` en `soporte.conf` para manejar URLs sin barra final.

2. **Variables de Entorno**: Se configuró el archivo `.env` para usar nombres de servicios Docker (`inventario-db`) en lugar de `localhost`.

3. **Inicialización de Base de Datos**: Se creó `seedAdmin.js` para crear automáticamente el usuario administrador después de la inicialización.

4. **Red de Contenedores**: Se configuró una red bridge personalizada para comunicación entre servicios.

### Diferencias con Producción

| Aspecto | Docker (Desarrollo) | Producción |
|---------|-------------------|------------|
| **Base de Datos** | Container MySQL | MySQL nativo en servidor |
| **Servidor Web** | Container Apache | Apache nativo |
| **Aplicación** | Container Node.js | Node.js con PM2 |
| **Configuración** | `.env` y docker-compose | Variables de entorno del sistema |
| **Acceso** | IP local + puerto 80 | Dominio + SSL |
| **Persistencia** | Volúmenes Docker | Directorios del sistema |

---

## 🚨 Solución de Problemas

### Contenedor de Base de Datos no Inicia
```bash
# Verificar logs
docker compose logs inventario-db

# Reiniciar con volúmenes limpios
docker compose down -v
docker compose up -d
```

### Error de Conexión a Base de Datos
```bash
# Verificar que la DB esté lista
docker compose exec inventario-db mysql -u herwingxtech -p'herwingx-dev' -e "SELECT 1;"

# Verificar variables de entorno
docker compose exec inventario-app printenv | grep DB_
```

### No se Puede Acceder desde Otra Máquina
1. Verifica que `APP_URL` en `.env` use la IP correcta de tu máquina
2. Revisa el firewall (puerto 80 debe estar abierto)
3. Asegúrate de que ambas máquinas estén en la misma red

### Aplicación no Carga Recursos (CSS/JS)
1. Verifica que `APP_URL` esté configurado correctamente
2. Revisa que Apache esté sirviendo archivos estáticos desde `/public`
3. Inspecciona las rutas en el navegador (F12 > Network)

### Contenedor de Node.js se Reinicia
```bash
# Ver logs detallados
docker compose logs -f inventario-app

# Verificar sintaxis del código
docker compose exec inventario-app node -c server.js
```

---

## 📝 Notas de Desarrollo

- **Reinicio Automático**: Los contenedores se reinician automáticamente si fallan
- **Persistencia**: Los datos de MySQL se mantienen en volúmenes Docker
- **Hot Reload**: Los cambios en código requieren reconstruir la imagen
- **Red Local**: La aplicación es accesible desde cualquier dispositivo en la red local
- **Logs**: Todos los logs están disponibles mediante `docker compose logs`

---

## 🔄 Flujo de Desarrollo

1. **Modificar código** → Hacer cambios en el código fuente
2. **Reconstruir imagen** → `docker compose up -d --build`
3. **Verificar cambios** → Acceder a la aplicación y probar
4. **Ver logs** → `docker compose logs -f` para debugging
5. **Repetir** → Volver al paso 1

---

## ⚠️ Consideraciones Importantes

- **Solo para Desarrollo**: Esta configuración NO debe usarse en producción
- **Credenciales**: Las credenciales están hardcodeadas para desarrollo
- **Seguridad**: No hay configuraciones de seguridad específicas para producción
- **Performance**: La configuración prioriza facilidad de desarrollo sobre rendimiento
- **Backup**: Los datos persisten pero haz backups regulares durante desarrollo

