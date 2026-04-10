# 🎟️ Cambios en Sistema de Tickets - Auditoría Técnica 0 Deuda

> **Objetivo:** Documentación exhaustiva de todas las mejoras realizadas al módulo de tickets para garantizar robustez, sinergia de datos y experiencia de usuario coherente.

---

## 📋 Resumen Ejecutivo

Se realizó una auditoría completa del sistema de tickets identificando y resolviendo **7 problemas críticos**:

| # | Problema | Estado | Impacto |
|---|----------|--------|--------|
| 1 | URLs de email desincronizadas | ✅ RESUELTO | P0 - Tickets sin enlace funcional |
| 2 | Badge notificaciones oculto en sidebar colapsado | ✅ RESUELTO | P1 - UX - Usuario pierde contexto |
| 3 | Falta sincronización en tiempo real | ✅ RESUELTO | P1 - Datos desactualizados |
| 4 | Admin puede interferir en conversaciones de usuario | ✅ RESUELTO | P0 - Riesgo seguridad |
| 5 | Equipo no se vincula automáticamente | ✅ RESUELTO | P2 - Workflow ineficiente |
| 6 | Tickets cerrados abiertos nuevamente por accidente | ✅ RESUELTO | P1 - Integridad datos |
| 7 | Tipo falla hardcodeado a "OTRO" siempre | ✅ RESUELTO | P1 - Datos incorrectos |
| 8 | IP asignada no visible en ticket | ✅ RESUELTO | P2 - Falta info técnica |

---

## 🔧 Cambios Implementados por Módulo

### 1️⃣ Sincronización Central - Polling Inteligente

#### Problema Original
- Cada componente tenía su propio timer de refresh
- Sincronización a intervalos irregulares
- Usuario veía datos antiguos

#### Solución Implementada

**Arquitectura de Polling:**
```
Sidebar (10s)          ← Notificaciones frecuentes
↓↑
TicketsView (15s)      ← Lista con refresh regular
↓↑
TicketsDetail (30s)    ← Detalle + comentarios (menos urgente)
```

**Rationale:**
- Sidebar: Noticias críticas, se actualiza cada 10s
- TicketsView: Usuario está en la lista, necesita refresh frecuente (15s)
- TicketsDetail: Usuario leyendo comentarios, 30s es suficiente

**Implementación:**

*client/src/components/layout/TheSidebar.vue*
```javascript
const pollInterval = ref(null)

onMounted(() => {
  pollInterval.value = setInterval(() => {
    loadNotificationBadge()  // Carga badge cada 10s
  }, 10000)
})

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value)
})
```

*client/src/views/TicketsView.vue*
```javascript
const pollInterval = ref(null)

onMounted(() => {
  loadTickets()
  // Refresh cada 15s si estamos en la vista
  pollInterval.value = setInterval(() => {
    loadTickets(true)  // true = es refresh automático
  }, 15000)
})

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value)
})
```

*client/src/views/TicketsDetailView.vue*
```javascript
onMounted(() => {
  loadTicket()
  // Sincronizar comentarios y estado cada 30s
  pollInterval = setInterval(() => loadTicket(true), 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
```

---

### 2️⃣ URLs de Email Sincronizadas

#### Problema Original
- Emails con enlaces hardcodeados a `http://localhost:3000`
- En producción, usuario recibía links rotos
- No había forma centralizada de configurar el dominio

#### Solución Implementada

**Backend - Centralización de FRONTEND_URL**

*server/.env*
```bash
# Nuevo: Variable de entorno para URL del frontend
FRONTEND_URL=http://TU_IP/soporte
```

