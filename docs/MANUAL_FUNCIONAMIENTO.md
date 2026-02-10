# 📘 Manual de Funcionamiento Técnico

> **Ecosistema: Sistema de Inventario TI & Soporte**
> 
> Este documento describe la lógica interna, el flujo de datos y las mecánicas de software que rigen la aplicación. Es una guía de referencia para entender cómo interactúan los componentes del Stack MEVN.

---

## 1. 🔐 Seguridad y Autenticación (JWT Flow)

El sistema utiliza una arquitectura de autenticación **Stateless** basada en JSON Web Tokens (JWT).

### Flujo de Inicio de Sesión
1.  **Solicitud:** El usuario envía `username` y `password` a `/api/auth/login`.
2.  **Validación:** El servidor verifica las credenciales y genera un token firmado con `JWT_SECRET`.
3.  **Entrega:** El servidor responde con el token y los datos básicos del usuario (rol, nombre).
4.  **Persistencia:** El cliente (Vue) guarda el token en `localStorage` y lo inyecta en el estado global de **Pinia**.

### Protección de Rutas (Middleware)
*   **`protect`:** Middleware que intercepta las peticiones al backend, verifica que el header `Authorization: Bearer <token>` sea válido y decodifica la identidad del usuario.
*   **`isSupportOrAdmin`:** Filtro de autorización que bloquea acciones de escritura para usuarios con roles de solo lectura.

---

## 2. 🏗️ Arquitectura del Backend (API REST)

El backend está diseñado siguiendo el principio de **Separación de Responsabilidades**.

### Estructura de una Petición
1.  **Route:** Define el endpoint (ej. `POST /api/equipos`).
2.  **Middleware:** Valida autenticación y permisos.
3.  **Schema Validation (Zod):** Antes de procesar, se valida que el cuerpo de la petición (`req.body`) cumpla con el esquema técnico (ej. que el `numero_serie` sea string y no esté vacío).
4.  **Controller:** Orquesta la lógica. Llama al servicio correspondiente y maneja las respuestas HTTP (`200 OK`, `400 Bad Request`, `500 Error`).
5.  **Service:** Realiza la comunicación con la base de datos a través de **Prisma ORM**.
6.  **Logger:** Cada operación importante (éxito o error) se registra en consola y archivos de log para depuración.

---

## 3. 🎨 Funcionamiento del Frontend (Vue SPA)

### Comunicación con la API
*   **Axios Interceptors:** Contamos con un cliente HTTP centralizado en `services/api.js`.
    *   **Request Interceptor:** Adjunta automáticamente el token JWT del `localStorage` a cada salida.
    *   **Response Interceptor:** Si detecta un error `401` (sesión expirada), fuerza un logout y redirige al usuario al login para proteger el sistema.

### Gestión de Estado (Pinia)
*   **Auth Store:** Mantiene la reactividad de la sesión. Si el usuario cambia su nombre en el perfil, se actualiza en toda la interfaz instantáneamente sin recargar la página.
*   **Theme Store:** Gestiona la preferencia de modo oscuro/claro de forma persistente.

---

## 4. 🎫 Sistema de Soporte y QR (Fase 2)

Una de las características innovadoras es el flujo de soporte desacoplado.

1.  **Generación de QR:** Cada equipo registrado tiene un `qr_token` único y aleatorio.
2.  **Acceso Público:** Al escanear el QR, el sistema redirige a una landing page pública (`/q/:token`).
3.  **Reporte de Falla:** El usuario puede describir un problema y adjuntar su correo. Esto crea un registro en la tabla `tickets`.
4.  **Notificación:** El sistema (vía Cron Jobs) puede detectar tickets nuevos y alertar al departamento de TI.
5.  **Seguimiento:** El reportante recibe un token de seguimiento para consultar el estado de su ticket sin tener que loguearse en el sistema administrativo.

---

## 5. 🗄️ Gestión de Base de Datos y Auditoría

### Integridad Referencial
El sistema utiliza claves foráneas estrictas. Por ejemplo, no se puede eliminar una `Empresa` si tiene `Sucursales` activas, protegiendo la consistencia de los reportes.

### Auditoría Forense (`logs_sistema`)
Cuando un administrador realiza cambios sensibles (editar un equipo, dar de baja un empleado), un middleware de auditoría captura:
*   **Quién:** ID del usuario.
*   **Qué:** Valores anteriores vs. Valores nuevos (en formato JSON).
*   **Dónde:** Dirección IP y Navegador.
*   **Cuándo:** Marca de tiempo exacta.

---

## 🚀 Resumen de Comandos de Operación

*   `npm run setup`: Prepara todo el ecosistema (Instalación + Prisma).
*   `npm run dev`: Inicia el modo desarrollo.
*   `npx prisma studio`: Abre una interfaz visual para explorar la base de datos MySQL de forma segura.
