# 🏗️ Arquitectura y Stack Tecnológico

> **Cimientos del Sistema**
>
> Documentación técnica detallada sobre las decisiones de arquitectura, tecnologías seleccionadas y patrones de diseño implementados en el Sistema de Inventario TI.

[![Stack](https://img.shields.io/badge/Stack-MEVN-green?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-REST_API-blue?style=flat-square)](https://restfulapi.net/)
[![Pattern](https://img.shields.io/badge/Pattern-MVC-orange?style=flat-square)](https://developer.mozilla.org/es/docs/Glossary/MVC)

---

## 🚀 Stack Tecnológico (MEVN)

El núcleo del sistema se basa en el stack **MEVN** (MySQL, Express, Vue, Node), seleccionado por su robustez empresarial y escalabilidad.

### 🎨 Frontend (Cliente)

| Tecnología | Versión | Rol | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Vue.js** | 3.x | Framework Core | Utiliza **Composition API** (`<script setup>`) para una lógica modular, tipado seguro y mejor rendimiento que Options API. |
| **Vite** | 5.x | Build Tool | Motor de desarrollo ultrarrápido con HMR (Hot Module Replacement) instantáneo y builds de producción optimizados. |
| **PrimeVue** | 4.0 | UI Kit | Suite de componentes empresariales (DataTables, Modales) con diseño **Aura** para una estética premium inmediata. |
| **Pinia** | 2.x | State Manager | Gestión de estado reactivo global (Auth, Theme) sin la complejidad de Vuex. |
| **TailwindCSS** | 3.x | Styling | Utility-first CSS para prototipado rápido y diseño responsivo sin salir del markup. |

### ⚙️ Backend (Servidor)

| Tecnología | Versión | Rol | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Node.js** | 18+ LTS | Runtime | Modelo **Non-blocking I/O** ideal para manejar alta concurrencia de APIs REST. |
| **Express.js** | 4.x | Framework | Estándar de la industria para enrutamiento y middleware. Minimalista y extensible. |
| **MySQL 8** | 8.0 | Base de Datos | Motor relacional compatible con **ACID** para garantizar integridad en transacciones de inventario. |
| **MySQL2** | 3.x | Driver | Cliente nativo con soporte para **Promises** (`async/await`) y protección contra SQL Injection. |
| **JWT** | 9.x | Seguridad | Autenticación **Stateless** (sin sesiones en servidor) para escalabilidad horizontal. |

---

## 🏛️ Arquitectura de Software

El sistema sigue una arquitectura de **Cliente-Servidor (REST API)** desacoplada.

```mermaid
graph TD
    Client[Cliente Vue.js] <-->|JSON / HTTP| API[API REST Express]
    API <-->|SQL Queries| DB[(MySQL Database)]
```

### 1. Patrón de Diseño Backend: MVC (Model-View-Controller)
Aunque usamos una API (sin "Views" HTML en backend), adaptamos el patrón:

*   **Rutas (`routes/`)**: Puerta de entrada. Solo definen URL y apuntan a un controlador.
*   **Controladores (`controllers/`)**: Cerebro. Contienen la lógica de negocio, validaciones y orquestación.
*   **Config/DB (`config/`)**: Capa de Acceso a Datos. Gestiona la conexión y queries directas.
    *   *Decisión:* No usamos un ORM (como Sequelize o TypeORM) para mantener control total sobre las consultas SQL y optimizar rendimiento.

### 2. Patrón de Diseño Frontend: Arquitectura Basada en Componentes

*   **Views (`views/`)**: Páginas completas (ej. `EquiposView`). Coordinan el layout.
*   **Components (`components/`)**: Piezas reutilizables (ej. `StatCard`, `TheSidebar`).
*   **Services (`services/`)**: Capa de abstracción de API. Los componentes nunca llaman a Axios directamente; llaman a `EquiposService.getAll()`. Esto permite cambiar el backend sin tocar la UI.
*   **Stores (`stores/`)**: Estado global reactivo.

---

## 🧠 Decisiones Clave de Diseño

### 1. "Soft Delete" vs "Hard Delete"
En tablas críticas (`equipos`, `empleados`), no borramos registros (`DELETE`). Cambiamos su `status_id` a "Baja/Inactivo".
*   **Por qué:** Para mantener integridad histórica. Si borramos un empleado, perderíamos el rastro de qué equipos tuvo asignados en el pasado.
*   *Excepción:* Tablas transaccionales erróneas o logs temporales.

### 2. Validaciones en Backend (Always Trust No One)
Aunque el frontend valida formularios, el backend **re-valida todo**.
*   **Por qué:** Un usuario malintencionado puede saltarse el frontend usando Postman. El controlador de Equipos verifica fechas, unicidad y formatos independientemente de la UI.

### 3. Segmentación de Red Lógica
Referencia: `docs/PLAN_SEGMENTACION_RED.md`.
La lógica de negocio valida IPs basándonos en la realidad física de la red de la empresa (segmentos /20). El software valida lo que la red física impone.

### 4. Seguridad
*   **Passwords:** Hasheados con `bcrypt`. Nunca se guardan en texto plano.
*   **SQL Injection:** Prevenido usando `?` (placeholders) en todas las queries.
*   **Variables de Entorno:** Credenciales DB y JWT Secret fuera del código fuente.

---

## 🔄 Flujo de una Nueva Funcionalidad (Ejemplo)

Para entender cómo viaja la información:

1.  **Usuario** hace clic en "Guardar Equipo".
2.  **Vue Component** captura datos -> Valida campos básicos.
3.  **Vue Service** envía `POST /api/equipos` con JSON.
4.  **Express Router** recibe -> Pasa a Middleware `auth` (¿Tiene Token?).
5.  **Controller** recibe -> Valida negocio (¿Duplicado? ¿Fecha válida?).
6.  **DB Driver** ejecuta `INSERT INTO equipos...`.
7.  **Controller** retorna JSON `{ id: 123, status: 'ok' }`.
8.  **Vue Component** recibe respuesta -> Muestra notificación "Éxito".

---

Este documento sirve como mapa mental para entender no solo qué hace el sistema, sino la filosofía de ingeniería detrás de él.