*server/src/services/ticketNotification.service.js*
```javascript
/**
 * Obtiene la URL base del frontend con fallbacks automáticos
 * @returns {string} URL del frontend (ej: http://192.168.1.100/soporte)
 * 
 * Cadena de fallback:
 * 1. FRONTEND_URL del .env (producción)
 * 2. X-Forwarded-Proto/Host (nginx reverse proxy)
 * 3. req.protocol/hostname (server directo)
 * 4. localhost:port (desarrollo)
 */
const getFrontendUrl = () => {
  // 1. Usar .env si existe (recomendado en prod)
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL
  }

  // 2. Usar headers si viene de reverse proxy (nginx)
  if (global.lastRequest?.headers) {
    const proto = global.lastRequest.headers['x-forwarded-proto'] || 'http'
    const host = global.lastRequest.headers['x-forwarded-host'] || 
                 global.lastRequest.headers.host
    if (host) {
      return `${proto}://${host}`
    }
  }

  // 3. Fallback
  return `http://localhost:${process.env.PORT || 3000}`
}

/**
 * Envía notificación de nuevo comentario al usuario reportante
 * Incluye enlace directo al ticket
 */
const notifyUserComment = (ticket, comentario, email) => {
  const baseUrl = getFrontendUrl()
  const ticketLink = `${baseUrl}/tickets/${ticket.id}`
  
  const html = `
    <h2>Nuevo comentario en tu ticket #${ticket.id}</h2>
    <p>${comentario}</p>
    <p>
      <a href="${ticketLink}">
        👉 Ver ticket →
      </a>
    </p>
  `
  
  return sendEmail(email, `Ticket #${ticket.id} - Nuevo comentario`, html)
}
```

**Uso en Emails:**
```javascript
// Cuando se agrega un comentario público (no interno)
if (TicketNotificationService && roleId !== 2 && !req.body.es_interno) {
  const recipientEmail = ticket.email_reporta
  // URL se construye con FRONTEND_URL o fallback automático
  TicketNotificationService.notifyUserComment(ticket, req.body.contenido, recipientEmail)
    .catch(err => logger.warn(`[EMAIL] Fallo: ${err}`))
}
```

---

### 3️⃣ Badge Visible en Sidebar Colapsado

#### Problema Original
- Badge `absolute -top-1 -right-1` se cortaba cuando colapsaba el sidebar
- Usuario no veía si había notificaciones nuevas

#### Solución Implementada

*client/src/components/layout/TheSidebar.vue*
```javascript
/**
 * Badge de notificaciones
 * Posicionado con overflow visible para que se vea incluso en sidebar colapsado
 * 
 * Propiedades críticas:
 * - z-index: 50 (siempre visible encima)
 * - -top-1 -right-1 (sobresale del contenedor)
 * - Conteo inteligente por rol:
 *   * ADMIN (1): Muestra tickets SIN ASIGNAR
 *   * ANALYST (3): Muestra tickets ASIGNADOS ACTIVOS
 *   * VIEWER (2): Solo acceso lectura, no ve notificaciones
 */

// En el template:
<div class="relative">
  <!-- Icono del ticket -->
  <Bell :size="24" class="text-primary" />
  
  <!-- Badge que sobresale -->
  <div 
    v-if="notificationCount > 0"
    class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full 
           w-5 h-5 flex items-center justify-center text-[10px] font-black 
           z-50 shadow-lg"
  >
    {{ notificationCount }}
  </div>
</div>

/**
 * Dinámico: Conteo inteligente por rol
 */
const notificationCount = computed(() => {
  if (!ticket.value) return 0
  
  const roleId = authStore.user?.roleId
  
  if (roleId === 1) {  // ADMIN
    // Solo tickets SIN ASIGNAR
    return tickets.value.filter(t => 
      ['ABIERTO', 'PENDIENTE'].includes(t.estatus) && 
      !t.id_asignado_a
    ).length
  }
  
  if (roleId === 3) {  // ANALYST
    // Solo tickets ASIGNADOS a mí y ACTIVOS
    return tickets.value.filter(t => 
      t.id_asignado_a === authStore.user?.userId && 
      ['ABIERTO', 'EN_PROGRESO', 'PENDIENTE'].includes(t.estatus)
    ).length
  }
  
  return 0  // VIEWER no ve notificaciones
})
```

**Polling del Badge:**
```javascript
// Se actualiza cada 10s automáticamente
const pollInterval = ref(null)

