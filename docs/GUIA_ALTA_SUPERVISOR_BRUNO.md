# Guia de Alta de Supervisor desde Bruno

## Objetivo
Definir el flujo oficial para crear usuarios con rol SUPERVISOR en el sistema.

## Regla principal
El alta de supervisores solo la puede hacer un usuario ADMIN.

## Alta de ADMIN (como se da de alta)

Hay 2 escenarios oficiales:

1. Bootstrap inicial (primer admin del sistema)
- Se usa el script `server/scripts/seedAdmin.js`.
- Ese script crea un usuario con `id_rol = 1` (ADMIN).
- Uso recomendado solo para inicializacion/control de emergencia.

Pasos:
1. Ajustar datos del admin en el script (username, email, password temporal).
2. Ejecutar desde carpeta server:

```bash
node scripts/seedAdmin.js
```

3. Iniciar sesion con ese admin y cambiar la contrasena temporal.

2. Operacion normal (ya existe al menos un admin)
- Un ADMIN existente crea otro ADMIN via API de usuarios.
- Endpoint: `POST /api/usuarios-sistema` con `id_rol = 1`.
- La ruta esta protegida por `isAdmin`.

Ejemplo de body:

```json
{
  "username": "nuevo.admin",
  "password": "Temporal.123",
  "email": "nuevo.admin@empresa.com",
  "id_empleado": 40,
  "id_rol": 1,
  "id_status": 1
}
```

## Importante de seguridad para ADMIN
1. No crear ADMIN desde `POST /api/auth/signup` (ese flujo es VIEWER).
2. Usar contrasena temporal y forzar cambio inmediato.
3. Mantener minimo 2 cuentas ADMIN activas para contingencia.
4. Evitar dejar credenciales fijas en scripts de seed.

## Flujo de contrasenas y correo por rol (estado actual)

### VIEWER (registro web)
1. Alta por `POST /api/auth/signup`.
2. El sistema genera contrasena temporal automaticamente.
3. Intenta enviar credenciales por correo corporativo.
4. Si falla SMTP, regresa la contrasena temporal en la respuesta para uso manual.

Resultado: flujo automatizado de credenciales y correo.

### SUPERVISOR (alta por admin)
1. Alta por `POST /api/usuarios-sistema`.
2. Si no se envia `password`, el sistema genera contrasena temporal automatica.
3. Si hay `email`, el sistema intenta enviar credenciales por correo.
4. Si falla correo, la API regresa `tempPassword` para entrega manual segura.

Resultado: flujo homologado con alta automatizada de credenciales.

### ADMIN (alta por seed o por otro admin)
1. `scripts/seedAdmin.js` mantiene contrasena definida en script (bootstrap inicial).
2. `POST /api/usuarios-sistema` ya soporta contrasena automatica si no se envia `password`.
3. Si hay `email`, la API intenta enviar credenciales por correo.
4. Si falla correo, la API regresa `tempPassword` para entrega manual segura.

Resultado: alta operativa homologada para cuentas creadas por admin.

## Flujo implementado (objetivo cumplido)

Para SUPERVISOR y ADMIN creados por endpoint administrativo:
1. Generar contrasena temporal automatica en backend.
2. Enviar correo con credenciales iniciales.
3. Si falla correo, devolver contrasena temporal solo al ADMIN autenticado.

Pendiente recomendado:
1. Marcar flag de cambio obligatorio de contrasena en primer login.
2. Auditoria explicita de entrega de credenciales.

Beneficios:
1. Menor riesgo de compartir contrasenas por canales inseguros.
2. Menor error humano en altas.
3. Trazabilidad del proceso de entrega de acceso.

## Procedimiento mientras se implementa la homologacion
1. Crear SUPERVISOR/ADMIN desde cuenta ADMIN con contrasena temporal fuerte.
2. Entregar credenciales por canal seguro interno.
3. Solicitar cambio de contrasena al primer acceso.
4. Registrar en bitacora interna fecha de alta y entrega.

Base tecnica:
- El registro publico (`POST /api/auth/signup`) asigna rol por defecto VIEWER.
- El alta con rol especifico se hace por `POST /api/usuarios-sistema`.
- Esa ruta esta protegida con middleware `isAdmin`.

## Prerequisitos
1. Tener un usuario ADMIN activo con credenciales vigentes.
2. Tener empleado activo creado en la tabla de empleados.
3. Tener correo corporativo activo (si aplica a tu flujo operativo).
4. Conocer el ID del rol SUPERVISOR.

