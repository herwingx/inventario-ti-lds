# 🏗️ Arquitectura Fase 2 - Gestión Inteligente de Activos

Este documento describe la arquitectura técnica de la Fase 2 del sistema, que incluye Helpdesk, Mantenimiento Proactivo y Auditoría.

---

## 📊 Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Frontend (Vue.js 3)"
        A[Navegador Web]
        B[Vue Router]
        C[Pinia Store]
        D[PrimeVue UI]
        E[Servicios API]
        F[SignaturePad]
        G[PDFMake]
    end
    
    subgraph "Backend (Express.js)"
        H[Express Server]
        I[JWT Middleware]
        J[Audit Middleware]
        K[Multer Upload]
        L[Node-Cron Jobs]
        M[Controllers]
        N[Routes]
    end
    
    subgraph "Base de Datos (MySQL/MariaDB)"
        O[(equipos)]
        P[(tickets)]
        Q[(mantenimientos)]
        R[(logs_sistema)]
        S[(evidencias)]
    end
    
    subgraph "Almacenamiento"
        T[/uploads/evidencias/]
        U[/uploads/tickets/]
    end
    
    A --> B
    B --> C
    C --> E
    E -->|HTTP/JSON| H
    H --> I
    I --> J
    J --> M
    M --> N
    N --> O
    N --> P
    N --> Q
    J --> R
    K --> T
    K --> U
    L -->|Cron| M
    F --> G
    
    style A fill:#4FC08D
    style H fill:#68A063
    style O fill:#00758F
```

---

## 🔄 Flujo de Tickets QR

```mermaid
sequenceDiagram
    participant U as Usuario Externo
    participant QR as Código QR
    participant FE as Frontend Vue
    participant API as Backend Express
    participant DB as MySQL
    participant N as Nodemailer

    rect rgb(240, 248, 255)
        Note over U,QR: 1. ESCANEO
        U->>QR: Escanea código del equipo
        QR->>FE: Redirige a /q/{token}
    end

    rect rgb(255, 248, 240)
        Note over FE,DB: 2. CARGA INFO
        FE->>API: GET /q/{token}
        API->>DB: SELECT equipo WHERE qr_token = ?
        DB-->>API: Datos del equipo
        API-->>FE: JSON (marca, modelo, tipo)
        FE-->>U: Muestra info + formulario
    end

    rect rgb(240, 255, 240)
        Note over U,N: 3. REPORTE
        U->>FE: Completa formulario de falla
        FE->>API: POST /q/{token}/report
        API->>DB: INSERT ticket + genera token_acceso
        API->>N: Envía email de notificación
        DB-->>API: Ticket creado
        API-->>FE: { ticket_id, token_acceso }
        FE-->>U: Confirmación + link de seguimiento
    end

    rect rgb(255, 240, 255)
        Note over U,FE: 4. SEGUIMIENTO
        U->>FE: Accede a /q/ticket/{token_acceso}
        FE->>API: GET /q/ticket/{token_acceso}
        API->>DB: SELECT ticket con comentarios
        DB-->>API: Estado actual
        API-->>FE: Datos del ticket
        FE-->>U: Timeline de actualizaciones
    end
```

---

## 🔐 Flujo de Autenticación y Roles

```mermaid
flowchart TD
    A[Request HTTP] --> B{¿Tiene Token JWT?}
    B -->|No| C[401 Unauthorized]
    B -->|Sí| D{¿Token Válido?}
    D -->|No| C
    D -->|Sí| E[Decodificar Usuario]
    E --> F{¿Qué Rol?}
    
    F -->|ADMIN| G[Acceso Total]
    F -->|SOPORTE| H[Acceso Operativo]
    F -->|SUPERVISOR| I{¿Tiene Sucursal?}
    F -->|VIEWER| J[Solo Lectura]
    
    I -->|Sí| K[Filtrar por Sucursal]
    I -->|No| L[Sin Acceso]
    
    K --> M[Acceso Limitado]
    G --> N[Continuar a Controller]
    H --> N
    M --> N
    J --> N
    
    N --> O{¿Operación de Escritura?}
    O -->|Sí| P[Audit Middleware]
    O -->|No| Q[Respuesta]
    P --> R[(logs_sistema)]
    P --> Q
