# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Nuevo endpoint `/api/reports/pdf` para exportación masiva de responsivas.
- Implementación de `audit.middleware.js` para registro forense de cambios.

## [1.1.0] - 2026-02-13
### Added
- **Auth:** Implementación de Swagger UI en `/api-docs` para documentación viva.
- **Tickets:** Soporte para carga de múltiples imágenes como evidencia en reportes de fallo.
- **Docs:** Inclusión de Diagramas C4 y ADRs para auditoría de arquitectura.

### Changed
- Refactorización del middleware `auth.middleware.js` para usar `Bearer` token estándar.
- Actualización de `Prisma` a v6.19.2 para mejor compatibilidad con MySQL 8.0.
- Mejora en la estructura del `README.md` para onboarding de desarrolladores.

### Fixed
- Error de CORS en preflight requests desde clientes externos.
- Bug crítico donde los equipos "En Mantenimiento" aparecían como "Disponibles" en el selector de asignación.

### Security
- Actualización de `helmet` para prevenir vulnerabilidades web comunes.
- Implementación de Rate Limiting en rutas de Login y QR público.
