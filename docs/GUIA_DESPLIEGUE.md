# 🚀 Guía Maestra de Despliegue

> **Sistema de Inventario TI & Soporte LDS**
>
> Esta guía detalla el procedimiento estándar para desplegar la aplicación en un entorno de producción Linux (Ubuntu/Debian/CentOS), utilizando **Apache** como Proxy Inverso y **PM2** para la gestión de procesos.

[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)
[![Environment](https://img.shields.io/badge/Environment-Production-blue?style=flat-square)](https://nodejs.org/)
[![Server](https://img.shields.io/badge/Server-Apache_2.4+-orange?style=flat-square)](https://httpd.apache.org/)

---

## 📋 Requisitos de Infraestructura

Antes de comenzar, valida que el servidor cumpla con:

| Requisito | Versión Mínima | Descripción |
| :--- | :--- | :--- |
| **OS** | Linux | Ubuntu 20.04+, Debian 10+, CentOS 7+ |
| **Node.js** | v18.x LTS | Runtime de JavaScript |
| **MySQL** | 8.0 / MariaDB 10.x | Motor de Base de Datos |
| **Apache** | 2.4 | Servidor Web / Reverse Proxy |
| **PM2** | Latest | Gestor de Procesos Node (`npm i -g pm2`) |
| **Git** | Latest | Control de Versiones |

---

## 🛠️ Fase 1: Preparación del Entorno

### 1.1 Clonar Repositorio
Ubicación recomendada: `/var/www/inventario-ti-lds`

```bash
cd /var/www
git clone https://github.com/herwingx/inventario-ti-lds.git
cd inventario-ti-lds
```

### 1.2 Configurar Backend (API)

```bash
cd server
npm install --production  # Instalar solo dependencias críticas
mv .env.example .env      # Configurar variables de entorno
```

**Variables Críticas (.env):**
```ini
PORT=3000
NODE_ENV=production
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_NAME=inventario_soporte
# Seguridad
JWT_SECRET=tu_secreto_super_seguro
```

---

## 📦 Fase 2: Construcción del Frontend

El cliente Vue.js debe ser compilado a archivos estáticos (`html, css, js`) y servido por el backend.

### 2.1 Compilación
```bash
cd ../client
npm install
npm run build
```

Esta acción generará la carpeta `dist/` con la aplicación optimizada.

### 2.2 Integración (Build & Copy)
Copia los artefactos generados al servidor estático de Node.js.

```bash
# Desde la raíz del proyecto
# 1. Limpiar despliegue anterior (preservando uploads)
find server/public -mindepth 1 ! -regex '^server/public/uploads\(/.*\)?' -delete

# 2. Copiar nuevo build
cp -r client/dist/* server/public/
```

> 💡 **Nota Git:** La carpeta `server/public` está configurada en `.gitignore` para ignorar estos archivos generados, manteniendo tu repositorio limpio.

---

## 🌐 Fase 3: Configuración del Proxy (Apache)

Configura Apache para redirigir el tráfico del subdirectorio `/soporte` hacia la aplicación Node.js.

### 3.1 Módulos Requeridos
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

### 3.2 VirtualHost
Archivo: `/etc/apache2/sites-available/000-default.conf` (o tu dominio):

```apache
<VirtualHost *:80>
    ServerName midominio.com

    # ... otras configuraciones ...

    # === INICIO CONFIGURACIÓN INVENTARIO ===
    ProxyPreserveHost On
    
    # Redirigir /soporte hacia Node.js (Puerto 3000)
    ProxyPass /soporte http://localhost:3000/soporte
    ProxyPassReverse /soporte http://localhost:3000/soporte
    # === FIN CONFIGURACIÓN INVENTARIO ===

</VirtualHost>
```

Reiniciar Apache:
```bash
sudo apachectl configtest && sudo systemctl restart apache2
```

---

## 🚀 Fase 4: Lanzamiento (PM2)

Utiliza PM2 para mantener la aplicación "viva" permanentemente.

```bash
cd server
# Iniciar proceso
pm2 start server.js --name "inventario-api"

# Garantizar inicio automático tras reinicio del servidor
pm2 save
pm2 startup
# ⚠️ IMPORTANTE: 'pm2 startup' te mostrará un comando en terminal.
# COPIA Y PÉGALO para confirmar la configuración de arranque.
```

---

## ✅ Lista de Verificación Final

- [ ] Base de datos migrada/importada.
- [ ] Backend corriendo en puerto 3000 (`pm2 status`).
- [ ] Proxy Apache activo.
- [ ] Acceso exitoso vía web: `http://midominio.com/soporte`.