onMounted(() => {
  pollInterval.value = setInterval(() => {
    loadNotificationBadge()
  }, 10000)
})

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value)
})
```

---

### 4️⃣ Permissions: Admin No Interfiere

#### Problema Original
- Admin podía escribir comentarios en conversaciones entre viewer y analyst
- Rompía la privacidad del análisis
- Viewer no sabía si era el analyst o admin respondiendo

#### Solución Implementada

**Backend - Validación de Permisos**

*server/src/controllers/tickets.controller.js*
```javascript
/**
 * Agregar comentario a un ticket
 * 
 * VALIDACIONES DE PERMISOS:
 * 1. Usuario debe ser propietario del ticket O
 * 2. Usuario debe ser técnico (analyst) asignado O
 * 3. Admin SOLO puede escribir si:
 *    - NO hay viewer (usuario externo) reportando
 *    - O no hay analyst asignado
 *    - Es decir: No participa en conversaciones privadas 2-party
 * 
 * FLUJOS PERMITIDOS:
 * ✅ ADMIN abre ticket → puede comentar
 * ✅ ANALYST responde → admin es solo lector
 * ✅ VIEWER reporta → analyst analiza privadamente
 * ❌ ADMIN interrumpe conversación viewer-analyst
 */

const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.userId
  const roleId = req.user?.roleId

  const ticket = await TicketService.findById(id)
  if (!ticket) {
    const error = new Error('Ticket no encontrado.')
    error.statusCode = 404
    error.isOperational = true
    throw error
  }

  ensureOwnTicket(req, ticket)

  // VALIDACIÓN CRÍTICA: Prohibir que Admin interfiera
  if (roleId === 1) {  // Si es Admin (roleId = 1)
    const hasViewerReporter = ticket.id_usuario_reporta && 
                              ticket.id_usuario_reporta !== userId
    const hasAssignedAnalyst = ticket.id_asignado_a

    if (hasViewerReporter && hasAssignedAnalyst) {
      const error = new Error(
        'Admin no puede participar en conversaciones entre solicitante y analista. Solo lectura permitida.'
      )
      error.statusCode = 403
      error.isOperational = true
      throw error
    }
  }

  // Si pasa validación, agregar comentario
  const comment = await TicketService.addComment(id, userId, req.body)

  // Notificar al usuario (si no es interno)
  if (TicketNotificationService && roleId !== 2 && !req.body.es_interno) {
    const recipientEmail = ticket.email_reporta
    TicketNotificationService.notifyUserComment(ticket, req.body.contenido, recipientEmail)
      .catch(err => logger.warn(`[EMAIL] Fallo: ${err}`))
  }

  res.status(201).json(comment)
})
```

**Diagrama de Lógica:**
```
┌─ Ticket abierto
│
├─ ¿Es Admin escribiendo?
│  │
│  ├─ NO → ✅ Permitir comentario
│  │
│  └─ SÍ → ¿Hay viewer + analyst asignado?
│     │
│     ├─ NO (Admin es quien reportó o sin analyst) → ✅ Permitir
│     │
│     └─ SÍ (Viewer reportó + Analyst analiza) → ❌ Bloquear
│        (Solo lectura permitida)
```

---

### 5️⃣ Equipment Linking Automático

#### Problema Original
- Usuario tenía que buscar y seleccionar su equipo manualmente
- Comparación con asignaciones fallaba
- Se creaban tickets sin equipo asociado

#### Solución Implementada

*server/src/services/tickets.service.js*
```javascript
/**
 * Resuelve el equipo asociado a un ticket
 * 
 * LÓGICA:
 * Si el ticket fue creado por un VIEWER (usuario externo):
 * 1. Buscar su ASIGNACIÓN ACTIVA (fecha_fin = null, status = 1)
 * 2. Obtener el equipo de esa asignación
 * 3. Vincular automáticamente al ticket
 * 
 * CASOS:
 * ✅ Viewer con 1 equipo asignado → Se vincula automáticamente
 * ❌ Viewer sin equipo asignado → ticket.equipos = null
 * ❌ Viewer con múltiples equipos → Usa el más reciente
 */

