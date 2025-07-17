# 🔌 Inventario Soporte - Documentación de API

Documentación completa de la API REST del sistema **Inventario Soporte**.

## 📋 Tabla de Contenidos

- [🚀 Información General](#-información-general)
- [🔐 Autenticación](#-autenticación)
- [👥 Usuarios y Autenticación](#-usuarios-y-autenticación)
- [🏢 Empresas](#-empresas)
- [🏪 Sucursales](#-sucursales)
- [👨‍💼 Empleados](#-empleados)
- [💻 Equipos](#-equipos)
- [🌐 Direcciones IP](#-direcciones-ip)
- [📧 Cuentas Email](#-cuentas-email)
- [🔧 Mantenimientos](#-mantenimientos)
- [📝 Notas](#-notas)
- [🔗 Asignaciones](#-asignaciones)
- [❌ Códigos de Error](#-códigos-de-error)

## 🚀 Información General

### **Base URL**
```
http://TU_IP_LOCAL/soporte/api
```

### **Formato de Respuesta**
Todas las respuestas están en formato JSON:

```json
{
  "success": true,
  "data": [...],
  "message": "Operación exitosa"
}
```

### **Headers Requeridos**
```http
Content-Type: application/json
Authorization: Bearer <token_jwt>  # Para rutas protegidas
```

## 🔐 Autenticación

### **Login**
Obtener token de acceso.

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "username": "linea",
  "password": "digital"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "linea",
      "email": "admin@linea-digital.com",
      "id_rol": 1
    }
  },
  "message": "Login exitoso"
}
```

### **Verificar Token**
Verificar si el token es válido.

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```http
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "username": "linea",
      "id_rol": 1
    }
  }
}
```

## 👥 Usuarios y Autenticación

### **Listar Usuarios**
**Endpoint:** `GET /api/usuarios-sistema`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "linea",
      "email": "admin@linea-digital.com",
      "id_rol": 1,
      "nombre_rol": "Administrador",
      "id_status": 1,
      "nombre_status": "Activo",
      "fecha_creacion": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### **Crear Usuario**
**Endpoint:** `POST /api/usuarios-sistema`

**Body:**
```json
{
  "username": "nuevo_usuario",
  "email": "usuario@empresa.com",
  "password": "contraseña_segura",
  "id_rol": 2,
  "id_status": 1
}
```

## 🏢 Empresas

### **Listar Empresas**
**Endpoint:** `GET /api/empresas`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Tarjetas Moviles Telefonicas",
      "fecha_registro": "2024-01-01T00:00:00.000Z",
      "id_status": 1,
      "nombre_status": "Activo"
    },
    {
      "id": 2,
      "nombre": "Lidifon",
      "fecha_registro": "2024-01-01T00:00:00.000Z",
      "id_status": 1,
      "nombre_status": "Activo"
    }
  ]
}
```

### **Obtener Empresa por ID**
**Endpoint:** `GET /api/empresas/:id`

**Parámetros:**
- `id` (number): ID de la empresa

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Tarjetas Moviles Telefonicas",
    "fecha_registro": "2024-01-01T00:00:00.000Z",
    "id_status": 1,
    "nombre_status": "Activo"
  }
}
```

### **Crear Empresa**
**Endpoint:** `POST /api/empresas`

**Body:**
```json
{
  "nombre": "Nueva Empresa",
  "id_status": 1
}
```

### **Actualizar Empresa**
**Endpoint:** `PUT /api/empresas/:id`

**Body:**
```json
{
  "nombre": "Nombre Actualizado",
  "id_status": 1
}
```

### **Eliminar Empresa**
**Endpoint:** `DELETE /api/empresas/:id`

## 🏪 Sucursales

### **Listar Sucursales**
**Endpoint:** `GET /api/sucursales`

**Query Parameters:**
- `id_empresa` (optional): Filtrar por empresa

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Corporativo TMT Tuxtla",
      "direccion": "1a Avenida Norte Poniente #834, Centro",
      "numero_telefono": "9616189200",
      "id_empresa": 1,
      "nombre_empresa": "Tarjetas Moviles Telefonicas",
      "id_tipo_sucursal": 1,
      "nombre_tipo": "Corporativo",
      "id_status": 1,
      "nombre_status": "Activo"
    }
  ]
}
```

### **Crear Sucursal**
**Endpoint:** `POST /api/sucursales`

**Body:**
```json
{
  "nombre": "Nueva Sucursal",
  "direccion": "Dirección completa",
  "numero_telefono": "9999999999",
  "id_empresa": 1,
  "id_tipo_sucursal": 1,
  "id_status": 1
}
```

## 👨‍💼 Empleados

### **Listar Empleados**
**Endpoint:** `GET /api/empleados`

**Query Parameters:**
- `id_empresa` (optional): Filtrar por empresa
- `id_sucursal` (optional): Filtrar por sucursal
- `id_area` (optional): Filtrar por área

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_empleado": "21",
      "nombres": "JOSE ALFREDO",
      "apellidos": "ALCALA CARDONA",
      "email_personal": "jose_alcala@linea-digital.com",
      "telefono": null,
      "puesto": "GERENTE DE ATENCION Y DESARROLLO",
      "fecha_nacimiento": null,
      "fecha_ingreso": "2008-08-01",
      "id_empresa": 1,
      "nombre_empresa": "Tarjetas Moviles Telefonicas",
      "id_sucursal": 1,
      "nombre_sucursal": "Corporativo TMT Tuxtla",
      "id_area": 1,
      "nombre_area": "ATENCION Y DESARROLLO",
      "id_status": 1,
      "nombre_status": "Activo"
    }
  ]
}
```

### **Crear Empleado**
**Endpoint:** `POST /api/empleados`

**Body:**
```json
{
  "numero_empleado": "1001",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez López",
  "email_personal": "juan.perez@email.com",
  "telefono": "9999999999",
  "puesto": "Desarrollador",
  "fecha_nacimiento": "1990-01-01",
  "fecha_ingreso": "2024-01-01",
  "id_empresa": 1,
  "id_sucursal": 1,
  "id_area": 10,
  "id_status": 1
}
```

## 💻 Equipos

### **Listar Equipos**
**Endpoint:** `GET /api/equipos`

**Query Parameters:**
- `id_tipo_equipo` (optional): Filtrar por tipo
- `id_sucursal_actual` (optional): Filtrar por sucursal
- `id_status` (optional): Filtrar por estado

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_serie": "ABC123456",
      "nombre_equipo": "Computadora Oficina 1",
      "marca": "Dell",
      "modelo": "OptiPlex 7090",
      "id_tipo_equipo": 1,
      "nombre_tipo": "Computadora",
      "id_sucursal_actual": 1,
      "nombre_sucursal": "Corporativo TMT Tuxtla",
      "procesador": "Intel Core i5-11500",
      "ram": "16GB DDR4",
      "disco_duro": "512GB SSD",
      "sistema_operativo": "Windows 11 Pro",
      "mac_address": "00:1B:44:11:3A:B7",
      "otras_caracteristicas": "Monitor incluido",
      "fecha_compra": "2024-01-15",
      "id_status": 1,
      "nombre_status": "Activo"
    }
  ]
}
```

### **Crear Equipo**
**Endpoint:** `POST /api/equipos`

**Body:**
```json
{
  "numero_serie": "XYZ789012",
  "nombre_equipo": "Laptop Desarrollo",
  "marca": "Lenovo",
  "modelo": "ThinkPad X1 Carbon",
  "id_tipo_equipo": 2,
  "id_sucursal_actual": 1,
  "procesador": "Intel Core i7-12700U",
  "ram": "32GB DDR5",
  "disco_duro": "1TB SSD",
  "sistema_operativo": "Windows 11 Pro",
  "mac_address": "00:1B:44:11:3A:B8",
  "otras_caracteristicas": "Pantalla 4K",
  "fecha_compra": "2024-02-01",
  "id_status": 1
}
```

## 🌐 Direcciones IP

### **Listar Direcciones IP**
**Endpoint:** `GET /api/direcciones-ip`

**Query Parameters:**
- `id_sucursal` (optional): Filtrar por sucursal
- `id_status` (optional): Filtrar por estado

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "direccion_ip": "192.168.0.5",
      "id_sucursal": 1,
      "nombre_sucursal": "Corporativo TMT Tuxtla",
      "comentario": "Servidor principal",
      "id_status": 4,
      "nombre_status": "Asignado"
    }
  ]
}
```

### **Crear Dirección IP**
**Endpoint:** `POST /api/direcciones-ip`

**Body:**
```json
{
  "direccion_ip": "192.168.0.100",
  "id_sucursal": 1,
  "comentario": "Nueva dirección para equipo",
  "id_status": 5
}
```

## 📧 Cuentas Email

### **Listar Cuentas Email**
**Endpoint:** `GET /api/cuentas-email`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "direccion_email": "admin@linea-digital.com",
      "id_empleado": 1,
      "nombre_empleado": "JOSE ALFREDO ALCALA CARDONA",
      "tipo_cuenta": "Corporativo",
      "servidor_smtp": "smtp.gmail.com",
      "puerto_smtp": 587,
      "servidor_imap": "imap.gmail.com",
      "puerto_imap": 993,
      "id_status": 1,
      "nombre_status": "Activo"
    }
  ]
}
```

