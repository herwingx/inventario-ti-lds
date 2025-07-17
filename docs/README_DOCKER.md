# 🐳 Inventario Soporte - Guía Docker

Configuración completa para ejecutar **Inventario Soporte** en desarrollo usando Docker.

> ⚠️ **Solo para Desarrollo**: Esta configuración Docker es exclusivamente para desarrollo local. En producción se usa Apache y MySQL nativos.

## 📖 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [🏗️ Arquitectura](#️-arquitectura)
- [🛠️ Script de Desarrollo](#️-script-de-desarrollo)
- [🔧 Comandos Útiles](#-comandos-útiles)
- [🚨 Solución de Problemas](#-solución-de-problemas)
- [📝 Desarrollo](#-desarrollo)
- [🔒 Seguridad y Optimizaciones](#-seguridad-y-optimizaciones)

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Puerto 80 disponible en tu máquina

### Pasos de Instalación

#### 1️⃣ Clonar y Configurar
```bash
# Clonar repositorio
git clone <url-del-repositorio>
cd inventario_soporte

# Copiar configuración de ejemplo
cp docker/.env.example docker/.env
```

#### 2️⃣ Configurar Variables de Entorno
Edita `docker/.env` y **cambia la IP** por la de tu máquina:

```env
# 🔧 CONFIGURACIÓN PRINCIPAL (CAMBIAR IP)
APP_URL=http://192.168.0.253/soporte    # ← Cambiar por tu IP
API_URL=http://192.168.0.253/soporte/api # ← Cambiar por tu IP

# 🗄️ BASE DE DATOS
DB_HOST=inventario-db
DB_USER=herwingxtech
DB_PASSWORD=herwingx-dev
DB_NAME=inventario_soporte

# 🔐 JWT (GENERAR SECRETO)
JWT_SECRET=tu_secreto_generado_aqui     # ← Ver instrucciones abajo
JWT_EXPIRE=24h

# 🐳 MYSQL DOCKER
MYSQL_ROOT_PASSWORD=herwingx-dev
MYSQL_DATABASE=inventario_soporte
MYSQL_USER=herwingxtech
MYSQL_PASSWORD=herwingx-dev
```

**🔐 Generar JWT_SECRET:**
```bash
# Opción 1: Con Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Opción 2: Con OpenSSL
openssl rand -hex 64

# Opción 3: Online (solo para desarrollo)
# Visitar: https://generate-secret.vercel.app/64
```

> 💡 **Tip**: Para obtener tu IP local usa `ipconfig` (Windows) o `ifconfig` (Mac/Linux)

#### 3️⃣ Iniciar Aplicación

**Opción A: Usando el Script de Desarrollo (Recomendado)**
```bash
# Hacer ejecutable el script
chmod +x scripts/docker-dev.sh

# Iniciar todo
./scripts/docker-dev.sh start

# Crear usuario admin
./scripts/docker-dev.sh seed
```

**Opción B: Comandos Docker Compose**
```bash
# Ir al directorio docker
cd docker

# Levantar todos los servicios
docker compose up -d

# Esperar 1-2 minutos y crear usuario admin
docker compose exec inventario-app node seedAdmin.js

# Verificar que todo esté funcionando
docker compose ps
```

#### 4️⃣ Acceder a la Aplicación
🌐 **URL**: `http://<TU_IP_LOCAL>/soporte`

🔐 **Credenciales**:
- Usuario: `linea`
- Contraseña: `digital`

---

## 🏗️ Arquitectura

### Diagrama de Servicios
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Apache Proxy  │    │   Node.js App   │    │   MySQL DB      │
│   (Puerto 80)   │◄──►│   (Puerto 3000) │◄──►│   (Puerto 3306) │
│                 │    │                 │    │                 │
│ • Archivos      │    │ • API REST      │    │ • Datos         │
│   estáticos     │    │ • Lógica de     │    │ • Persistencia  │
│ • Proxy a API   │    │   negocio       │    │ • Backups       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Contenedores Docker

| Servicio | Imagen | Puerto | Función |
|----------|--------|--------|---------|
| 🌐 **apache-proxy** | `docker/apache/Dockerfile` | 80 | Servidor web y proxy |
| ⚙️ **inventario-app** | `docker/nodejs/Dockerfile` | 3000 | API y lógica de negocio |
| 🗄️ **inventario-db** | `mysql:8.0` | 3306 | Base de datos |

### Comunicación
- Red Docker: `inventario-network`
- Los contenedores se comunican por nombre de servicio
- Apache redirige `/api/*` → Node.js
- Node.js conecta a MySQL usando `inventario-db:3306`

---

## 📁 Estructura del Proyecto

```
inventario_soporte/
├── README.md                     # 📖 README principal
├── .dockerignore                 # Optimización de builds Docker
├── seedAdmin.js                  # Script para crear usuario admin
├── server.js                     # Servidor principal de la aplicación
├── package.json                  # Dependencias de Node.js
├── docs/                         # 📚 Documentación
│   ├── README_DOCKER.md          # Guía Docker completa
│   ├── README_DEVELOPMENT.md     # Guía de desarrollo
│   └── README_API.md             # Documentación de API
├── docker/                       # 🐳 Configuración Docker
│   ├── apache/
│   │   ├── Dockerfile            # Imagen del proxy Apache
│   │   └── soporte.conf          # Configuración de Apache
│   ├── nodejs/
│   │   └── Dockerfile            # Imagen de la aplicación Node.js
│   ├── .env.example              # Variables de entorno
│   └── docker-compose.yml        # Orquestación de servicios
├── scripts/                      # 🛠️ Scripts de utilidades
│   └── docker-dev.sh             # Script de desarrollo Docker
├── public/                       # Archivos estáticos (CSS, JS, imágenes)
└── src/
    ├── controllers/              # Controladores de la API
    ├── database/                 # Schema y configuración de DB
    ├── middleware/               # Middleware de autenticación
    ├── routes/                   # Rutas de la API
    └── utils/                    # Utilidades y helpers
```

---

## 🛠️ Script de Desarrollo

### 🚀 docker-dev.sh - Tu Herramienta Principal

Hemos incluido un script que simplifica todas las tareas de desarrollo:

```bash
# Hacer ejecutable (solo la primera vez)
chmod +x scripts/docker-dev.sh

# Ver todos los comandos disponibles
./scripts/docker-dev.sh help
```

### 📋 Comandos Disponibles

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `start` | Iniciar todos los servicios | `./scripts/docker-dev.sh start` |
| `stop` | Detener todos los servicios | `./scripts/docker-dev.sh stop` |
| `restart` | Reiniciar todos los servicios | `./scripts/docker-dev.sh restart` |
| `rebuild` | Reconstruir e iniciar servicios | `./scripts/docker-dev.sh rebuild` |
| `seed` | Crear usuario administrador | `./scripts/docker-dev.sh seed` |
| `status` | Ver estado de contenedores | `./scripts/docker-dev.sh status` |
| `logs` | Ver logs de todos los servicios | `./scripts/docker-dev.sh logs` |
| `logs-app` | Ver logs solo de la aplicación | `./scripts/docker-dev.sh logs-app` |
| `logs-db` | Ver logs solo de la base de datos | `./scripts/docker-dev.sh logs-db` |
| `shell-app` | Entrar al contenedor de la app | `./scripts/docker-dev.sh shell-app` |
| `shell-db` | Entrar al contenedor de MySQL | `./scripts/docker-dev.sh shell-db` |
| `backup` | Hacer backup de la base de datos | `./scripts/docker-dev.sh backup` |
| `clean` | Limpiar todo (¡BORRA DATOS!) | `./scripts/docker-dev.sh clean` |

### 🎯 Flujo de Trabajo Recomendado

```bash
# 1. Configuración inicial
cp docker/.env.example docker/.env
# Editar docker/.env con tu IP y JWT_SECRET

# 2. Iniciar desarrollo
./scripts/docker-dev.sh start
./scripts/docker-dev.sh seed

# 3. Durante desarrollo
./scripts/docker-dev.sh logs-app    # Ver logs
./scripts/docker-dev.sh rebuild     # Después de cambios
./scripts/docker-dev.sh backup      # Backup regular

# 4. Al terminar
./scripts/docker-dev.sh stop
```

---

## 🔧 Comandos Útiles

### 🚀 Gestión Básica
```bash
# Ir al directorio docker
cd docker

# Iniciar todo
docker compose up -d

# Ver estado
docker compose ps

# Parar todo
docker compose down

# Reinicio completo (borra datos)
docker compose down -v && docker compose up -d
```

### 🔨 Desarrollo
```bash
# Reconstruir después de cambios
docker compose up -d --build

# Reconstruir sin caché (más lento pero seguro)
docker compose up -d --build --no-cache

# Ver logs en tiempo real
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f inventario-app
```

### 🗄️ Base de Datos
```bash
# Crear usuario administrador
docker compose exec inventario-app node seedAdmin.js

# Conectar a MySQL
docker compose exec inventario-db mysql -u herwingxtech -p'herwingx-dev' inventario_soporte

# Hacer backup
docker compose exec inventario-db mysqldump -u herwingxtech -p'herwingx-dev' inventario_soporte > backup.sql

# Restaurar backup
docker compose exec -T inventario-db mysql -u herwingxtech -p'herwingx-dev' inventario_soporte < backup.sql
```

### 🔍 Debugging
```bash
# Entrar al contenedor de la app
docker compose exec inventario-app bash

# Entrar al contenedor de MySQL
docker compose exec inventario-db bash

# Ver variables de entorno
docker compose exec inventario-app printenv

# Verificar conectividad
docker compose exec inventario-app ping inventario-db
```

---

## 📝 Desarrollo

### 🔄 Flujo de Trabajo
1. **Hacer cambios** en el código
2. **Reconstruir**: `docker compose up -d --build`
3. **Probar** en `http://TU_IP/soporte`
4. **Ver logs**: `docker compose logs -f` si hay problemas
5. **Repetir**

### 🔧 Configuraciones Especiales Docker

**Problemas que ya están resueltos**:
- ✅ Redirección de rutas sin barra final
- ✅ Variables de entorno para nombres de servicios Docker
- ✅ Inicialización automática de base de datos
- ✅ Red personalizada para comunicación entre contenedores

### 📊 Docker vs Producción

| Aspecto | 🐳 Docker (Desarrollo) | 🚀 Producción |
|---------|----------------------|---------------|
| **Base de Datos** | Container MySQL | MySQL nativo |
| **Servidor Web** | Container Apache | Apache nativo |
| **Aplicación** | Container Node.js | Node.js + PM2 |
| **Acceso** | IP local:80 | Dominio + SSL |
| **Configuración** | `.env` local | Variables del sistema |

---

## 🚨 Solución de Problemas

### 🔴 Los contenedores no inician
```bash
# 1. Ver qué está pasando
./scripts/docker-dev.sh logs

# 2. Reinicio completo
./scripts/docker-dev.sh clean
./scripts/docker-dev.sh start

# 3. Verificar puertos ocupados
netstat -tulpn | grep :80
```

### 🔴 No puedo conectar a la base de datos
```bash
# Verificar que MySQL esté listo
cd docker
docker compose exec inventario-db mysql -u herwingxtech -p'herwingx-dev' -e "SELECT 1;"

# Ver variables de entorno
docker compose exec inventario-app printenv | grep DB_

# Esperar más tiempo (MySQL tarda en inicializar)
sleep 30 && ./scripts/docker-dev.sh seed
```

### 🔴 No puedo acceder desde otra máquina
**Checklist**:
- [ ] `APP_URL` en `docker/.env` tiene la IP correcta de tu máquina
- [ ] Puerto 80 está abierto en el firewall
- [ ] Ambas máquinas están en la misma red
- [ ] Probaste con `http://IP/soporte` (no `localhost`)

### 🔴 La página carga pero sin estilos (CSS/JS)
```bash
# 1. Verificar configuración
grep APP_URL docker/.env

# 2. Ver logs de Apache
./scripts/docker-dev.sh logs apache-proxy

# 3. Probar acceso directo a archivos
curl http://TU_IP/soporte/css/style.css
```

### 🔴 El contenedor de Node.js se reinicia constantemente
```bash
# Ver el error específico
./scripts/docker-dev.sh logs-app

# Verificar sintaxis del código
cd docker
docker compose exec inventario-app node --check server.js

# Entrar al contenedor para debugging
./scripts/docker-dev.sh shell-app
```

---

## 🔒 Seguridad y Optimizaciones

### 🛡️ Mejoras de Seguridad Implementadas

**Contenedores Seguros**:
- ✅ Usuario no-root en contenedores Node.js
- ✅ Imágenes Alpine (superficie de ataque reducida)
- ✅ Health checks en todos los servicios
- ✅ Reinicio automático con políticas `unless-stopped`

**Base de Datos**:
- ✅ Autenticación nativa MySQL
- ✅ Charset UTF8MB4 para soporte completo Unicode
- ✅ Volúmenes persistentes con nombres específicos
- ✅ Variables de entorno para credenciales

**Red y Comunicación**:
- ✅ Red Docker aislada (`inventario-network`)
- ✅ Comunicación interna por nombres de servicio
- ✅ Puertos expuestos solo donde es necesario

### ⚡ Optimizaciones de Rendimiento

**Docker Builds**:
- ✅ `.dockerignore` para builds más rápidas
- ✅ Cache de capas Docker optimizado
- ✅ Instalación de dependencias antes de copiar código
- ✅ Limpieza de cache npm automática

**Apache**:
- ✅ Cache de archivos estáticos configurado
- ✅ Compresión y headers optimizados
- ✅ MIME types correctos para todos los archivos
- ✅ Logs dirigidos a stdout/stderr

**MySQL**:
- ✅ Configuración de charset optimizada
- ✅ Health checks eficientes
- ✅ Inicialización automática de schema

### 📊 Monitoreo y Logs

**Health Checks Configurados**:
```bash
# Ver estado de salud de todos los servicios
./scripts/docker-dev.sh status

# Logs específicos por servicio
./scripts/docker-dev.sh logs-app    # Aplicación Node.js
./scripts/docker-dev.sh logs-db     # Base de datos MySQL
```

**Métricas de Contenedores**:
```bash
# Ver uso de recursos
docker stats

# Ver información detallada de un contenedor
docker inspect inventario-nodejs-app
```

### 🔧 Configuración Avanzada

**Variables de Entorno Disponibles**:
```env
# Configuración de Node.js
NODE_ENV=development          # Modo de desarrollo
PORT=3000                    # Puerto interno de la app

# Configuración JWT
JWT_SECRET=tu_secreto_jwt    # Clave secreta para tokens
JWT_EXPIRE=24h               # Tiempo de expiración

# Configuración MySQL
MYSQL_ROOT_PASSWORD=password # Contraseña root MySQL
MYSQL_USER=usuario          # Usuario de aplicación
MYSQL_PASSWORD=password     # Contraseña de aplicación
MYSQL_DATABASE=database     # Nombre de la base de datos
```

**Personalización de Puertos**:
```yaml
# En docker/docker-compose.yml puedes cambiar:
ports:
  - "8080:80"    # Apache en puerto 8080
  - "3001:3000"  # Node.js en puerto 3001
  - "3307:3306"  # MySQL en puerto 3307
```

---

## 🎯 Resumen de Mejoras Implementadas

### ✨ **Nuevas Características**

1. **Script de Desarrollo (`scripts/docker-dev.sh`)**
   - 12 comandos útiles para desarrollo
   - Colores y mensajes informativos
   - Verificaciones automáticas de Docker
   - Manejo de errores robusto

2. **Dockerfiles Optimizados**
   - `docker/nodejs/Dockerfile`: Usuario no-root, health checks, Alpine
   - `docker/apache/Dockerfile`: Configuración segura, módulos optimizados

3. **Docker Compose Mejorado**
   - Health checks y dependencias correctas
   - Variables de entorno organizadas
   - Red personalizada y volúmenes nombrados

4. **Configuración Apache Robusta**
   - Proxy reverso optimizado
   - Cache de archivos estáticos
   - MIME types correctos
   - Headers de seguridad

### 🔄 **Archivos Organizados**

- ✅ `docker/` - Toda la configuración Docker
- ✅ `scripts/` - Scripts de utilidades
- ✅ `docs/` - Documentación completa
- ✅ `.env` y `.env.example` - Variables de entorno
- ✅ `.dockerignore` - Builds optimizadas

---

## ⚠️ Consideraciones Importantes

- **Solo para Desarrollo**: Esta configuración NO debe usarse en producción
- **Credenciales**: Las credenciales están hardcodeadas para desarrollo
- **Seguridad**: Configuración optimizada para desarrollo, no para producción
- **Performance**: Balance entre facilidad de desarrollo y rendimiento
- **Backup**: Los datos persisten automáticamente, pero haz backups regulares

---

## 🆘 Soporte y Ayuda

### 📞 ¿Necesitas Ayuda?

1. **Revisa los logs**: `./scripts/docker-dev.sh logs`
2. **Verifica el estado**: `./scripts/docker-dev.sh status`
3. **Reinicia los servicios**: `./scripts/docker-dev.sh restart`
4. **Limpia y reinicia**: `./scripts/docker-dev.sh clean` (¡cuidado, borra datos!)

### 🐛 Reportar Problemas

Si encuentras problemas, incluye esta información:
```bash
# Información del sistema
docker --version
docker compose --version

# Estado de los contenedores
./scripts/docker-dev.sh status

# Logs recientes
./scripts/docker-dev.sh logs > logs_error.txt
```

¡Tu configuración Docker está lista para desarrollo profesional! 🚀