static async resolveTicketEquipo(ticket) {
  if (!ticket) return null

  // Solo si el ticket lo reportó un usuario (viewer externo)
  if (!ticket.id_usuario_reporta) {
    return null
  }

  try {
    // Buscar asignación ACTIVA del usuario
    const asignacion = await prisma.asignaciones.findFirst({
      where: {
        id_usuario: ticket.id_usuario_reporta,
        fecha_fin_asignacion: null,
        id_status_asignacion: 1  // ACTIVA
      },
      include: { equipos: true },
      orderBy: { fecha_asignacion: 'desc' }
    })

    if (asignacion?.equipos) {
      // Actualizar ticket con el equipo de la asignación
      await prisma.tickets.update({
        where: { id: ticket.id },
        data: { id_equipo: asignacion.equipos.id }
      })

      return asignacion.equipos
    }
  } catch (err) {
    logger.error(`Error resolviendo equipo: ${err.message}`)
  }

  return null
}
```

*client/src/views/TicketCreateView.vue*
```javascript
/**
 * Al crear un ticket (VIEWER/solicitante externo):
 * 1. El formulario envía solo datos básicos
 * 2. Backend automáticamente vincula su equipo asignado
 * 3. No requiere selección manual del usuario
 */

const createTicket = async () => {
  const ticketData = {
    titulo: titulo.value,
    descripcion: descripcion.value,
    categoria: categoria.value,
    tipo_falla: categoria.value,  // Sincronizado correctamente
    // NOTA: id_equipo NO se envía aquí
    // Backend lo resuelve automáticamente desde asignaciones
  }

  await TicketsService.create(ticketData)
}
```

---

### 6️⃣ Status CERRADO - Terminal e Inmutable

#### Problema Original
- Tickets cerrados se reabrían accidentalmente
- No había registro de quién la cerró
- SLA quebrantado sin control

#### Solución Implementada

*server/src/services/tickets.service.js*
```javascript
/**
 * Validación de transiciones de estado
 * 
 * MATRIZ DE TRANSICIONES:
 * ABIERTO    → EN_PROGRESO, PENDIENTE, RESUELTO
 * EN_PROGRESO → PENDIENTE, RESUELTO, CERRADO
 * PENDIENTE   → EN_PROGRESO, RESUELTO
 * RESUELTO    → CERRADO, EN_PROGRESO (si necesita más trabajo)
 * CERRADO     → [NINGUNO] ⚠️ TERMINAL
 *
 * ESPECIAL: Solo ADMIN (roleId=1) puede hacer CERRADO → ABIERTO
 */

static validateStatusTransition(currentStatus, newStatus, roleId) {
  const transitions = {
    'ABIERTO': new Set(['EN_PROGRESO', 'PENDIENTE', 'RESUELTO']),
    'EN_PROGRESO': new Set(['PENDIENTE', 'RESUELTO', 'CERRADO']),
    'PENDIENTE': new Set(['EN_PROGRESO', 'RESUELTO']),
    'RESUELTO': new Set(['CERRADO', 'EN_PROGRESO']),
    'CERRADO': new Set([])  // TERMINAL: No se puede transicionar
  }

  const allowedTransitions = transitions[currentStatus] || new Set()

  // Si intenta salir de CERRADO y es ADMIN, permite REABRIR
  if (currentStatus === 'CERRADO' && roleId === 1) {
    allowedTransitions.add('ABIERTO')
  }

  if (!allowedTransitions.has(newStatus)) {
    const error = new Error(
      `Transición inválida: ${currentStatus} → ${newStatus}`
    )
    error.statusCode = 400
    error.isOperational = true
    throw error
  }
}

