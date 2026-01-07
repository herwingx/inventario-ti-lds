# 🛠️ Guía de Desarrollo - Protocolo de Expansión

Esta guía "Receta de Cocina" describe el proceso exacto para agregar nuevas funcionalidades o módulos al sistema, garantizando que el código se mantenga limpio, ordenado y bajo el estándar inicial.

---

## 📋 Antes de Empezar

1.  **Entender la Arquitectura:**
    *   **Backend:** Express + MySQL (Controladores puros, SQL queries manuales).
    *   **Frontend:** Vue 3 + Pinia + PrimeVue.
2.  **Rama de Trabajo:**
    *   Crear rama: `git checkout -b feat/nombre-nueva-funcionalidad`

---

## 🏗️ Paso 1: Base de Datos (Backend)

Si el módulo requiere nuevas tablas:

1.  Diseñar la tabla en papel o herramienta ER.
2.  Crear script SQL o ejecutar en cliente MySQL.
    *   **Regla:** Usar `snake_case` para tablas y columnas.
    *   **Regla:** Incluir siempre `created_at` y `updated_at`.
    *   **Ejemplo:** `CREATE TABLE nuevos_activos (id INT AUTO_INCREMENT...);`

---

## ⚙️ Paso 2: Backend (API)

Seguir el patrón MVC existente.

### 2.1. Crear Controlador
Archivo: `server/src/controllers/nuevo_modulo.controller.js`

```javascript
const { query } = require('../config/db');

// Validaciones locales (si aplican)
const validateInput = (data) => { ... }

// CRUD Methods
const getAll = async (req, res) => {
    try {
        const sql = 'SELECT * FROM nuevo_modulo';
        const result = await query(sql);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAll, ... };
```

### 2.2. Crear Rutas
Archivo: `server/src/routes/nuevo_modulo.routes.js`

```javascript
const router = require('express').Router();
const controller = require('../controllers/nuevo_modulo.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, controller.getAll);
// ... otras rutas

module.exports = router;
```

### 2.3. Registrar en Server
Archivo: `server/server.js`

```javascript
app.use('/api/nuevo-modulo', require('./src/routes/nuevo_modulo.routes'));
```

---

## 🖥️ Paso 3: Frontend (Cliente)

### 3.1. Crear Servicio
Archivo: `client/src/services/NuevoModuloService.js`

```javascript
import api from './api';

export default {
    getAll() {
        return api.get('/nuevo-modulo').then(res => res.data);
    },
    // ... otros métodos
};
```

### 3.2. Crear Vista (Lista/Tabla)
Archivo: `client/src/views/NuevoModuloView.vue`
*   Usar `Datatable` de PrimeVue.
*   Incluir `StatCard` o `Overview` si aplica.
*   Implementar JSDoc en el script.

### 3.3. Crear Formulario (Crear/Editar)
Archivo: `client/src/views/NuevoModuloFormView.vue`
*   Usar componentes estándar (`InputText`, `Select`).
*   Reutilizar clases CSS de utilidad (`p-fluid`, `grid`).

### 3.4. Registrar Ruta
Archivo: `client/src/router/index.js`
*   Agregar objeto de ruta.
*   Asegurar `meta: { requiresAuth: true }`.

### 3.5. Agregar al Menú
Archivo: `client/src/components/layout/TheSidebar.vue`
*   Agregar entrada en el array de navegación.

---

## ✨ Paso 4: Finalización

1.  **Pruebas Manuales:** Probar flujo completo (Crear -> Ver -> Editar -> Borrar).
2.  **Lint/Format:** Asegurar que no hay errores de sintaxis.
3.  **Documentación:**
    *   Agregar JSDoc a los nuevos archivos.
    *   Actualizar `docs/DICCIONARIO_DATOS.md` si hubo nuevos Status o tipos.
4.  **Merge:** Pull Request hacia `develop` o `main`.

---

## 🚫 Anti-Patrones a Evitar

*   ❌ **NO** poner lógica de negocio compleja en los componentes Vue. Moverla a Servicios o Backend.
*   ❌ **NO** dejar `console.log` en código final.
*   ❌ **NO** usar estilos inline (`style="..."`). Usar clases Tailwind/CSS.
*   ❌ **NO** hacer queries SQL concatenando strings para valores (Riesgo SQL Injection). Usar `?`.
