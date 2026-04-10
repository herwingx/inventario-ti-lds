# 🚀 Quick Reference - Sistema de Tickets

> Guía rápida para localizar y comprender implementaciones clave

---

## 📍 Localización de Archivos

### Backend
| Funcionalidad | Archivo | Línea |
|---|---|---|
| **URLs de Email Sincronizadas** | `server/src/services/ticketNotification.service.js` | 93-112 |
| **CERRADO Terminal** | `server/src/services/tickets.service.js` | 23-52 |
| **Equipment Auto-Link** | `server/src/services/tickets.service.js` | 41-60 |
| **Permisos Admin** | `server/src/controllers/tickets.controller.js` | 303-365 |
| **IP de Asignación** | `server/src/services/tickets.service.js` | 123-150 |

### Frontend
| Funcionalidad | Archivo | Línea |
|---|---|---|
| **Badge Visible** | `client/src/components/layout/TheSidebar.vue` | 180-200 |
| **Polling 10s** | `client/src/components/layout/TheSidebar.vue` | 275-290 |
| **Polling 15s** | `client/src/views/TicketsView.vue` | 85-95 |
| **Polling 30s** | `client/src/views/TicketsDetailView.vue` | 227-234 |
| **Equipment Panel** | `client/src/views/TicketsDetailView.vue` | 555-596 |
| **Equipo IP** | `client/src/views/TicketsDetailView.vue` | 89-92 |
| **Tipo Falla** | `client/src/views/TicketCreateView.vue` | 110-125 |

---

## 🔍 Cómo Buscar Cosas

### "Quiero que los emails lleguen correctamente"
1. **Backend:** Verifica `server/.env` → buscar `FRONTEND_URL`
2. **Código:** `server/src/services/ticketNotification.service.js` línea 93
3. **Función:** `getFrontendUrl()` con fallbacks automáticos

### "El badge no se actualiza en tiempo real"
1. **Línea:** `client/src/components/layout/TheSidebar.vue:275`
2. **Configurable:** Cambiar `10000` a otro interval (ms)
3. **Dinámico:** El conteo se adapta por rol (ver `loadNewTicketsCount()`)

### "Admin está escribiendo donde no debe"
1. **Validación:** `server/src/controllers/tickets.controller.js:325`
2. **Lógica:** Si hay viewer + analyst asignado → bloquear admin
3. **Error:** `403 Forbidden` con mensaje descriptivo

### "Quiero ver la IP del equipo en el ticket"
1. **Frontend:** `client/src/views/TicketsDetailView.vue:555-596`
2. **Computed:** `getEquipoIP` (línea 89)
3. **Backend:** Query a `asignaciones.direcciones_ip` (service.js)

### "El ticket se reabrió misteriosamente"
1. **Validación:** `server/src/services/tickets.service.js:23`
2. **CERRADO es terminal:** No se puede abrir normalmente
3. **Solo admin:** Puede hacer CERRADO → ABIERTO
4. **Log:** Se registra quién reabrió para auditoría

---

## 🛠️ Comandos Útiles

### Testing
```bash
# Crear ticket de prueba
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "titulo": "Test",
    "categoria": "Software"
  }'

# Obtener ticket con equipo + IP
curl http://localhost:3000/api/tickets/10 \
  -H "Authorization: Bearer TOKEN"

# Expected: equipos object con asignaciones array + IP
```

### Debugging
```javascript
// En browser console
// Ver el intervalo de polling
console.log('Badge poll:', window.ticketsBadgeInterval)

// Forzar carga de badge
loadNewTicketsCount()

// Ver roles actuales
console.log(authStore.user?.roleId)  // 1=ADMIN, 2=VIEWER, 3=ANALYST
```

### Database Queries
```sql
-- Ver tickets con equipo e IP
SELECT 
  t.id,
  t.titulo,
  e.marca,
  e.modelo,
  d.direccion_ip
FROM tickets t
LEFT JOIN equipos e ON t.id_equipo = e.id
LEFT JOIN asignaciones a ON a.id_equipo = e.id 
  AND a.fecha_fin_asignacion IS NULL
  AND a.id_status_asignacion = 1
LEFT JOIN direcciones_ip d ON a.id_ip = d.id;

-- Ver transiciones de estado
SELECT 
  id,
  titulo,
  estatus,
  fecha_creacion,
  fecha_actualizacion
FROM tickets
ORDER BY fecha_actualizacion DESC
LIMIT 10;
```