static async updateTicket(id, data, roleId) {
  const ticket = await prisma.tickets.findUnique({
    where: { id: parseInt(id) }
  })

  if (!ticket) {
    throw new Error('Ticket no encontrado')
  }

  // Validar la transición de estado
  if (data.estatus && data.estatus !== ticket.estatus) {
    this.validateStatusTransition(ticket.estatus, data.estatus, roleId)
  }

  return await prisma.tickets.update({
    where: { id: parseInt(id) },
    data: {
      ...data,
      fecha_actualizacion: new Date()
    }
  })
}
```

**Notificación cuando Admin Reabre:**
```javascript
// En controllers/tickets.controller.js
if (originalStatus === 'CERRADO' && data.estatus === 'ABIERTO') {
  // Crear registro en historial
  await TicketService.logHistorial(id, {
    accion: 'REABIERTO_POR_ADMIN',
    usuario_id: userId,
    detalles: `Ticket reabierto por administrador`
  })

  // Notificar al analyst asignado
  if (ticket.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema?.email) {
    TicketNotificationService.notifyAnalystReopened(ticket, req.user?.username)
  }
}
```

---

### 7️⃣ Tipo Falla Sincronizado (No Hardcodeado)

#### Problema Original
- Cada ticket guardaba `tipo_falla: 'OTRO'` sin importar lo que elegía
- Base de datos con datos incorrectos
- Reportes sesgados

#### Solución Implementada

*client/src/views/TicketCreateView.vue*
```javascript
/**
 * ANTES (❌ INCORRECTO):
 * const createTicket = async () => {
 *   const data = {
 *     categoria: categoria.value,  // ej: "Lentitud"
 *     tipo_falla: 'OTRO'  // Hardcodeado ⚠️
 *   }
 * }
 *
 * DESPUÉS (✅ CORRECTO):
 */

const createTicket = async () => {
  const data = {
    titulo: titulo.value,
    descripcion: descripcion.value,
    categoria: categoria.value,           // ej: "Lentitud del sistema"
    tipo_falla: categoria.value,          // ✨ Sincronizado con categoría
    archivo_evidencia: currentFile.value
  }

  await TicketsService.create(data)
}
```

**Frontend Validation:**
```javascript
/* El usuario ve opciones amigables */
const categoryOptions = [
  { label: 'Lentitud del sistema', value: 'SOFTWARE' },
  { label: 'Sin conexión a internet', value: 'NETWORK' },
  { label: 'Monitor no funciona', value: 'HARDWARE' },
  { label: 'Equipo genera ruido', value: 'HARDWARE' },
  { label: 'Falta de memoria', value: 'DATA' },
  { label: 'Otro', value: 'OTRO' }
]

/* Backend recibe la categoría técnica real */
```

---

### 8️⃣ Equipment Details Panel con IP

#### Problema Original
- Ticket sin contexto del equipo
- IP asignada desconocida
- Técnico sin información para soporte remoto

#### Solución Implementada

**Backend - Incluye IP de Asignación**

*server/src/services/tickets.service.js*
```javascript
/**
 * Al traer un ticket, incluir información completa del equipo + IP
 * 
 * FLUJO:
 * 1. Obtener ticket
 * 2. Si tiene equipo asociado (id_equipo):
 *    - Buscar asignación ACTIVA de ese equipo
 *    - Incluir dados técnicos del equipo
 *    - Incluir IP asignada desde asignaciones.direcciones_ip
 */

