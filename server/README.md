# ⚙️ Backend API - Inventario TI

Esta es la capa de servidor del sistema, construida con estándares de ingeniería robustos para garantizar seguridad, escalabilidad y mantenibilidad.

## 🚀 Inicio Rápido
Se recomienda utilizar el orquestador de la raíz:
```bash
cd ..
npm run setup
npm run dev:server
```

## 🏗️ Arquitectura y Patrones
El backend ha sido refactorizado siguiendo principios de **Clean Code** y **Defense in Depth**:

- **Controladores:** Usan `asyncHandler` para eliminar bloques `try-catch` repetitivos.
- **Validación:** Implementación estricta de `Zod` en todos los endpoints de escritura.
- **Manejo de Errores:** Middleware centralizado que oculta detalles técnicos en producción.
- **Logging:** Sistema `Winston` para trazabilidad profesional (logs rotativos).
- **Seguridad:** Protección contra DoS (Rate Limiting), Headers seguros (Helmet) y Sanitización de Inputs.

## 📚 Documentación
Para detalles sobre la arquitectura lógica y diagramas:
- [🏗️ Arquitectura de Software](../../docs/ARQUITECTURA_TECNOLOGIA.md)
- [📘 Manual de Funcionamiento](../../docs/MANUAL_FUNCIONAMIENTO.md)

---
*Desarrollado con Node.js, Express y Prisma.*