## 🔧 Mantenimientos

### **Listar Mantenimientos**
**Endpoint:** `GET /api/mantenimientos`

**Query Parameters:**
- `id_equipo` (optional): Filtrar por equipo
- `tipo_mantenimiento` (optional): Filtrar por tipo

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_equipo": 1,
      "nombre_equipo": "Computadora Oficina 1",
      "tipo_mantenimiento": "Preventivo",
      "descripcion": "Limpieza general y actualización de software",
      "fecha_programada": "2024-03-01",
      "fecha_realizada": "2024-03-01",
      "tecnico_responsable": "Juan Pérez",
      "observaciones": "Mantenimiento completado sin problemas",
      "costo": 500.00,
      "id_status": 6,
      "nombre_status": "Finalizado"
    }
  ]
}
```

### **Crear Mantenimiento**
**Endpoint:** `POST /api/mantenimientos`

**Body:**
```json
{
  "id_equipo": 1,
  "tipo_mantenimiento": "Correctivo",
  "descripcion": "Reparación de disco duro",
  "fecha_programada": "2024-03-15",
  "tecnico_responsable": "María González",
  "costo": 1200.00,
  "id_status": 10
}
```

## 📝 Notas

### **Listar Notas**
**Endpoint:** `GET /api/notas`

**Query Parameters:**
- `entidad_tipo` (optional): Filtrar por tipo de entidad
- `entidad_id` (optional): Filtrar por ID de entidad

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "entidad_tipo": "equipos",
      "entidad_id": 1,
      "titulo": "Problema con el equipo",
      "contenido": "El equipo presenta lentitud al iniciar",
      "id_usuario_creador": 1,
      "nombre_usuario": "linea",
      "fecha_creacion": "2024-02-15T10:30:00.000Z",
      "id_status": 1,
      "nombre_status": "Activo"
    }
  ]
}
```