```

---

## 📁 Estructura de Archivos Fase 2

```
inventario-ti-lds/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   │       └── SignaturePad.vue      # [NUEVO] Captura de firmas
│   │   ├── services/
│   │   │   ├── TicketsService.js         # [NUEVO] API Tickets
│   │   │   ├── QrPublicService.js        # [NUEVO] API QR Público
│   │   │   └── MaintenanceService.js     # [MOD] + Evidencias
│   │   ├── utils/
│   │   │   └── pdfGenerator.js           # [NUEVO] Generación PDFs
│   │   └── views/
│   │       ├── QrLandingView.vue         # [NUEVO] Landing QR
│   │       ├── TicketTrackingView.vue    # [NUEVO] Seguimiento
│   │       ├── TicketsView.vue           # [NUEVO] Listado
│   │       ├── TicketsDetailView.vue     # [NUEVO] Detalle
│   │       └── MantenimientosFormView.vue # [MOD] + Evidencias
│   └── package.json                       # + pdfmake, signature_pad
│
├── server/
│   ├── scripts/
│   │   └── migrations/
│   │       └── 002_mantenimiento_evidencias.sql  # [NUEVO]
│   ├── src/
│   │   ├── config/
│   │   │   ├── cron.config.js            # [NUEVO] Alertas programadas
│   │   │   └── upload.config.js          # [NUEVO] Multer config
│   │   ├── controllers/
│   │   │   ├── tickets.controller.js     # [NUEVO]
│   │   │   ├── qr-public.controller.js   # [NUEVO]
│   │   │   └── mantenimientos.controller.js # [MOD] + Evidencias
│   │   ├── middleware/
│   │   │   ├── audit.middleware.js       # [NUEVO] Logs automáticos
│   │   │   └── auth.middleware.js        # [MOD] + Roles granulares
│   │   ├── routes/
│   │   │   ├── tickets.routes.js         # [NUEVO]
│   │   │   ├── qr-public.routes.js       # [NUEVO]
│   │   │   └── mantenimientos.routes.js  # [MOD] + Evidencias
│   │   └── services/
│   │       └── ticketNotification.service.js # [NUEVO]
│   ├── uploads/
│   │   ├── evidencias/                   # [NUEVO] Fotos mantenimiento
│   │   └── tickets/                      # [NUEVO] Evidencia tickets
│   └── package.json                       # + multer, node-cron, uuid
│
└── docs/
    ├── ARQUITECTURA_FASE2.md             # [NUEVO] Este archivo
    ├── REGLAS_NEGOCIO.md                 # [MOD] + Tickets, QR, Auditoría
    └── DICCIONARIO_DATOS.md              # [MOD] + Estados, Tipos
```

---

## 🗄️ Esquema de Base de Datos Fase 2

```mermaid
erDiagram
    EQUIPOS ||--o{ TICKETS : "genera"
    EQUIPOS ||--o{ MANTENIMIENTOS : "requiere"
    MANTENIMIENTOS ||--o{ MANTENIMIENTO_EVIDENCIAS : "tiene"
    TICKETS ||--o{ TICKET_COMENTARIOS : "contiene"
    USUARIOS_SISTEMA ||--o{ TICKETS : "reporta/atiende"
    USUARIOS_SISTEMA ||--o{ LOGS_SISTEMA : "genera"
    
    EQUIPOS {
        int id PK
        varchar qr_token UK
        int frecuencia_mantenimiento_meses
        date proxima_fecha_mantenimiento
        date ultima_fecha_mantenimiento
    }
    
    TICKETS {
        int id PK
        int id_equipo FK
        varchar token_acceso UK
        enum tipo_falla
        enum prioridad
        enum estatus
        int id_asignado_a FK
        datetime fecha_creacion
        datetime fecha_cierre
    }
    
    TICKET_COMENTARIOS {
        int id PK
        int id_ticket FK
        int id_usuario FK
        text contenido
        boolean es_interno
    }
    
    MANTENIMIENTOS {
        int id PK
        int id_equipo FK
        enum tipo
        enum estatus
        date fecha_programada
        date fecha_fin
        decimal costo
    }
    
    MANTENIMIENTO_EVIDENCIAS {
        int id PK
        int id_mantenimiento FK
        varchar url_archivo
        enum tipo
        varchar descripcion
        varchar nombre_original
        varchar mime_type
        int tamano_bytes
    }
    
    LOGS_SISTEMA {
        int id PK
        int id_usuario FK
        enum accion
        varchar tabla_afectada
        int id_registro
        json valores_anteriores
        json valores_nuevos
        varchar ip_origen
        datetime fecha
    }
```

---

## 🔧 Componentes Clave

### 1. Middleware de Auditoría (`audit.middleware.js`)

Intercepta automáticamente operaciones POST/PUT/DELETE y registra:
- Usuario que realizó la acción
- Tabla y registro afectado
- Valores antes y después del cambio
- IP de origen y User-Agent

### 2. Sistema de Roles (`auth.middleware.js`)

| Rol | ID | Permisos |
|:----|:--:|:---------|
| ADMIN | 1 | Acceso total sin restricciones |
| VIEWER | 2 | Solo lectura de datos |
| SUPERVISOR | 3 | Filtrado por sucursal asignada |
| SOPORTE | N/A | (Reservado para futuro, no implementado en BD) |

### 3. Cron Jobs (`cron.config.js`)

| Job | Horario | Descripción |
|:----|:--------|:------------|
| Alerta Mantenimiento | 8:00 AM diario | Envía email de equipos con mantenimiento próximo |

### 4. Upload de Archivos (`upload.config.js`)

- **Formatos**: JPG, PNG, WEBP, PDF
- **Tamaño máximo**: 5MB
- **Nombres**: UUID único para evitar colisiones
- **Destino**: `/uploads/{evidencias|tickets}/`

---

## 📝 Notas de Implementación

1. **Tokens QR**: Se generan con UUID v4 y son inmutables una vez creados.
2. **Firmas Digitales**: Se guardan como base64 en el PDF, no en BD.
3. **Evidencias**: Se eliminan físicamente al borrar el mantenimiento (CASCADE).
4. **Auditoría**: No bloquea la operación si falla el registro del log.

---

## ✅ Checklist de Verificación

- [ ] Migración SQL ejecutada
- [ ] Carpetas de uploads creadas
- [ ] Rol SUPERVISOR creado en BD
- [ ] Cron jobs activos
- [ ] Endpoints de evidencias funcionando
- [ ] Formulario de mantenimientos con FileUpload
- [ ] Generación de PDFs operativa
- [ ] Firma digital capturando correctamente
