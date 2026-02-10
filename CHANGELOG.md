# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0](https://github.com/herwingx/inventario-ti-lds/compare/v2.0.0...v1.0.0) (2026-02-10)


### ⚠ BREAKING CHANGES

* **mantenimiento:** implementacion completa modulo auditoria y refactor UX formularios

### Features

* **assignments:** implementar firma digital autógrafa y generación de hoja de resguardo institucional ([a944dac](https://github.com/herwingx/inventario-ti-lds/commit/a944dac0f9155c7d2c8a9c8e34ad649b215e300d))
* **DataTable:** implementar selector de filas por página con opción 'Todos' y actualizar la lógica de paginación. ([6002493](https://github.com/herwingx/inventario-ti-lds/commit/6002493cf26e574b33648e64fd945de714174c3a))
* **equipos:** añadir información de mantenimiento en la vista de detalle y refinar formulario ([c1c0c82](https://github.com/herwingx/inventario-ti-lds/commit/c1c0c82450a02d84fdff1fb5722bafb3589fd9fc))
* **fase2:** gestión de evidencias, roles y auditoría ([9d7a666](https://github.com/herwingx/inventario-ti-lds/commit/9d7a6665ace65219a0ca9a1e30199641f7a6c4cf))
* **helpdesk:** implementar sistema de tickets qr publicos con validacion y flujo completo ([f3034f9](https://github.com/herwingx/inventario-ti-lds/commit/f3034f9a47840ee24cb94c65c3d84b904de2f6b1))
* **layout:** hacer clicable el logo de la barra lateral para navegar a inicio ([0bc9a38](https://github.com/herwingx/inventario-ti-lds/commit/0bc9a3895310470bf4b69d69d5072163ff5211a6))
* **mantenimiento:** automatización de alertas y programación de mantenimientos preventivos ([dca5120](https://github.com/herwingx/inventario-ti-lds/commit/dca5120f29bacb6bf9a2905751b3624d1e45c28a))
* **mantenimiento:** implementacion completa modulo auditoria y refactor UX formularios ([8a3466a](https://github.com/herwingx/inventario-ti-lds/commit/8a3466a9300df2eb387d7d63a25547b5745bbc62))
* **ui:** implementar scroll behavior en el router y resetear menús expandidos del sidebar al sincronizar el elemento activo. ([df55359](https://github.com/herwingx/inventario-ti-lds/commit/df5535944725f36becdca3042bfefd221064466a))


### Bug Fixes

* **asignaciones:** corregir gestión de componentes adicionales y mejorar visualización de tipos ([7002e30](https://github.com/herwingx/inventario-ti-lds/commit/7002e3094dc1d82ee18ea68b6c6f466788affe8b))
* **ui:** sincronizar la prop `rows` en el componente `DataTable` y ajustar el número de filas a 10 en `DireccionesIpView`. ([6f308a2](https://github.com/herwingx/inventario-ti-lds/commit/6f308a2b697eb3b95e35234c10c04049ca2e8662))

## [1.2.0] - 2026-02-10
### Added (Añadido)
- **Firma Digital:** Implementación de un Pad de Firma (Canvas HTML5) para captura de firmas autógrafas digitales.
- **Motor de PDF (pdfmake):** Generación dinámica de "Hojas de Resguardo" con formato institucional de Línea Digital del Sureste.
- **Almacenamiento Privado:** Capa de almacenamiento fuera de la carpeta pública para documentos legales y firmas (.pdf y .png).
- **Incrustación de SVG:** Integración de logos corporativos vectoriales en documentos PDF.

### Changed (Cambiado)
- **UX/UI Mobile-First:** El componente `DataTable` ahora se transforma automáticamente en tarjetas (Cards) en dispositivos móviles.
- **Resiliencia de Archivos:** El sistema detecta automáticamente si un PDF fue borrado del disco y permite volver a firmar.
- **Naming Dinámico:** Los archivos PDF se generan con nombres descriptivos basados en el empleado y equipo.

### Fixed (Corregido)
- Error de desbordamiento horizontal en el detalle de asignaciones.
- Validación de filtros en la API para evitar errores de tipo `NaN`.

## [1.1.0] - 2026-02-10
### Added (Añadido)
- **Helpdesk QR (Fase 2):** Implementación completa del módulo de tickets con acceso público mediante tokens QR.
- **Auditoría:** Middleware y tabla `logs_sistema` para registrar cambios (CREATE, UPDATE, DELETE) con snapshots JSON.
- **Documentación:** Diagramas de arquitectura C4 Model (Contexto y Contenedores) en Mermaid.js.
- **ADRs:** Inicio del registro de decisiones de arquitectura (`docs/ADR/`).
- **DX:** Script `npm run setup` en raíz para automatizar la instalación del entorno.

### Changed (Cambiado)
- **Seguridad:** Implementación de `helmet` en Express para hardening de cabeceras HTTP.
- **Rate Limiting:** Configuración de límites de petición para API pública (`/q/*`).
- **Refactor:** Migración de consultas SQL nativas a Prisma ORM en controladores críticos.

### Fixed (Corregido)
- Error de CORS en despliegues con prefijo `/soporte`.
- Corrección en la validación de unicidad de direcciones IP en el módulo de asignaciones.

## [1.0.0] - 2025-12-01
### Added
- Lanzamiento inicial del sistema (MVP).
- Módulos de Inventario, Empleados, Asignaciones y Mantenimientos.
- Autenticación JWT y Roles de usuario.
