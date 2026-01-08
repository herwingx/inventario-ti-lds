# 🚀 Guía de Despliegue - Sistema de Inventario TI

Esta guía detalla los pasos para desplegar el Sistema de Inventario TI en un entorno de producción utilizando **Apache** como servidor web/proxy inverso y **Node.js** para el backend, operando bajo el subdirectorio `/soporte/`.

## 📋 Requisitos Previos

*   **Servidor:** Linux (Ubuntu/Debian/CentOS)
*   **Servidor Web:** Apache 2.4+ con módulos `mod_proxy` y `mod_proxy_http` habilitados.
*   **Runtime:** Node.js v18+ y npm.
*   **Base de Datos:** MySQL 8.0 o MariaDB 10+.
*   **Gestor de Procesos:** PM2 (instalado globalmente: `npm install -g pm2`).

---

## 🛠️ 1. Preparación del Proyecto

### 1.1 Backend (Servidor Node.js)

1.  Navega al directorio del servidor:
    ```bash
    cd server
    ```
2.  Instala las dependencias de producción:
    ```bash
    npm install --production
    ```
3.  Configura las variables de entorno:
    ```bash
    cp .env.example .env
    nano .env
    ```
    Asegúrate de configurar las siguientes variables críticas en el archivo `.env`:
    ```env
    PORT=3000
    NODE_ENV=production
    APP_URL=http://tu-dominio.com/soporte
    API_URL=http://tu-dominio.com/soporte/api
    
    # Credenciales de Base de Datos
    DB_HOST=localhost
    DB_USER=usuario_db
    DB_PASSWORD=contraseña_segura
    DB_NAME=inventario_soporte
    ```

### 1.2 Frontend (Cliente Vue.js)

1.  Navega al directorio del cliente:
    ```bash
    cd ../client
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Construye la aplicación para producción:
    ```bash
    npm run build
    ```
    *Nota: La configuración `base: '/soporte/'` ya está definida en `vite.config.js`.*

4.  **Despliegue de Estáticos:**
    Copia el contenido generado en `client/dist/` a la carpeta pública del servidor Node.js. Esto permite que Node.js sirva tanto la API como el Frontend unificado.
    ```bash
    # Estando en la raíz del proyecto
    rm -rf server/public/*  # Limpia public anterior si existe (cuidado con uploads/)
    cp -r client/dist/* server/public/
    ```
    *Importante: Si tienes una carpeta `uploads` dentro de `server/public`, asegúrate de respaldarla o no borrarla.*

---

## 🗄️ 2. Base de Datos

1.  Asegúrate de que la base de datos `inventario_soporte` exista.
2.  Importa el esquema inicial si es una instalación nueva (revisar scripts en `server/src/database/` o documentación pertinente).

---

## 🌐 3. Configuración de Apache

Configura Apache para actuar como Proxy Inverso. Esto redirigirá todo el tráfico de `http://tu-dominio.com/soporte` hacia tu aplicación Node.js corriendo en el puerto 3000.

1.  Habilita los módulos necesarios (si no lo están):
    ```bash
    sudo a2enmod proxy
    sudo a2enmod proxy_http
    sudo systemctl restart apache2
    ```

2.  Edita tu archivo de configuración de VirtualHost (ej. `/etc/apache2/sites-available/000-default.conf` o el de tu dominio):

    ```apache
    <VirtualHost *:80>
        ServerName tu-dominio.com
        
        # ... otras configuraciones ...

        # Configuración para el Sistema de Inventario (/soporte)
        # La barra final es importante en ambas directivas para manejar correctamente los paths
        
        ProxyPreserveHost On
        
        # Redirigir /soporte hacia el servidor Node.js local
        ProxyPass /soporte http://localhost:3000/soporte
        ProxyPassReverse /soporte http://localhost:3000/soporte
        
    </VirtualHost>
    ```

3.  Verifica la configuración y reinicia Apache:
    ```bash
    sudo apachectl configtest
    sudo systemctl restart apache2
    ```

---

## 🚀 4. Ejecución con PM2

Utiliza PM2 para mantener el servidor Node.js activo en segundo plano.

1.  Inicia la aplicación desde el directorio `server`:
    ```bash
    cd server
    pm2 start server.js --name "inventario-api"
    ```

2.  Guarda la lista de procesos para que se inicien automáticamente al reiniciar el sistema:
    ```bash
    pm2 save
    pm2 startup
    # Sigue las instrucciones que te de el comando startup
    ```

---

## ✅ 5. Verificación

1.  Abre tu navegador y ve a `http://tu-dominio.com/soporte`.
2.  Deberías ver la página de inicio de sesión del sistema.
3.  Intenta iniciar sesión para verificar que la conexión con la API (`/soporte/api/...`) funciona correctamente.