Valores actuales de roles en este proyecto:
- ADMIN: 1
- VIEWER: 2
- SUPERVISOR: 3

## Flujo recomendado (Bruno)

### Paso 1. Iniciar sesion como ADMIN
Ejecutar:
- Metodo: POST
- URL: /api/auth/login
- Body (JSON):

```json
{
  "identifier": "admin@dominio.com",
  "password": "TuPasswordAdmin"
}
```

Guardar el `token` de la respuesta.

### Paso 2. Crear usuario SUPERVISOR
Ejecutar:
- Metodo: POST
- URL: /api/usuarios-sistema
- Header:
  - Authorization: Bearer <token_admin>
- Body (JSON) ejemplo con Bruno:

```json
{
  "username": "bruno.supervisor",
  "password": "Temporal.123",
  "email": "bruno@empresa.com",
  "id_empleado": 25,
  "id_rol": 3,
  "id_status": 1
}
```

Respuesta esperada:
- HTTP 201
- Mensaje de usuario creado
- ID del nuevo usuario

### Paso 3. Verificar alta
Opciones de verificacion:
1. GET /api/usuarios-sistema
2. GET /api/usuarios-sistema/{id}

Confirmar:
- `id_rol = 3`
- `id_status = 1`
- `username` y `email` correctos

## Caso especial: Bruno ya existe como VIEWER
Si Bruno fue creado por `/api/auth/signup`, quedara como VIEWER.
No crear duplicado; actualizar su rol:

- Metodo: PUT
- URL: /api/usuarios-sistema/{id_de_bruno}
- Header:
  - Authorization: Bearer <token_admin>
- Body (JSON):

```json
{
  "id_rol": 3
}
```

## Que pasa con la interfaz al cambiar de VIEWER a SUPERVISOR

### Antes del cambio (VIEWER)
1. El usuario entra con acceso limitado a tickets.
2. El menu lateral muestra principalmente "Mis Tickets".
3. El router restringe navegacion a vistas permitidas para VIEWER.

### Despues del cambio (SUPERVISOR)
1. El usuario obtiene interfaz de rol interno (menu completo segun permisos).
2. En tickets se habilita vista operativa de supervisor.
3. Aplican reglas de permisos del rol SUPERVISOR definidas en backend.

### Paso obligatorio para que se refleje
El usuario debe cerrar sesion y volver a iniciar sesion.

Motivo: el `roleId` viaja en el JWT emitido al hacer login. Si el admin cambia el rol en BD, el token anterior sigue teniendo el rol viejo hasta relogin.

## Checklist rapido para soporte/admin
1. Confirmar que la cuenta existe (por ejemplo, creada desde web como VIEWER).
2. Ejecutar `PUT /api/usuarios-sistema/{id}` con `id_rol: 3`.
3. Validar respuesta HTTP 200.
4. Pedir al usuario cerrar sesion e iniciar sesion.
5. Verificar que ya ve interfaz y permisos de SUPERVISOR.

## Errores comunes
1. 401 No autorizado:
- Falta token o token invalido.

2. 403 Acceso denegado:
- El usuario autenticado no es ADMIN.

3. 409 Duplicado:
- Username o email ya existe.
- El empleado ya esta vinculado a otro usuario del sistema.

4. 400 Datos invalidos:
- Falta `username`, `password` o `id_rol`.
- Formato de email invalido.

## Buenas practicas operativas
1. No usar `/api/auth/signup` para personal interno con privilegios.
2. Reservar `/api/auth/signup` para autoservicio VIEWER.
3. Crear supervisores solo por flujo administrativo autenticado.
4. Usar contrasena temporal y forzar cambio posterior.
5. Auditar periodicamente usuarios por rol.

## Resumen ejecutivo
Si la pregunta es: "Se puede dar de alta supervisor desde registro por correo?"
- Respuesta: no, ese flujo crea VIEWER.

Si la pregunta es: "Como se debe hacer?"
- Respuesta: solo ADMIN, usando `POST /api/usuarios-sistema` con `id_rol = 3`.

Si la pregunta es: "Si se registra en web y queda VIEWER, ya no puede ser SUPERVISOR?"
- Respuesta: si puede. Un ADMIN lo promueve actualizando `id_rol` a 3 y el usuario reloguea.
