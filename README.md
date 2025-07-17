# 📦 Inventario Soporte

Sistema de gestión de inventario y soporte técnico para **Tarjetas Móviles Telefónicas** y **Lidifon**.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](docs/README_DOCKER.md)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](package.json)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](docker/docker-compose.yml)
[![License](https://img.shields.io/badge/License-Private-red)]()

## 🚀 Inicio Rápido

### Para Desarrollo con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone <url-del-repositorio>
cd inventario_soporte

# 2. Configurar variables de entorno
cp docker/.env.example docker/.env
# Editar docker/.env con tu IP local y generar JWT_SECRET

# 3. Iniciar con Docker
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh start
./scripts/docker-dev.sh seed

# 🔥 MODO DESARROLLO (Recomendado para desarrollo activo)
./scripts/docker-dev.sh dev  # Con recarga automática

# 4. Acceder a la aplicación
# http://TU_IP_LOCAL/soporte
# Usuario: linea | Contraseña: digital
```

📖 **[Ver Guía Completa de Docker →](docs/README_DOCKER.md)**

## 📋 Características Principales

### 🏢 **Gestión Empresarial**
- **Múltiples empresas**: TMT, Lidifon, Comercializadora Móvil, TA3
- **Sucursales y áreas**: Organización jerárquica completa
- **Empleados**: Gestión completa de personal

### 💻 **Inventario de Equipos**
- **Equipos informáticos**: Computadoras, laptops, monitores
- **Dispositivos de red**: Routers, switches, access points
- **Periféricos**: Teclados, mouse, impresoras, scanners
- **Seguimiento completo**: Estados, asignaciones, mantenimientos

### 🔧 **Gestión de Soporte**
- **Asignaciones**: Control de equipos por empleado
- **Mantenimientos**: Historial y programación
- **Direcciones IP**: Gestión de red completa
- **Cuentas de email**: Administración corporativa

### 🔐 **Sistema de Usuarios**
- **Autenticación JWT**: Seguridad robusta
- **Roles y permisos**: Control de acceso granular
- **Usuarios del sistema**: Gestión administrativa

## 🏗️ Arquitectura

### **Stack Tecnológico**
- **Backend**: Node.js + Express
- **Base de Datos**: MySQL 8.0
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Autenticación**: JWT (JSON Web Tokens)
- **Containerización**: Docker + Docker Compose

### **Arquitectura de Desarrollo**
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

## 📁 Estructura del Proyecto

```
inventario_soporte/
├── README.md                     # 📖 Este archivo
├── package.json                  # Dependencias Node.js
├── server.js                     # Servidor principal
├── seedAdmin.js                  # Script usuario admin
├── docs/                         # 📚 Documentación
│   ├── README_DOCKER.md          # Guía Docker completa
│   ├── README_DEVELOPMENT.md     # Guía de desarrollo
│   └── README_API.md             # Documentación de API
├── docker/                       # 🐳 Configuración Docker
│   ├── apache/                   # Configuración Apache
│   ├── nodejs/                   # Configuración Node.js
│   ├── .env.example              # Variables de entorno
│   └── docker-compose.yml        # Orquestación servicios
├── scripts/                      # 🛠️ Scripts de utilidades
│   └── docker-dev.sh             # Script desarrollo Docker
├── public/                       # 🎨 Archivos estáticos
│   ├── css/                      # Estilos CSS
│   ├── js/                       # JavaScript frontend
│   ├── images/                   # Imágenes y assets
│   └── index.html                # Página principal
└── src/                          # 💻 Código fuente
    ├── controllers/              # Controladores API
    ├── database/                 # Schema y configuración DB
    ├── middleware/               # Middleware autenticación
    ├── routes/                   # Rutas de la API
    └── config/                   # Configuraciones
```

## 🛠️ Desarrollo

### **🔥 Desarrollo con Recarga Automática**

El proyecto está optimizado para desarrollo rápido con **recarga automática**:

```bash
# Modo desarrollo (recomendado para desarrollo activo)
./scripts/docker-dev.sh dev

# ✅ Ventajas:
# • Cambios instantáneos al editar código
# • Nodemon detecta cambios y reinicia automáticamente
# • Logs en vivo para debugging
# • Sin necesidad de rebuild manual
```

### **📋 Cuándo usar cada comando:**

| Comando | Uso | Recarga Automática |
|---------|-----|-------------------|
| `dev` | Desarrollo activo | ✅ Sí |
| `start` | Desarrollo en background | ✅ Sí |
| `restart` | Cambios de configuración | ✅ Sí |
| `rebuild` | Cambios en package.json | ❌ No |

### **Comandos Principales**
```bash
# Desarrollo con Docker (Recomendado)
./scripts/docker-dev.sh dev       # 🔥 Modo desarrollo con recarga automática
./scripts/docker-dev.sh start     # Iniciar servicios en background
./scripts/docker-dev.sh logs      # Ver logs en tiempo real
./scripts/docker-dev.sh restart   # Reiniciar servicios
./scripts/docker-dev.sh rebuild   # Reconstruir después de cambios en dependencias
./scripts/docker-dev.sh stop      # Detener servicios

# Desarrollo tradicional
npm install                       # Instalar dependencias
npm start                        # Iniciar servidor
node seedAdmin.js                # Crear usuario admin
```

### **💡 Flujo de Desarrollo Típico**
```bash
# 1. Iniciar desarrollo
./scripts/docker-dev.sh dev

# 2. Editar código (server.js, src/*, public/*)
# Los cambios se reflejan automáticamente

# 3. Solo rebuild si cambias dependencias
./scripts/docker-dev.sh rebuild
```

### **Variables de Entorno Principales**
```env
# Aplicación
APP_URL=http://192.168.0.253/soporte
API_URL=http://192.168.0.253/soporte/api
NODE_ENV=development

# Base de datos
DB_HOST=inventario-db
DB_USER=herwingxtech
DB_PASSWORD=herwingx-dev
DB_NAME=inventario_soporte

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRE=24h
```

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| **[README_DOCKER.md](docs/README_DOCKER.md)** | Guía completa de Docker para desarrollo |
| **[README_DEVELOPMENT.md](docs/README_DEVELOPMENT.md)** | Guía de desarrollo y contribución |
| **[README_API.md](docs/README_API.md)** | Documentación completa de la API |

## 🔐 Credenciales por Defecto

**Usuario Administrador:**
- **Usuario**: `linea`
- **Contraseña**: `digital`

> ⚠️ **Importante**: Cambiar credenciales en producción

## 🚨 Solución de Problemas

### **Problemas Comunes**

**Docker no inicia:**
```bash
./scripts/docker-dev.sh logs
./scripts/docker-dev.sh restart
```

**Base de datos no conecta:**
```bash
./scripts/docker-dev.sh logs-db
sleep 30 && ./scripts/docker-dev.sh seed
```

**Puerto 80 ocupado:**
```bash
# Verificar qué usa el puerto
netstat -tulpn | grep :80
# Cambiar puerto en docker-compose.yml si es necesario
```

## 🤝 Contribución

### **Flujo de Desarrollo**
1. **Fork** del repositorio
2. **Crear rama** para nueva funcionalidad
3. **Desarrollar** usando Docker
4. **Probar** completamente
5. **Crear Pull Request**

### **Estándares de Código**
- **JavaScript ES6+**
- **Comentarios** en español
- **Nombres descriptivos** para variables y funciones
- **Estructura modular** por entidades

## 📄 Licencia

Este proyecto es **privado** y pertenece a **Tarjetas Móviles Telefónicas** y **Lidifon**.

---

## 🆘 Soporte

### **¿Necesitas Ayuda?**

1. **Revisa la documentación**: [docs/README_DOCKER.md](docs/README_DOCKER.md)
2. **Verifica logs**: `./scripts/docker-dev.sh logs`
3. **Reinicia servicios**: `./scripts/docker-dev.sh restart`
4. **Contacta al equipo de desarrollo**

### **Información del Sistema**
```bash
# Verificar versiones
docker --version
docker compose --version
node --version

# Estado de servicios
./scripts/docker-dev.sh status
```

---

**Desarrollado con ❤️ para TMT y Lidifon**

🚀 **¡Listo para desarrollar!** Usa `./scripts/docker-dev.sh start` para comenzar.