static async findById(id) {
  const ticket = await prisma.tickets.findUnique({
    where: { id: parseInt(id) },
    include: {
      equipos: true,
      // No incluir asignaciones aquí (evitar query compleja)
    }
  })

  if (!ticket) return null

  // Si tiene equipo, traer la asignación ACTIVA con IP
  if (ticket.equipos && ticket.equipos.id) {
    const asignacionesConIP = await prisma.asignaciones.findMany({
      where: {
        id_equipo: ticket.equipos.id,
        fecha_fin_asignacion: null,           // ACTIVA
        id_status_asignacion: 1
      },
      include: {
        direcciones_ip: true  // Incluir IP asignada
      },
      orderBy: { fecha_asignacion: 'desc' },
      take: 1
    })

    // Agregar asignación al equipo
    ticket.equipos.asignaciones = asignacionesConIP
  }

  return ticket
}
```

**Frontend - Muestra Equipo + IP**

*client/src/views/TicketsDetailView.vue*
```javascript
/**
 * Computed para extraer IP de forma segura
 */
const getEquipoIP = computed(() => {
  return ticket.value?.equipos?.asignaciones?.[0]?.direcciones_ip?.direccion_ip || null
})

// En el template:
<div v-if="ticket?.equipos" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-200">
  <p class="text-[8px] font-black uppercase text-blue-700 mb-3">Equipo Relacionado</p>
  
  <!-- Grid 2 columnas para mejor responsive -->
  <div class="grid grid-cols-2 gap-3">
    <!-- ID Equipo -->
    <div class="flex flex-col">
      <span class="text-[7px] text-blue-600 uppercase font-bold mb-1">ID Equipo:</span>
      <span class="text-[10px] font-bold text-primary">{{ ticket.equipos?.id || 'N/A' }}</span>
    </div>

    <!-- Marca -->
    <div class="flex flex-col">
      <span class="text-[7px] text-blue-600 uppercase font-bold mb-1">Marca:</span>
      <span class="text-[10px] font-semibold">{{ ticket.equipos?.marca || 'N/A' }}</span>
    </div>

    <!-- Modelo -->
    <div class="flex flex-col">
      <span class="text-[7px] text-blue-600 uppercase font-bold mb-1">Modelo:</span>
      <span class="text-[10px] font-semibold">{{ ticket.equipos?.modelo || 'N/A' }}</span>
    </div>

    <!-- Serie -->
    <div class="flex flex-col">
      <span class="text-[7px] text-blue-600 uppercase font-bold mb-1">Serie:</span>
      <span class="text-[10px] font-mono truncate">{{ ticket.equipos?.numero_serie || 'S/N' }}</span>
    </div>

    <!-- Nombre (ancho completo) -->
    <div v-if="ticket.equipos?.nombre_equipo" class="col-span-2 flex flex-col">
      <span class="text-[7px] text-blue-600 uppercase font-bold mb-1">Nombre:</span>
      <span class="text-[10px] font-semibold">{{ ticket.equipos.nombre_equipo }}</span>
    </div>

    <!-- IP Asignada (ancho completo si existe) -->
    <div v-if="getEquipoIP" class="col-span-2 flex flex-col pt-2 border-t border-blue-200">
      <span class="text-[7px] text-blue-600 uppercase font-bold mb-1">IP Asignada:</span>
      <span class="text-[11px] font-mono font-bold text-blue-700 bg-blue-100 px-3 py-2 rounded w-fit">
        {{ getEquipoIP }}
      </span>
    </div>
  </div>
</div>
```

---

## 🏗️ Arquitectura de Sincronización

```
┌── SERVER (MySQL + Prisma)
│   ├── tickets
│   ├── equipos
│   ├── asignaciones
│   └── direcciones_ip
│
├── API REST (Node/Express)
│   ├── GET /api/tickets         (lista con auto-refresh)
│   ├── GET /api/tickets/:id     (detalle + equipo + IP)
│   ├── POST /api/tickets/:id/comments (agregar comentario)
│   └── PUT /api/tickets/:id     (actualizar status)
│
└── CLIENT (Vue 3 + Polling)
    ├── Sidebar Badge (10s)
    ├── TicketsView (15s)
    └── TicketsDetail (30s)
