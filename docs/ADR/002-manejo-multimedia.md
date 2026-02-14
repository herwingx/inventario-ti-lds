# ADR 002: Estandarización de Rutas de Almacenamiento y Acceso a Multimedia

* **Estado:** Aceptado
* **Fecha:** 2026-02-13
* **Decisores:** Lead Developer
* **Contexto:** Gestión de archivos adjuntos (imágenes y PDFs) en el sistema.

## Contexto y Problema
Se requiere una estructura consistente para el almacenamiento y acceso a archivos multimedia (evidencias de tickets, mantenimientos, firmas). Es necesario asegurar que las rutas funcionen tanto en desarrollo como en producción, evitando problemas de resolución de rutas relativas.

## Decisión
Se establecen las siguientes directrices de arquitectura para el manejo de archivos:

1.  **Directorio Raíz Único:** Todos los archivos binarios (evidencias, tickets, firmas) residen exclusivamente bajo `/server/storage/`.
2.  **Abstracción de URL en el Frontend:** Se implementa un helper centralizado `getFullUrl(path)` en lugar de concatenar strings manualmente en los componentes.
3.  **Proxy de Desarrollo:** Se configuran proxies explícitos en `vite.config.js` para la ruta `/storage` hacia el backend.

## Justificación
1.  **Robustez:** El helper `getFullUrl` maneja automáticamente la resolución de dominios (`VITE_API_URL`) y previene errores de concatenación.
2.  **Mantenibilidad:** Mover el almacenamiento de una carpeta local a un servicio en la nube (S3) solo requerirá cambiar la lógica en un solo lugar (`getFullUrl`).
3.  **Seguridad:** Centralizar en `/storage/` facilita la aplicación de políticas de seguridad y respaldos.

## Consecuencias
*   **Positivas:**
    *   Carga garantizada de multimedia en cualquier entorno (Dev/Prod).
    *   Estructura de archivos en disco limpia y jerarquizada.
*   **Negativas:**
    *   Requiere que los nuevos componentes consuman siempre el helper de URL.
