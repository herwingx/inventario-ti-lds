# Inventario Soporte - Guía de Instalación con Docker

## 🚀 Inicio Rápido (TL;DR)

¿Quieres levantar el proyecto rápidamente? Sigue estos pasos:

```bash
# 1. Verificar que tienes Docker instalado
docker --version

# 2. Clonar/navegar al directorio del proyecto
cd inventario_soporte

# 3. (Opcional) Crear archivo .env personalizado
cp .env.example .env

# 4. Levantar todos los servicios
docker compose up -d

# 5. Verificar que esté funcionando
docker compose ps

# 6. Acceder a la aplicación
# http://localhost/soporte
```

✅ **¿Todo funciona?** ¡Perfecto! Tu aplicación estará disponible en `http://localhost/soporte`

❌ **¿Algo salió mal?** Revisa la [sección de solución de problemas](#solución-de-problemas) más abajo.

---

## 📁 Estructura de Archivos Requerida

Antes de comenzar, asegúrate de que tu proyecto tenga la siguiente estructura de archivos en el directorio raíz:

```
inventario_soporte/
├── docker-compose.yml          # ← Archivo principal de orquestación
├── Dockerfile.nodejs           # ← Dockerfile para la aplicación Node.js
├── Dockerfile.apache           # ← Dockerfile para el proxy Apache
├── Dockerfile.mysql            # ← Dockerfile para MySQL
├── soporte.conf                # ← Configuración de Apache
├── package.json                # ← Dependencias de Node.js
├── package-lock.json           # ← Lock file de dependencias
├── server.js                   # ← Archivo principal de la aplicación
├── .env                        # ← Variables de entorno (se crea automáticamente)
├── .env.example                # ← Ejemplo de configuración
├── public/                     # ← Archivos estáticos (CSS, JS, imágenes)
│   ├── css/
│   ├── js/
│   └── images/
└── src/                        # ← Código fuente de la aplicación
    ├── database/
    │   └── db_soporte.sql      # ← Script SQL de inicialización
    ├── routes/
    ├── controllers/
    └── config/
```

### ⚠️ **Ubicación Crítica:**
- **Todos los Dockerfiles** deben estar en la **raíz del proyecto**
- **docker-compose.yml** debe estar en la **raíz del proyecto**
- **soporte.conf** debe estar en la **raíz del proyecto**
- **src/database/db_soporte.sql** debe existir para la inicialización de MySQL

### 🔍 **Verificar estructura:**
```bash
# Ejecutar desde el directorio del proyecto
ls -la

# Deberías ver:
# docker-compose.yml
# Dockerfile.nodejs
# Dockerfile.apache
# Dockerfile.mysql
# soporte.conf
# .env.example
# package.json
# server.js
# public/ (directorio)
# src/ (directorio)
```

## 🚀 Configuración de Variables de Entorno (.env)

### ❓ **¿Es necesario el archivo .env?**

**RESPUESTA**: **NO es estrictamente necesario**, pero es **MUY RECOMENDADO** para personalizar la configuración.

### 🔄 **¿Cómo funciona?**

1. **Sin .env**: El proyecto usará valores por defecto definidos en `docker-compose.yml`
2. **Con .env**: Puedes personalizar cualquier variable según tus necesidades
3. **El archivo .env se construye manualmente o copiando el ejemplo**

### 📝 **Crear archivo .env**

```bash
# Opción 1: Copiar desde el ejemplo
cp .env.example .env

# Opción 2: Crear desde cero
touch .env
```

### 📝 **Ejemplo de archivo .env**

```env
# ================================================
# CONFIGURACIÓN DE LA BASE DE DATOS
# ================================================

# Para usar MySQL en contenedor Docker (por defecto)
DB_HOST=inventario-db
DB_USER=herwingxtech
DB_PASSWORD=herwingx-dev
DB_NAME=inventario_soporte
DB_PORT=3306

# Para usar MySQL remoto (descomenta y cambia arriba)
# DB_HOST=192.168.0.140
# DB_USER=herwingx
# DB_PASSWORD=tu_contraseña_remota
# DB_NAME=inventario_soporte
# DB_PORT=3306

# ================================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ================================================
APP_URL=http://localhost/soporte
API_URL=http://localhost/soporte/api
PORT=3000
NODE_ENV=development

# ================================================
# CONFIGURACIÓN JWT
# ================================================
JWT_SECRET=KnLEgII2PGV1cxNy8aCFA1x4CP10mFwTt7GLSqjJ3X0lhWP4kf
JWT_EXPIRE=24h

# ================================================
# CONFIGURACIÓN DE MYSQL DOCKER
# ================================================
MYSQL_ROOT_PASSWORD=herwingx-dev
MYSQL_DATABASE=inventario_soporte
MYSQL_USER=herwingxtech
MYSQL_PASSWORD=herwingx-dev
```

## 🚀 MySQL con Docker (Recomendado)

### 🌟 **Ventajas de usar MySQL Docker:**

- ✅ **Fácil configuración**: No necesitas instalar MySQL en tu sistema
- ✅ **Aislamiento**: La base de datos vive en su propio contenedor
- ✅ **Persistencia**: Los datos se mantienen entre reinicios
- ✅ **Portabilidad**: Funciona igual en cualquier sistema
- ✅ **Desarrollo**: Ideal para equipos de desarrollo

### 🔧 **Configuración automática**

El proyecto **YA ESTÁ CONFIGURADO** para usar MySQL Docker por defecto:

1. **Servicio MySQL**: Definido en `docker-compose.yml`
2. **Inicialización automática**: Usa `src/database/db_soporte.sql`
3. **Persistencia**: Datos guardados en volúmenes Docker
4. **Health checks**: Verifica que MySQL esté listo

### 🚀 **Levantar el sistema completo**

```bash
# Levantar todos los servicios (MySQL + App + Apache)
docker compose up -d

# Ver el estado de los contenedores
docker compose ps

# Ver logs de MySQL
docker compose logs inventario-db

# Ver logs de la aplicación
docker compose logs inventario-app
```

### 🔍 **Verificar MySQL Docker**

```bash
# Conectar al contenedor MySQL
docker compose exec inventario-db mysql -u herwingxtech -p

# Verificar base de datos
mysql> SHOW DATABASES;
mysql> USE inventario_soporte;
mysql> SHOW TABLES;

# Salir de MySQL
mysql> exit
```

### 🔄 **Cambiar a MySQL remoto**

Si prefieres usar una base de datos remota:

1. **Edita tu archivo .env**:
```env
DB_HOST=192.168.0.140
DB_USER=tu_usuario_remoto
DB_PASSWORD=tu_contraseña_remota
DB_NAME=inventario_soporte
DB_PORT=3306
```

2. **Comentar servicio MySQL** en `docker-compose.yml`:
```yaml
# inventario-db:
#   build:
#     context: .
#     dockerfile: Dockerfile.mysql
#   # ... resto del servicio
```

3. **Remover dependencia** en el servicio de app:
```yaml
# depends_on:
#   - inventario-db
```

### 📊 **Persistencia de datos**

Los datos de MySQL se guardan en volúmenes Docker:

- `mysql_data`: Datos de la base de datos
- `mysql_logs`: Logs de MySQL

```bash
# Ver volúmenes
docker volume ls

# Inspeccionar volumen de datos
docker volume inspect inventario_soporte_mysql_data

# Respaldar volúmenes
docker run --rm -v inventario_soporte_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

Este documento explica cómo configurar y ejecutar el sistema de inventario de soporte usando Docker y Docker Compose.

## 🚀 ¿Por qué Docker Compose con contenedores separados?

### Ventajas de la Arquitectura de Microservicios con Docker:

**🔄 Separación de Responsabilidades:**
- **Apache (Proxy/Load Balancer)**: Maneja requests HTTP, SSL, archivos estáticos
- **Node.js (Aplicación)**: Lógica de negocio, API, autenticación
- **MySQL (Base de Datos)**: Almacenamiento de datos (ejecutándose externamente)

**⚡ Escalabilidad:**
```bash
# Escalar solo la aplicación Node.js a 3 instancias
docker compose up -d --scale inventario-app=3
```

**🛠️ Mantenimiento Independiente:**
- Actualizar Apache sin afectar Node.js
- Reiniciar aplicación sin tocar el proxy
- Diferentes versiones de tecnologías

**🔒 Seguridad:**
- Node.js no expuesto directamente al internet
- Apache actúa como firewall de aplicación
- Aislamiento de red entre contenedores

**🎯 Ventajas vs Monolito:**
- **Desarrollo paralelo**: Equipos pueden trabajar independientemente
- **Deployment granular**: Deploy solo lo que cambió
- **Fault isolation**: Si Apache falla, Node.js sigue corriendo internamente
- **Technology diversity**: Diferentes versiones/configuraciones por servicio

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
3. [Dependencias del Proyecto](#dependencias-del-proyecto)
4. [Archivos de Configuración](#archivos-de-configuración)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Uso](#uso)
7. [Solución de Problemas](#solución-de-problemas)

## 🔧 Requisitos Previos

### Instalar Docker en distros basadas en Debian/Ubuntu

```bash
# Actualizar el sistema
sudo apt update -y

# Instalar paquetes necesarios
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Agregar la clave GPG oficial de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Establecer el repo de Docker
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Actualizar e instalar Docker
sudo apt update -y
sudo apt install docker-ce -y

# Habilitar e iniciar Docker
sudo systemctl enable docker
sudo systemctl start docker

# Agregar usuario al grupo docker (opcional, para ejecutar sin sudo)
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar para aplicar cambios
```

### Instalar Docker en Fedora Linux

```bash
# Actualizar el sistema
sudo dnf update -y

# Instalar Docker
sudo dnf install docker

# Habilitar e iniciar Docker
sudo systemctl enable docker
sudo systemctl start docker

# Agregar usuario al grupo docker (opcional, para ejecutar sin sudo)
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar para aplicar cambios
```

### Instalar Docker en RHEL/CentOS/Rocky Linux

```bash
# Actualizar el sistema
sudo dnf update -y
# O para versiones más antiguas: sudo yum update -y

# Instalar utilidades necesarias
sudo dnf install -y yum-utils device-mapper-persistent-data lvm2

# Agregar repositorio oficial de Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker CE
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Para RHEL 8/9 con podman pre-instalado, remove conflictos:
# sudo dnf remove podman buildah

# Habilitar e iniciar Docker
sudo systemctl enable docker
sudo systemctl start docker

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar para aplicar cambios
```

### Instalar Docker Compose

```bash
# Docker Compose viene incluido con Docker Desktop
# Para verificar la instalación:
docker compose version
```

### Verificar instalación

```bash
# Verificar Docker
docker --version
docker run hello-world

# Verificar Docker Compose
docker compose --version
```

## 🏗️ Arquitectura de la Aplicación

La aplicación utiliza una arquitectura de microservicios con los siguientes componentes:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cliente Web   │    │  Apache Proxy   │    │  Node.js App    │
│   (Navegador)   │───▶│     (Puerto 80) │───▶│   (Puerto 3000) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              │                         │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Red Docker    │    │   Base de Datos │
                       │ inventario-net  │    │   MySQL Remota  │
                       └─────────────────┘    └─────────────────┘
```

## 📦 Dependencias del Proyecto

### Dependencias de Node.js (package.json)

```json
{
  "name": "inventario_soporte",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "@tailwindcss/cli": "^4.1.10",
    "bcrypt": "^6.0.0",
    "bootstrap-select": "^1.13.18",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.14.1"
  }
}
```

**Descripción de dependencias:**
- **express**: Framework web para Node.js
- **mysql2**: Driver MySQL para Node.js
- **bcrypt**: Librería para encriptación de contraseñas
- **jsonwebtoken**: Implementación de JWT para autenticación
- **dotenv**: Carga variables de entorno desde archivos .env
- **@tailwindcss/cli**: Framework CSS
- **bootstrap-select**: Plugin jQuery para select boxes

## 📄 Archivos de Configuración

### 1. docker-compose.yml

```yaml
version: '3.8'

services:
  inventario-app:
    build:
      context: .
      dockerfile: Dockerfile.nodejs
    container_name: inventario-nodejs-app
    restart: always
    environment:
      # Configuración de la base de datos
      DB_HOST: 192.168.0.140
      DB_USER: herwingx
      DB_PASSWORD: LDSinf08l$
      DB_NAME: inventario_soporte
      DB_PORT: 3306
      # Configuración JWT
      JWT_SECRET: KnLEgII2PGV1cxNy8aCFA1x4CP10mFwTt7GLSqjJ3X0lhWP4kf
      JWT_EXPIRE: 24h
      # Configuración de la aplicación
      APP_URL: http://localhost/inventario
      API_URL: http://localhost/inventario/api
      PORT: 3000
      NODE_ENV: production
    # NOTA: El volumen está comentado para producción
    # para evitar sobreescribir node_modules instalado en la imagen
    #volumes:
    #  - .:/app
    networks:
      - inventario-network

  apache-proxy:
    build:
      context: .
      dockerfile: Dockerfile.apache
    container_name: inventario-apache-proxy
    restart: always
    ports:
      - "80:80" # Mapea puerto 80 del contenedor al puerto 80 del host
    depends_on:
      - inventario-app
    networks:
      - inventario-network

networks:
  inventario-network:
    driver: bridge
```

### 2. Dockerfile.nodejs

```dockerfile
# Usa una imagen base de Node.js
FROM node:latest

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias para aprovechar el cache de Docker
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto en el que la aplicación Node.js escuchará
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
```

### 3. Dockerfile.apache

```dockerfile
# Usa una imagen base de Ubuntu para Apache
FROM ubuntu:latest

# Instala Apache y módulos necesarios
RUN apt update && \
    apt install -y apache2 && \
    a2enmod proxy proxy_http headers mime rewrite ssl && \
    rm -rf /var/lib/apt/lists/*

# Copia tu archivo de configuración de Apache
COPY inventario.conf /etc/apache2/sites-available/inventario.conf

# Elimina la configuración por defecto y habilita la nueva
RUN a2dissite 000-default.conf && \
    a2ensite inventario.conf

# Copia los archivos estáticos de tu aplicación
COPY public /var/www/html/inventario_soporte/public

# Expone el puerto 80 de Apache
EXPOSE 80

# Comando para mantener Apache corriendo en primer plano
CMD ["apache2ctl", "-D", "FOREGROUND"]
```

### 4. inventario.conf (Configuración de Apache)

```apache
<VirtualHost *:80>
    ServerName localhost

    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy para la API - MÁS ESPECÍFICO PRIMERO
    ProxyPass /inventario/api/ http://inventario-app:3000/api/
    ProxyPassReverse /inventario/api/ http://inventario-app:3000/api/

    # Proxy para la aplicación principal - MÁS GENERAL DESPUÉS
    ProxyPass /inventario/ http://inventario-app:3000/inventario/
    ProxyPassReverse /inventario/ http://inventario-app:3000/inventario/

    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    RequestHeader set X-Forwarded-Prefix "/inventario"

    # La ruta de los archivos estáticos dentro del contenedor Apache
    <Directory /var/www/html/inventario_soporte/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Alias para archivos estáticos del inventario
    Alias /inventario /var/www/html/inventario_soporte/public

    <IfModule mod_mime.c>
        AddType text/css .css
        AddType application/javascript .js
        AddType image/svg+xml .svg
        AddType image/png .png
        AddType image/jpeg .jpg .jpeg
        AddType image/gif .gif
        AddType image/x-icon .ico
        AddType application/font-woff .woff
        AddType application/font-woff2 .woff2
        AddType application/x-font-ttf .ttf
        AddType application/vnd.ms-fontobject .eot
    </IfModule>

    <IfModule mod_headers.c>
        <FilesMatch "\.css$">
            Header set Content-Type "text/css"
        </FilesMatch>

        <FilesMatch "\.js$">
            Header set Content-Type "application/javascript"
        </FilesMatch>

        <FilesMatch "\.svg$">
            Header set Content-Type "image/svg+xml"
        </FilesMatch>
    </IfModule>
</VirtualHost>
```

## 🚀 Instalación y Configuración

### Paso 1: Clonar o preparar el proyecto

```bash
# Si el proyecto está en un repositorio
git clone <url-del-repositorio>
cd inventario_soporte

# O si ya tienes los archivos
cd /ruta/al/proyecto/inventario_soporte
```

### Paso 2: Verificar archivos necesarios

Asegúrate de tener los siguientes archivos en tu directorio:

```
inventario_soporte/
├── docker-compose.yml
├── Dockerfile.nodejs
├── Dockerfile.apache
├── inventario.conf
├── package.json
├── server.js
├── public/
│   └── [archivos estáticos]
└── src/
    └── [código fuente]
```

### Paso 3: Configurar variables de entorno

Edita el archivo `docker-compose.yml` y actualiza las siguientes variables según tu configuración:

```yaml
environment:
  DB_HOST: tu_servidor_mysql
  DB_USER: tu_usuario
  DB_PASSWORD: tu_contraseña
  DB_NAME: inventario_soporte
  JWT_SECRET: tu_clave_secreta_jwt
```

### Paso 4: Construir las imágenes Docker

```bash
# Construir todas las imágenes sin usar cache
docker compose build --no-cache
```

### Paso 5: Levantar los servicios

```bash
# Levantar en modo daemon (segundo plano)
docker compose up -d

# O levantar en modo interactivo para ver logs
docker compose up
```

### Paso 6: Verificar que los servicios estén funcionando

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs de todos los servicios
docker compose logs

# Ver logs de un servicio específico
docker compose logs inventario-app
docker compose logs apache-proxy
```

## 🌐 Uso

### Acceder a la aplicación

Una vez que los contenedores estén ejecutándose, puedes acceder a la aplicación en:

- **URL principal**: `http://localhost/soporte`
- **Con tu IP local**: `http://192.168.0.253/soporte` (reemplaza con tu IP)
- **API**: `http://localhost/soporte/api`
- **Prueba de DB**: `http://localhost/soporte/db-test`

### Comandos útiles

```bash
# Detener todos los servicios
docker compose down

# Detener un servicio específico
docker compose stop inventario-app

# Reiniciar un servicio específico
docker compose restart inventario-app

# Ver logs en tiempo real
docker compose logs -f

# Ejecutar comandos dentro de un contenedor
docker compose exec inventario-app bash

# Reconstruir y levantar servicios
docker compose up -d --build
```

## 🔧 Solución de Problemas

### Problema 1: Error "Cannot find module 'express'"

**Síntoma**: El contenedor Node.js se reinicia constantemente con error de módulo no encontrado.

**Solución**: 
- Asegúrate de que el volumen esté comentado en `docker-compose.yml`
- Reconstruye la imagen: `docker compose build --no-cache inventario-app`

### Problema 2: Error "DNS lookup failure for: inventario-app"

**Síntoma**: Apache no puede conectar con la aplicación Node.js.

**Solución**:
- Verifica que ambos contenedores estén en la misma red
- Revisa los logs: `docker compose logs apache-proxy`

### Problema 3: Puerto 80 ocupado

**Síntoma**: Error al iniciar Apache - puerto 80 en uso.

**Solución**:
```bash
# Ver qué está usando el puerto 80
sudo netstat -tulpn | grep :80

# Detener el servicio que usa el puerto (ej: httpd, nginx)
sudo systemctl stop httpd
sudo systemctl stop nginx
```

### Problema 4: Error de sintaxis en Apache

**Síntoma**: Apache se reinicia constantemente.

**Solución**:
- Verifica la sintaxis de `inventario.conf`
- Revisa los logs: `docker compose logs apache-proxy`

### Problema 5: Error "The 'variable' variable is not set" al iniciar Docker Compose

**Síntoma**: Docker Compose muestra advertencias sobre variables no definidas, especialmente con variables que contienen símbolos como `$`.

**Solución**:
- Revisa tu archivo `.env` para variables que contengan el símbolo `$`
- Escapa el símbolo `$` duplicándolo: `$$`
- Ejemplo: `JWT_SECRET=password$123` → `JWT_SECRET=password$$123`

### Problema 6: MySQL se reinicia continuamente con error de usuario root

**Síntoma**: El contenedor MySQL se reinicia constantemente con error "MYSQL_USER cannot be 'root'".

**Solución**:
- No uses `root` como valor para `MYSQL_USER`
- Usa un usuario regular como `herwingxtech` o `inventario_user`
- Ejemplo en `.env`:
  ```env
  MYSQL_USER=herwingxtech
  MYSQL_PASSWORD=tu_contraseña
  DB_USER=herwingxtech
  DB_PASSWORD=tu_contraseña
  ```

### Problema 7: MySQL tarda mucho en inicializar o falla el health check

**Síntoma**: MySQL se reinicia o el health check falla constantemente.

**Solución**:
- Simplifica el Dockerfile de MySQL usando MySQL 8.0 en lugar de `latest`
- Usa health checks más simples: `mysqladmin ping`
- Elimina configuraciones complejas que pueden causar problemas
- Espera más tiempo para la inicialización completa (puede tomar 2-3 minutos)

### Comandos de diagnóstico

```bash
# Verificar conectividad de red entre contenedores
docker compose exec apache-proxy ping inventario-app

# Verificar configuración de red
docker network inspect inventario_soporte_inventario-network

# Probar la aplicación desde línea de comandos
curl -I http://localhost/inventario
```

## 📚 Notas Adicionales

### Para Desarrollo

Si necesitas hacer cambios en el código y verlos en tiempo real:

1. Descomenta las líneas de volumen en `docker-compose.yml`:
```yaml
volumes:
  - .:/app
```

2. Instala dependencias localmente:
```bash
npm install
```

3. Reinicia los servicios:
```bash
docker compose restart inventario-app
```

### Para Producción

- Mantén comentadas las líneas de volumen
- Usa variables de entorno seguras
- Considera usar Docker secrets para información sensible
- Configura logs apropiados para monitoreo

### Respaldos

```bash
# Respaldar imágenes
docker save inventario_soporte-inventario-app > inventario-app.tar
docker save inventario_soporte-apache-proxy > apache-proxy.tar

# Restaurar imágenes
docker load < inventario-app.tar
docker load < apache-proxy.tar
```

---

**Desarrollado por**: HerwingXTech  
**Fecha**: Julio 2025  
**Versión**: 1.0.0
