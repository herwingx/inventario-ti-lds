# 🐳 Inventario Soporte - Guía Docker

Configuración completa para ejecutar **Inventario Soporte** en desarrollo usando Docker.

> ⚠️ **Solo para Desarrollo**: Esta configuración Docker es exclusivamente para desarrollo local. En producción se usa Apache y MySQL nativos.

## 📖 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [🏗️ Arquitectura](#️-arquitectura)
- [🔧 Comandos Útiles](#-comandos-útiles)
- [🚨 Solución de Problemas](#-solución-de-problemas)
- [📝 Desarrollo](#-desarrollo)

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
cp .env.example .env
```

#### 2️⃣ Configurar Variables de Entorno
Edita `.env` y **cambia la IP** por la de tu máquina:

```env
# 🔧 CONFIGURACIÓN PRINCIPAL (CAMBIAR IP)
APP_URL=http://192.168.0.253/soporte    # ← Cambiar por tu IP
API_URL=http://192.168.0.253/soporte/api # ← Cambiar por tu IP

# 🗄️ BASE DE DATOS
DB_HOST=inventario-db
DB_USER=herwingxtech
DB_PASSWORD=herwingx-dev
DB_NAME=inventario_soporte

# 🐳 MYSQL DOCKER
MYSQL_ROOT_PASSWORD=herwingx-dev
MYSQL_DATABASE=inventario_soporte
MYSQL_USER=herwingxtech
MYSQL_PASSWORD=herwingx-dev
```

> 💡 **Tip**: Para obtener tu IP local usa `ipconfig` (Windows) o `ifconfig` (Mac/Linux)

#### 3️⃣ Iniciar Aplicación
```bash
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
| 🌐 **apache-proxy** | `Dockerfile.apache` | 80 | Servidor web y proxy |
| ⚙️ **inventario-app** | `Dockerfile.nodejs` | 3000 | API y lógica de negocio |
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

### 🚀 Gestión Básica
```bash
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

## �  Desarrollo

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
docker compose logs

# 2. Reinicio completo
docker compose down -v
docker compose up -d

# 3. Verificar puertos ocupados
netstat -tulpn | grep :80
```

### 🔴 No puedo conectar a la base de datos
```bash
# Verificar que MySQL esté listo
docker compose exec inventario-db mysql -u herwingxtech -p'herwingx-dev' -e "SELECT 1;"

# Ver variables de entorno
docker compose exec inventario-app printenv | grep DB_

# Esperar más tiempo (MySQL tarda en inicializar)
sleep 30 && docker compose exec inventario-app node seedAdmin.js
```

### 🔴 No puedo acceder desde otra máquina
**Checklist**:
- [ ] `APP_URL` en `.env` tiene la IP correcta de tu máquina
- [ ] Puerto 80 está abierto en el firewall
- [ ] Ambas máquinas están en la misma red
- [ ] Probaste con `http://IP/soporte` (no `localhost`)

### 🔴 La página carga pero sin estilos (CSS/JS)
```bash
# 1. Verificar configuración
grep APP_URL .env

# 2. Ver logs de Apache
docker compose logs apache-proxy

# 3. Probar acceso directo a archivos
curl http://TU_IP/soporte/css/style.css
```

### 🔴 El contenedor de Node.js se reinicia constantemente
```bash
# Ver el error específico
docker compose logs -f inventario-app

# Verificar sintaxis del código
docker compose exec inventario-app node --check server.js

# Entrar al contenedor para debugging
docker compose exec inventario-app bash
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

