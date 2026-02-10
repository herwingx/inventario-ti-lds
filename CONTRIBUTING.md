# 🛠️ Guía de Contribución y Estándares

¡Bienvenido! Para mantener la integridad y calidad del **Sistema de Inventario TI**, todos los colaboradores (incluyendo autores originales) deben seguir este flujo de trabajo.

## 1. 🌿 Estrategia de Ramas (Git Flow)

Nunca trabajes directamente sobre `main`. Utilizamos ramas temáticas:

- `feat/nombre-feature`: Para nuevas funcionalidades.
- `fix/nombre-bug`: Para corrección de errores.
- `docs/nombre-doc`: Para cambios solo en documentación.
- `refactor/nombre-mejora`: Para mejoras de código que no cambian la lógica.

**Comando:** `git checkout -b feat/mi-nueva-funcionalidad`

---

## 2. 📝 Convención de Commits (Conventional Commits)

Utilizamos mensajes de commit estandarizados para que el `CHANGELOG.md` pueda generarse casi automáticamente y sea legible para los sinodales.

**Formato:** `tipo(alcance): descripción corta en español`

- **Correcto:** `feat(auth): implementar recuperación de contraseña por email`
- **Correcto:** `fix(equipos): corregir error al subir fotos de mantenimiento`
- **Incorrecto:** `cambios hechos`, `corrigiendo cosas`, `update`.

---

## 3. 🎨 Estándares de Código (Clean Code)

### Backend (Node.js/Express)
- **Validación:** Toda ruta de entrada (`POST/PUT`) **DEBE** tener un esquema de validación en la carpeta `src/schemas/`.
- **Servicios:** La lógica de base de datos no va en el controlador, va en el `service.js`.
- **Logging:** Usa `logger.info()` o `logger.error()` en lugar de `console.log()`.

### Frontend (Vue.js 3)
- **Composition API:** Usa siempre `<script setup>`.
- **Servicios:** Los componentes no llaman a Axios directamente; usan los archivos en `src/services/`.
- **PrimeVue:** Prioriza el uso de componentes de la librería antes que crear HTML manual.

---

## 4. ✅ Checklist antes de enviar un cambio

Antes de hacer un `push`, asegúrate de:
1. Que el servidor y el cliente arranquen sin errores (`npm run dev`).
2. Que no haya `console.log()` olvidados.
3. Que el código esté comentado donde la lógica sea compleja.
4. Haber actualizado el `CHANGELOG.md` si la funcionalidad es importante.

---

## 🚀 Proceso de Entrega
1. Sube tu rama: `git push origin feat/mi-funcionalidad`.
2. Crea un **Pull Request** detallando tus cambios.
3. Espera la revisión o realiza una auto-revisión final.
