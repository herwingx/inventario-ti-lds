# ADR 002: Estandarización de Rutas de Almacenamiento y Acceso a Multimedia

* **Estado:** Aceptado
* **Fecha:** 2026-02-11
* **Decisores:** Lead Developer
* **Contexto:** Gestión de archivos adjuntos (imágenes y PDFs) en el sistema de tickets.

## Contexto y Problema
Históricamente, el sistema grababa rutas de archivos de forma inconsistente (algunas con prefijo `/storage/`, otras relativas como `/tickets/ID/...`). Además, al servir la aplicación tras un proxy inverso (como en desarrollo con Vite), las rutas relativas fallaban si no se incluía el dominio base o el proxy adecuado. Esto causaba "imágenes rotas" en el chat y el historial.

## Decisión
Se establecen las siguientes directrices de arquitectura para el manejo de archivos:

1.  **Directorio Raíz Único:** Todos los archivos binarios (uploads, evidencias, tickets) deben residir bajo `/server/storage/`. La carpeta legacy `/uploads/` se mantiene solo para compatibilidad de lectura.
2.  **Abstracción de URL en el Frontend:** Se implementa un helper centralizado `getFullUrl(path)` en lugar de concatenar strings manualmente en los componentes.
3.  **Proxy de Desarrollo:** Se configuran proxies explícitos en `vite.config.js` para las rutas `/storage` y `/uploads` hacia el backend.

## Justificación
1.  **Robustez:** El helper `getFullUrl` maneja automáticamente la duplicación de slashes, la inclusión del dominio (`VITE_API_URL`) y la compatibilidad con rutas legacy que no traen el prefijo `/storage`.
2.  **Mantenibilidad:** Mover el almacenamiento de una carpeta local a un S3 o CDN solo requerirá cambiar la lógica en un solo lugar (`getFullUrl`) en lugar de buscar en todo el código.
3.  **UX Superior:** Asegura que imágenes críticas (evidencias de tickets) se carguen siempre, eliminando el estado de "imagen rota".

## Consecuencias
*   **Positivas:**
    *   Carga garantizada de multimedia en cualquier entorno (Dev/Prod).
    *   Estructura de archivos en disco limpia y jerarquizada por ID de ticket.
*   **Negativas:**
    *   Requiere que los nuevos componentes consuman siempre el helper de URL.

## Notas de Implementación
En el frontend, el helper debe manejar el caso de rutas antiguas:
```javascript
if (cleanPath.startsWith('/tickets/') && !cleanPath.startsWith('/storage/')) {
    cleanPath = `/storage${cleanPath}`;
}
```
