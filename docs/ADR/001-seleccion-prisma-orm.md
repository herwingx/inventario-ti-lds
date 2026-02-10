# ADR 001: Adopción de Prisma ORM sobre Consultas Nativas

* **Estado:** Aceptado
* **Fecha:** 2026-02-10
* **Decisores:** Equipo de Arquitectura
* **Contexto:** Backend Node.js con MySQL

## Contexto y Problema
El proyecto requiere una capa de acceso a datos segura, mantenible y escalable. Inicialmente se consideró el uso del driver nativo `mysql2` escribiendo consultas SQL crudas. Sin embargo, a medida que el esquema de la base de datos crece (tablas relacionadas, tipos de datos complejos), el mantenimiento de strings SQL manuales se vuelve propenso a errores (SQL Injection, errores de sintaxis en runtime) y difícil de refactorizar.

## Decisión
Se decide adoptar **Prisma ORM** como la capa de acceso a datos exclusiva para el backend.

## Justificación
1.  **Seguridad por Defecto:** Prisma utiliza consultas parametrizadas automáticamente, mitigando el riesgo de SQL Injection sin esfuerzo adicional del desarrollador.
2.  **Type Safety & Autocompletado:** Prisma genera un cliente basado en el esquema (`schema.prisma`). Esto proporciona autocompletado inteligente en el editor y validación de tipos, reduciendo errores tipográficos en nombres de tablas o columnas.
3.  **Gestión de Migraciones:** Prisma Migrate permite un control de versiones declarativo del esquema de la base de datos, facilitando el despliegue en diferentes entornos (Dev, QA, Prod).
4.  **Productividad:** Las operaciones CRUD complejas (ej. "Obtener Equipo con sus Asignaciones y el Empleado actual") se resuelven con una sintaxis de objeto anidado (`include: { asignaciones: true }`) en lugar de complejos `JOINs` manuales.

## Consecuencias
*   **Positivas:**
    *   Código más limpio y legible.
    *   Reducción drástica de "Magic Strings" en el código.
    *   Facilidad para cambiar el motor de base de datos en el futuro (ej. a PostgreSQL) si fuera necesario.
*   **Negativas:**
    *   Introduce un paso de compilación/generación (`npx prisma generate`).
    *   Ligero aumento en el tamaño del `node_modules`.
    *   Curva de aprendizaje inicial para desarrolladores acostumbrados a SQL puro.

## Notas de Implementación
Se debe ejecutar `npx prisma generate` cada vez que se modifique `schema.prisma`.
