# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
