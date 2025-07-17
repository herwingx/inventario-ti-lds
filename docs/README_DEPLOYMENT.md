# 🚀 Inventario Soporte - Guía de Deployment

Guía completa para desplegar el sistema de **Inventario Soporte** en servidor de producción.

## 📋 Tabla de Contenidos

- [🏗️ Configuración del Servidor](#️-configuración-del-servidor)
- [🔧 Setup Inicial](#-setup-inicial)
- [🚀 Proceso de Deployment](#-proceso-de-deployment)
- [🔄 Actualizaciones](#-actualizaciones)
- [🛡️ Seguridad](#️-seguridad)
- [📊 Monitoreo](#-monitoreo)
- [🚨 Troubleshooting](#-troubleshooting)

## 🏗️ Configuración del Servidor

### **Prerrequisitos del Servidor**
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+
- MySQL 8.0+
- Apache 2.4+
- Git
- PM2 (recomendado para gestión de procesos)

### **Instalación de Dependencias**

**Ubuntu/Debian:**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MySQL
sudo apt install mysql-server -y

# Instalar Apache
sudo apt install apache2 -y

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Git
sudo apt install git -y
```

## 🔧 Setup Inicial

### **1. Configurar MySQL**
```bash
# Iniciar y habilitar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configuración segura
sudo mysql_secure_installation

# Crear base de datos y usuario
sudo mysql -u root -p
```

```sql
-- En MySQL
CREATE DATABASE inventario_soporte;
CREATE USER 'herwingxtech'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON inventario_soporte.* TO 'herwingxtech'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **2. Configurar Apache**
```bash
# Habilitar módulos necesarios
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http

# Crear configuración del sitio
sudo nano /etc/apache2/sites-available/soporte.conf
```

```apache
# /etc/apache2/sites-available/soporte.conf
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /var/www/html/soporte/public
    
    # Proxy para API
    ProxyPreserveHost On
    ProxyPass /soporte/api/ http://localhost:3000/api/
    ProxyPassReverse /soporte/api/ http://localhost:3000/api/
    
    # Servir archivos estáticos
    Alias /soporte /var/www/html/soporte/public
    
    <Directory /var/www/html/soporte/public>
        AllowOverride All
        Require all granted
        
        # Rewrite para SPA
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /soporte/index.html [L]
    </Directory>
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/soporte_error.log
    CustomLog ${APACHE_LOG_DIR}/soporte_access.log combined
</VirtualHost>
```

```bash
# Habilitar sitio
sudo a2ensite soporte.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
```

### **3. Configurar Permisos de Usuario**

**Opción A: Agregar usuario a www-data (Recomendado)**
```bash
# Agregar tu usuario al grupo www-data
sudo usermod -a -G www-data $USER

# Configurar permisos del directorio
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 775 /var/www/html

# Reiniciar sesión para aplicar cambios de grupo
newgrp www-data
```

### **4. Clonar Repositorio**
```bash
# Cambiar al directorio web
cd /var/www/html

# Clonar repositorio
sudo git clone https://github.com/tu-usuario/inventario_soporte.git soporte

# Cambiar permisos
sudo chown -R www-data:www-data soporte
sudo chmod -R 775 soporte

# Entrar al directorio
cd soporte
```

### **5. Configurar Variables de Entorno**
```bash
# Crear archivo de configuración de producción
cp .env.example .env
nano .env
```

```env
# Configuración de producción
APP_URL=http://tu-dominio.com/soporte
API_URL=http://tu-dominio.com/soporte/api
PORT=3000
NODE_ENV=production

# Base de datos
DB_HOST=localhost
DB_USER=herwingxtech
DB_PASSWORD=tu_password_seguro
DB_NAME=inventario_soporte
DB_PORT=3306

# JWT (generar secreto único)
JWT_SECRET=tu_jwt_secret_super_seguro_de_64_caracteres_minimo
JWT_EXPIRE=24h
```

### **6. Instalar Dependencias y Configurar Base de Datos**
```bash
# Instalar dependencias de producción
npm install --production

# Importar esquema de base de datos
mysql -u herwingxtech -p inventario_soporte < src/database/db_soporte.sql

# Crear usuario administrador
node seedAdmin.js
```

### **7. Configurar PM2**
```bash
# Crear archivo de configuración PM2
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'inventario-soporte',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Crear directorio de logs
mkdir -p logs

# Iniciar aplicación con PM2
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar al boot
pm2 startup
# Ejecutar el comando que PM2 te muestre
```

## 🚀 Proceso de Deployment

### **Deployment Manual**
```bash
# 1. Ir al directorio del proyecto
cd /var/www/html/soporte

# 2. Hacer backup
sudo tar -czf /var/backups/soporte_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude=node_modules --exclude=.git .

# 3. Obtener cambios
git fetch origin
git pull origin main

# 4. Instalar dependencias si cambiaron
npm install --production

# 5. Reiniciar aplicación
pm2 restart inventario-soporte

# 6. Verificar que funcione
curl -f http://localhost:3000/db-test
```

## 🔄 Actualizaciones

### **Flujo de Desarrollo → Producción**

**1. En Desarrollo (Docker):**
```bash
# Desarrollar con recarga automática
./scripts/docker-dev.sh dev

# Hacer cambios, probar, commitear
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

**2. En Producción:**
```bash
# Deployment manual
cd /var/www/html/soporte
git pull origin main
npm install --production  # Solo si cambió package.json
pm2 restart inventario-soporte
```

### **Tipos de Cambios y Acciones**

| Tipo de Cambio | Acción Requerida |
|----------------|------------------|
| Código JS/HTML/CSS | `git pull` + `pm2 restart` |
| package.json | `git pull` + `npm install` + `pm2 restart` |
| Base de datos | `git pull` + ejecutar SQL + `pm2 restart` |
| Variables .env | Editar `.env` + `pm2 restart` |
| Configuración Apache | Editar config + `systemctl reload apache2` |

## 🛡️ Seguridad

### **Configuración de Firewall**
```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Bloquear acceso directo a Node.js
sudo ufw deny 3000
```

### **Permisos de Archivos**
```bash
# Permisos seguros
sudo chown -R www-data:www-data /var/www/html/soporte
sudo find /var/www/html/soporte -type d -exec chmod 755 {} \;
sudo find /var/www/html/soporte -type f -exec chmod 644 {} \;
sudo chmod 600 /var/www/html/soporte/.env
```

## 📊 Monitoreo

### **Logs de la Aplicación**
```bash
# Ver logs de PM2
pm2 logs inventario-soporte

# Ver logs de Apache
sudo tail -f /var/log/apache2/soporte_error.log

# Estado de procesos
pm2 status
```

## 🚨 Troubleshooting

### **Problemas Comunes**

**1. Aplicación no inicia:**
```bash
# Verificar logs
pm2 logs inventario-soporte

# Verificar conexión a base de datos
mysql -u herwingxtech -p inventario_soporte -e "SELECT 1"
```

**2. Permisos de Git:**
```bash
# Si no puedes hacer git pull
sudo chown -R $USER:www-data /var/www/html/soporte/.git
sudo chmod -R 775 /var/www/html/soporte/.git
```

---

## 🎯 Resumen del Flujo

### **Desarrollo:**
```bash
./scripts/docker-dev.sh dev  # Desarrollo con recarga automática
git add . && git commit -m "cambios" && git push
```

### **Producción:**
```bash
cd /var/www/html/soporte
git pull origin main
pm2 restart inventario-soporte
```

¡Deployment configurado! 🚀