---

## 📊 Checklist de Validación

### Después de cambiar FRONTEND_URL
- [ ] El .env tiene el nuevo dominio
- [ ] Los emails llegaron con enlaces correctos
- [ ] Probar desde una IP diferente a localhost
- [ ] Verificar en browser: ¿El enlace abre el ticket?

### Después de modificar polling
- [ ] F12 → Network → verificar frecuencia de requests
- [ ] Cambio de status se refleja en 30s máximo
- [ ] No hay memory leak en onUnmounted
- [ ] Badge se actualiza si hay nuevo ticket

### Después de cambiar permisos
- [ ] ADMIN puede leer toda conversación (F5 no recarga)
- [ ] ADMIN se bloquea al escribir en 2-party
- [ ] Mensaje de error claro (403)
- [ ] ANALYST puede responder normalmente

---

## 🔄 Flujo de Sincronización Automática

```
Usuario abre ticket detail
         ↓
loadTicket() llamada inicial
         ↓
onMounted: inicia setInterval cada 30s
         ↓
[30 segundos]
         ↓
loadTicket(true) - refresh automático
         ↓
Re-renderiza componente si hay cambios
         ↓
Si hay nuevo comentario:
  - Se muestra automáticamente
  - No necesita F5
  - SI hay equipo → Carga IP
         ↓
onUnmounted automáticamente limpia interval
  (cuando usuario navega a otra página)
```

---

## ⚠️ Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Emails con localhost links | `FRONTEND_URL` no configurada | Agregar a `.env`: `FRONTEND_URL=http://IP/soporte` |
| Badge no actualiza | Polling detenido | Ver console: `ticketsBadgeInterval` debe estar activo |
| Admin puede interferir | Permiso no validado | Verificar `addComment()` en controllers |
| CERRADO reabre | Validación fallida | Comprobar `validateStatusTransition()` |
| IP no se muestra | Equipment sin asignación activa | Verificar `asignaciones` con `fecha_fin = null` |
| Datos desactualizados | Polling muy lento | Cambiar interval en sidebar/views/detail |

---

## 🎯 Casos de Uso

### Caso: Técnico necesita información del equipo
```
1. Ticket #15 abre en TicketsDetail
2. Panel "EQUIPO RELACIONADO" muestra:
   - ID: 222
   - Marca: DELL
   - Modelo: VOSTRO 3458
   - Serie: ABC123DEF
   - IP: 192.168.1.50  ← Para soporte remoto
3. Técnico puede conectarse remotamente a 192.168.1.50
```

### Caso: Admin detecta ticket cerrado por error
```
1. Usuario reporta: Ticket #50 está CERRADO
2. Admin accede con rol ADMIN (1)
3. Intenta: CERRADO → EN_PROGRESO
4. Se valida: Solo ABIERTO permitido
5. Admin hace: CERRADO → ABIERTO  ✅
6. Se registra: Log de quién/cuándo reabrió
7. Sistema notifica al analyst asignado
```

### Caso: Sincronización en tiempo real
```
TIMESTAMP 10:00:00
- Admin abre: Ticket #10
- Analyst abre: Ticket #10 (otra pestaña)
- Analyst escribe: "Revisando equipo..."

TIMESTAMP 10:00:05
- Admin ve: Nada (aún no se sincroniza)

TIMESTAMP 10:00:30
- Admin: Se ejecuta loadTicket() automático
- Admin ve: Comentario del analyst
- Badge: Se actualiza en 10:00:10 (próximo ciclo)
```

---

## 📖 Lectura Recomendada

1. **Documentación Completa:** [CAMBIOS_SISTEMA_TICKETS_2024.md](CAMBIOS_SISTEMA_TICKETS_2024.md)
2. **Reglas de Negocio:** [REGLAS_NEGOCIO.md](REGLAS_NEGOCIO.md) - Sección "Soporte y Helpdesk"
3. **Manual Técnico:** [MANUAL_TECNICO.md](MANUAL_TECNICO.md) - Sección "Gestión de Secretos"
4. **Arquitectura:** [ARQUITECTURA_TECNOLOGIA.md](ARQUITECTURA_TECNOLOGIA.md) - Stack de tickets