### **Crear Nota**
**Endpoint:** `POST /api/notas`

**Body:**
```json
{
  "entidad_tipo": "equipos",
  "entidad_id": 1,
  "titulo": "Nueva observación",
  "contenido": "Detalles de la observación o nota importante",
  "id_status": 1
}
```

## 🔗 Asignaciones

### **Listar Asignaciones**
**Endpoint:** `GET /api/asignaciones`

**Query Parameters:**
- `id_empleado` (optional): Filtrar por empleado
- `id_equipo` (optional): Filtrar por equipo

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_empleado": 1,
      "nombre_empleado": "JOSE ALFREDO ALCALA CARDONA",
      "id_equipo": 1,
      "nombre_equipo": "Computadora Oficina 1",
      "id_direccion_ip": 1,
      "direccion_ip": "192.168.0.5",
      "fecha_asignacion": "2024-01-15",
      "fecha_devolucion": null,
      "observaciones": "Asignación inicial",
      "id_status": 4,
      "nombre_status": "Asignado"
    }
  ]
}
```

### **Crear Asignación**
**Endpoint:** `POST /api/asignaciones`

**Body:**
```json
{
  "id_empleado": 1,
  "id_equipo": 1,
  "id_direccion_ip": 1,
  "fecha_asignacion": "2024-03-01",
  "observaciones": "Asignación para nuevo proyecto",
  "id_status": 4
}
```

## ❌ Códigos de Error

### **Códigos HTTP**
- `200` - OK: Operación exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos inválidos
- `401` - Unauthorized: Token inválido o faltante
- `403` - Forbidden: Sin permisos suficientes
- `404` - Not Found: Recurso no encontrado
- `500` - Internal Server Error: Error del servidor

### **Formato de Error**
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detalles adicionales del error"
  }
}
```

### **Errores Comunes**

**Token Inválido:**
```json
{
  "success": false,
  "message": "Token inválido o expirado",
  "error": {
    "code": "INVALID_TOKEN"
  }
}
```

**Datos Faltantes:**
```json
{
  "success": false,
  "message": "Campos requeridos faltantes",
  "error": {
    "code": "MISSING_FIELDS",
    "fields": ["nombre", "email"]
  }
}
```

**Recurso No Encontrado:**
```json
{
  "success": false,
  "message": "Empresa no encontrada",
  "error": {
    "code": "NOT_FOUND",
    "resource": "empresa",
    "id": 999
  }
}
```

---

## 🔧 Herramientas de Testing

### **Postman Collection**
Puedes importar esta colección en Postman para probar la API:

```json
{
  "info": {
    "name": "Inventario Soporte API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost/soporte/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"linea\",\n  \"password\": \"digital\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

### **cURL Examples**

**Login:**
```bash
curl -X POST http://localhost/soporte/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"linea","password":"digital"}'
```

**Listar Empresas:**
```bash
curl -X GET http://localhost/soporte/api/empresas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Crear Equipo:**
```bash
curl -X POST http://localhost/soporte/api/equipos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "numero_serie": "TEST123",
    "nombre_equipo": "Equipo de Prueba",
    "marca": "Dell",
    "modelo": "Test Model",
    "id_tipo_equipo": 1,
    "id_sucursal_actual": 1,
    "id_status": 1
  }'
```

---

¡API lista para usar! 🚀 

Para más información, consulta la [Guía de Desarrollo](README_DEVELOPMENT.md).