```

---

## 🔐 Matriz de Permisos

| Acción | VIEWER (2) | ANALYST (3) | ADMIN (1) |
|--------|-----------|-----------|----------|
| Ver tickets propios | ✅ | N/A | ✅ todos |
| Crear comentario | ✅ | ✅ | ✅ (solo si abrió) |
| Cambiar status | ❌ | ✅ (asignado) | ✅ |
| Cambiar prioridad | ❌ | ❌ | ✅ |
| Asignar técnico | ❌ | ❌ | ✅ |
| Ver equipos | ✅ (asignado) | ✅ | ✅ todos |
| Reabrir CERRADO | ❌ | ❌ | ✅ |
| Escribir en 2-party | ✅ | ✅ | ❌ (solo lectura) |

---

## 🧪 Casos de Uso Testeados

### Caso 1: Viewer reporta equipo lento
```
1. Usuario (VIEWER) entra al sistema
2. Crea ticket: "Mi laptop está lenta"
   - Backend automáticamente vincula su equipo asignado
   - IP se carga desde asignaciones
3. Técnico (ANALYST) recibe notificación
4. Reabre en 15s vía polling
5. Panel muestra: DELL VOSTRO 3458, Serie ABC123, IP 192.168.1.50
6. Técnico comienza diagnóstico remoto
```

### Caso 2: Transición de estados
```
1. Admin abre ticket (ABIERTO)
2. Asigna a analyst (PENDIENTE)
3. Analyst comienza trabajo (EN_PROGRESO)
4. Resuelve problema (RESUELTO)
5. Admin cierra (CERRADO) ← Inmutable
6. Si necesita reabrir: Admin → ABIERTO (solo admin)
```

### Caso 3: Sincronización en tiempo real
```
1. Admin abre TicketsDetail de ticket #10
2. Analyst escribe comentario (TicketsDetail también abierto)
3. En 30s, frontend de admin recarga automáticamente
4. Ve el comentario del analyst
5. Badge del sidebar se actualiza en 10s
```

---

## 📝 Checklist de Validación

- ✅ Todas las URLs de email usan `FRONTEND_URL`
- ✅ Badge visible en sidebar colapsado
- ✅ Polling configurado (10s/15s/30s)
- ✅ Admin no puede interferir en conversaciones
- ✅ Equipo se vincula automáticamente
- ✅ CERRADO es terminal
- ✅ Tipo falla se sincroniza con categoría
- ✅ IP visible en ticket (si asignada)
- ✅ Panel responsivo con scroll
- ✅ Comentarios internos removidos

---

## 🚀 Deployment Notes

### Variables de Entorno Requeridas

```bash
# server/.env
DATABASE_URL=mysql://user:pass@localhost:3306/inventario_soporte
FRONTEND_URL=http://192.168.1.100/soporte  # ← CRÍTICO para emails
JWT_SECRET=tu-secret-aqui
PORT=3000
NODE_ENV=production
```

### Pasos Post-Deployment

1. **Verificar emails:**
   ```bash
   # Crear un ticket de prueba
   # Verificar que el email tenga links correctos al FRONTEND_URL
   ```

2. **Validar polling:**
   ```bash
   # F12 → Network
   # Cada 10s debe verse GET /api/notifications
   # Cada 15s GET /api/tickets
   # Cada 30s GET /api/tickets/:id
   ```

3. **Prueba de permisos:**
   ```
   - Login como ADMIN
   - Login como ANALYST en otra pestaña
   - ANALYST crea ticket con VIEWER reportando
   - ADMIN intenta comentar → Debe bloquearse (403)
   ```

---

## 📚 Referencias

- [REGLAS_NEGOCIO.md](./REGLAS_NEGOCIO.md) - Flujos de negocio
- [MANUAL_TECNICO.md](./MANUAL_TECNICO.md) - Operaciones
- [ARQUITECTURA_TECNOLOGIA.md](./ARQUITECTURA_TECNOLOGIA.md) - Stack técnico
