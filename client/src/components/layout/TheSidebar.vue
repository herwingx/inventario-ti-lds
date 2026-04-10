<script setup>
/**
 * @fileoverview Barra Lateral de Navegación.
 * Contiene el menú principal de la aplicación, soportando modo colapsado y móvil.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import TicketsService from '../../services/TicketsService'

import { 
  Home, 
  Monitor, 
  Users, 
  Building2, 
  Network, 
  Link, 
  Mail, 
  Wrench, 
  NotebookPen,
  Ticket,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
  Circle
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'close'])
const newTicketsCount = ref(0)
let ticketsBadgeInterval = null
const STORAGE_KEY_PREFIX = 'ticketsBadgeLastSeen'

// ... (rest of script remains same until template)

// Estructura del menú basada en el sidebar original
const menuItems = ref([
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    route: '/home'
  },
  {
    id: 'equipos',
    label: 'Equipos',
    icon: Monitor,
    children: [
      { id: 'equipos-list', label: 'Gestionar Equipos', route: '/equipos' },
      { id: 'equipo-form', label: 'Registrar Nuevo Equipo', route: '/equipos/nuevo' }
    ]
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: Users,
    children: [
      { id: 'empleados-list', label: 'Gestionar Empleados', route: '/empleados' },
      { id: 'empleado-form', label: 'Registrar Nuevo Empleado', route: '/empleados/nuevo' }
    ]
  },
  {
    id: 'organizacion',
    label: 'Organización',
    icon: Building2,
    children: [
      { id: 'empresas-list', label: 'Gest. Empresas', route: '/empresas' },
      { id: 'empresa-form', label: 'Registrar Empresa', route: '/empresas/nuevo' },
      { id: 'sucursales-list', label: 'Gestionar Sucursales', route: '/sucursales' },
      { id: 'sucursal-form', label: 'Registrar Sucursal', route: '/sucursales/nuevo' },
      { id: 'areas-list', label: 'Gestionar Áreas', route: '/areas' },
      { id: 'area-form', label: 'Registrar Nueva Área', route: '/areas/nuevo' }
    ]
  },
  {
    id: 'red',
    label: 'Gestión de Red',
    icon: Network,
    children: [
      { id: 'direcciones-ip-list', label: 'Gestionar Direcciones IP', route: '/direcciones-ip' },
      { id: 'direccion-ip-form', label: 'Registrar Nueva IP', route: '/direcciones-ip/nuevo' }
    ]
  },
  {
    id: 'asignaciones',
    label: 'Asignaciones',
    icon: Link,
    children: [
      { id: 'asignaciones-list', label: 'Gestionar Asignaciones Activas', route: '/asignaciones' },
      { id: 'asignacion-form', label: 'Crear Nueva Asignación', route: '/asignaciones/nuevo' },
      { id: 'asignaciones-historicas', label: 'Asignaciones Históricas', route: '/asignaciones?view=history' }
    ]
  },
  {
    id: 'email',
    label: 'Correo Corporativo',
    icon: Mail,
    children: [
      { id: 'cuentas-email-list', label: 'Gestionar Cuentas de Email', route: '/cuentas-email' },
      { id: 'cuenta-email-form', label: 'Registrar Nueva Cuenta', route: '/cuentas-email/nuevo' }
    ]
  },
  {
    id: 'mantenimientos',
    label: 'Mantenimientos',
    icon: Wrench,
    children: [
      { id: 'mantenimientos-list', label: 'Gestionar Mantenimientos', route: '/mantenimientos' },
      { id: 'mantenimiento-form', label: 'Registrar Mantenimiento', route: '/mantenimientos/nuevo' }
    ]
  },
  {
    id: 'soporte',
    label: 'Soporte Técnico',
    icon: Ticket,
    children: [
      { id: 'tickets-activos', label: 'Tickets Activos', route: '/tickets' },
      { id: 'tickets-historial', label: 'Historial de Soporte', route: '/tickets/historial' }
    ]
  },
  {
    id: 'notas',
    label: 'Notas',
    icon: NotebookPen,
    children: [
      { id: 'notas-list', label: 'Gestionar Notas', route: '/notas' },
      { id: 'nota-form', label: 'Crear Nueva Nota', route: '/notas/nuevo' }
    ]
  }
])

const visibleMenuItems = computed(() => {
  if (authStore.user?.roleId === 2) {
    return [
      {
        id: 'soporte',
        label: 'Tickets',
        icon: Ticket,
        children: [
          { id: 'tickets-activos', label: 'Mis Tickets', route: '/tickets' }
        ]
      }
    ]
  }

  return menuItems.value
})

// Estado de submenús expandidos
const expandedMenus = ref({})

// Computed para el ancho del sidebar
const sidebarClass = computed(() => {
  if (props.isMobile) {
    return 'w-64' // Siempre expandido en móvil
  }
  return props.collapsed ? 'w-20' : 'w-64'
})

// En móvil siempre mostrar texto
const showText = computed(() => {
  if (props.isMobile) return true
  return !props.collapsed
})

// Si está colapsado (no móvil)
const isCollapsed = computed(() => {
  return props.collapsed && !props.isMobile
})

const isAdmin = computed(() => authStore.user?.roleId === 1)
const isAnalyst = computed(() => authStore.user?.roleId === 3)
const canSeeTicketsBadge = computed(() => isAdmin.value || isAnalyst.value)
const userStorageKey = computed(() => `${STORAGE_KEY_PREFIX}:${authStore.user?.id || 'anon'}:${authStore.user?.roleId || 'none'}`)

// Estado del item visualmente activo (seleccionado por click)
const activeItemId = ref(null)

/**
 * Inicializar activeItemId basado en la ruta actual y expandir el menú relevante.
 */
const syncActiveItem = () => {
  // Primero cerrar todos los menús (acordeón)
  expandedMenus.value = {}
  
  for (const item of visibleMenuItems.value) {
    if (isActiveRoute(item)) {
      activeItemId.value = item.id
      // Expandir solo el menú padre del item activo
      if (item.children) {
        expandedMenus.value[item.id] = true
      }
      return
    }
  }
}

watch(() => [route.path, authStore.user?.roleId], () => {
  syncActiveItem()
}, { immediate: true })

const shouldShowTicketBadge = (child) => {
  return child?.id === 'tickets-activos' && canSeeTicketsBadge.value && newTicketsCount.value > 0
}

const ticketBadgeLabel = computed(() => {
  return newTicketsCount.value > 99 ? '99+' : String(newTicketsCount.value)
})

const getLastSeenAt = () => {
  const raw = localStorage.getItem(userStorageKey.value)
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

const setLastSeenAt = (timestamp = Date.now()) => {
  localStorage.setItem(userStorageKey.value, String(timestamp))
}

const getTicketTimestamp = (ticket) => {
  const raw = ticket?.fecha_actualizacion || ticket?.fecha_creacion
  const ts = Date.parse(raw)
  return Number.isFinite(ts) ? ts : 0
}

const isRoleRelevantTicket = (ticket) => {
  if (isAdmin.value) {
    // Admin: tickets por triage pendientes de asignacion y no finalizados.
    return !ticket.id_asignado_a && !['CERRADO', 'RESUELTO'].includes(ticket.estatus)
  }

  if (isAnalyst.value) {
    // Analista: tickets asignados a su usuario y no finalizados.
    return (
      ticket.id_asignado_a === authStore.user?.id &&
      !['CERRADO', 'RESUELTO'].includes(ticket.estatus)
    )
  }

  return false
}

const getMaxRelevantTicketTimestamp = (tickets = []) => {
  const relevant = tickets.filter(isRoleRelevantTicket)
  if (!relevant.length) return 0
  return Math.max(...relevant.map(getTicketTimestamp), 0)
}

const markTicketsAsSeen = () => {
  if (!canSeeTicketsBadge.value) return
  // Fallback solo cuando no tenemos snapshot del servidor.
  setLastSeenAt(Date.now())
  newTicketsCount.value = 0
}

const markTicketsAsSeenFromSnapshot = (tickets = []) => {
  if (!canSeeTicketsBadge.value) return
  const maxTs = getMaxRelevantTicketTimestamp(tickets)

  if (maxTs > 0) {
    setLastSeenAt(maxTs)
  } else if (!getLastSeenAt()) {
    // Primer uso sin tickets relevantes.
    setLastSeenAt(Date.now())
  }

  newTicketsCount.value = 0
}

async function loadNewTicketsCount() {
  if (!canSeeTicketsBadge.value) {
    newTicketsCount.value = 0
    return
  }

  try {
    const tickets = await TicketsService.getAll()

    // Si ya esta en tickets, consideramos todo lo relevante como visto usando reloj del servidor.
    if (route.path?.startsWith('/tickets')) {
      markTicketsAsSeenFromSnapshot(tickets)
      return
    }

    const lastSeenAt = getLastSeenAt()

    // Primera ejecucion para este usuario/rol: baseline al ultimo ticket relevante del servidor.
    if (!lastSeenAt) {
      setLastSeenAt(getMaxRelevantTicketTimestamp(tickets) || Date.now())
      newTicketsCount.value = 0
      return
    }

    newTicketsCount.value = tickets.filter((ticket) => {
      if (!isRoleRelevantTicket(ticket)) return false
      return getTicketTimestamp(ticket) > lastSeenAt
    }).length
  } catch (error) {
    newTicketsCount.value = 0
  }
}

function stopTicketsBadgePolling() {
  if (ticketsBadgeInterval) {
    clearInterval(ticketsBadgeInterval)
    ticketsBadgeInterval = null
  }
}

/**
 * Sistema de Polling Coordinado - Sidebar (10s)
 * 
 * ARQUITECTURA DE SINCRONIZACIÓN:
 * Sidebar (10s) ← CRÍTICO: Notificaciones frecuentes
 * TicketsView (15s) ← Mediobajo: Lista con refresh regular
 * TicketsDetail (30s) ← Bajo: Comments + estado
 * 
 * RATIONALE:
 * - 10s: Sidebar badge es lo primero que ve el usuario
 * - Si hay tickets nuevos, debe enterarse rápido
 * - 10s es balance entre UX y carga del servidor
 * - No más rápido (consumo innecesario)
 * - No más lento (datos desactualizados)
 * 
 * DINÁMICO POR ROL:
 * ADMIN (1): Cuenta tickets SIN ASIGNAR
 * ANALYST (3): Cuenta tickets ASIGNADOS A MÍ EN PROGRESO
 * VIEWER (2): No ve badge
 * 
 * CLEANUP: onUnmounted detiene el interval automáticamente
 */
function startTicketsBadgePolling() {
  stopTicketsBadgePolling()  // Limpiar interval anterior
  if (!canSeeTicketsBadge.value) return  // No iniciar si no tiene permisos

  loadNewTicketsCount()  // Carga inmediata
  ticketsBadgeInterval = setInterval(loadNewTicketsCount, 10000)  // Cada 10s sincronización
}

onMounted(() => {
  startTicketsBadgePolling()
})

onUnmounted(() => {
  stopTicketsBadgePolling()
})

watch(() => [authStore.user?.id, authStore.user?.roleId], () => {
  startTicketsBadgePolling()
}, { immediate: true })

watch(() => route.path, (path) => {
  if (path?.startsWith('/tickets')) {
    markTicketsAsSeen()
  }
}, { immediate: true })

/**
 * Maneja el click en un item principal con lógica mejorada
 */
function handleItemClick(item) {
  const isAlreadyActive = activeItemId.value === item.id
  
  // 1. Siempre establecer este item como el activo visualmente (feedback instantáneo)
  activeItemId.value = item.id
  
  // 2. Manejo de Submenús (Items con hijos)
  if (item.children) {
    if (props.collapsed) return // No hacemos nada en colapsado (usa hover)

    if (isAlreadyActive && expandedMenus.value[item.id]) {
      // Si ya estaba activo y expandido, lo cerramos
      expandedMenus.value[item.id] = false
    } else {
      // Si es nuevo, cerramos los demás (Efecto Acordeón) y expandimos este
      expandedMenus.value = {} 
      expandedMenus.value[item.id] = true
    }
  } 
  // 3. Manejo de Links Directos (Items sin hijos)
  else {
    navigateTo(item.route)
  }
}

/**
 * Verifica si un item debe mostrarse como activo (visualmente seleccionado)
 */
function isItemActive(item) {
  // Única fuente de verdad: el ID activo seleccionado manual o automáticamente.
  // Eliminamos el fallback a isActiveRoute aquí para evitar que el item de la ruta anterior
  // siga iluminado mientra navegas/clickeas otro.
  return activeItemId.value === item.id
}

/**
 * Helper para checar solo la ruta
 */
function isActiveRoute(item) {
  if (item.route) {
    if (item.route.includes('?')) return route.fullPath === item.route
    return route.path === item.route
  }
  if (item.children) {
    return item.children.some(child => isChildActive(child))
  }
  return false
}

function isChildActive(child) {
    if (child.route && child.route.includes('?')) {
        return route.fullPath === child.route
    }
    return route.path === child.route
}

/**
 * Navega a una ruta
 */
function navigateTo(routePath) {
  router.push(routePath)
  // Cerrar sidebar en móvil después de navegar
  if (props.isMobile) {
    emit('close')
  }
}

</script>

<template>
  <aside 
    class="sidebar bg-white dark:bg-[#2f363e] flex flex-col h-full"
    :class="[sidebarClass, { 'sidebar-collapsed': isCollapsed }]"
  >
    <!-- Logo -->
    <div 
      class="flex-none flex items-center justify-center transition-all duration-300 relative border-b border-light-border dark:border-dark-border" 
      :class="showText ? 'h-[5rem] px-6' : 'h-[5rem] px-2'"
    >
      <router-link 
        to="/home"
        class="transition-all duration-300 hover:opacity-80 cursor-pointer focus:outline-none"
        title="Ir a Inicio"
      >
        <img 
          src="/logo-white.svg" 
          alt="Linea Digital" 
          class="transition-all duration-300 object-contain" 
          :class="showText ? 'h-auto w-[11rem]' : 'h-8 w-auto'" 
        />
      </router-link>

      <!-- Botón cerrar en móvil (posición absoluta) -->
      <button 
        v-if="isMobile"
        @click="emit('close')"
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-light-muted dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
      >
        <X :size="24" />
      </button>
    </div>

    <!-- Navigation -->
    <nav 
      class="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar"
      :class="isCollapsed ? 'px-0' : 'px-0'"
    >
      <ul class="space-y-1">
        <li v-for="item in visibleMenuItems" :key="item.id" class="relative group">
          
          <!-- Item SIN hijos (link directo) -->
          <template v-if="!item.children">
            <div 
              @click="handleItemClick(item)"
              class="sidebar-item p-4"
              :class="{ 'active': isItemActive(item) }"
            >
              <component :is="item.icon" :size="20" stroke-width="2" />
              <span v-if="showText" class="text-sm font-semibold">{{ item.label }}</span>
            </div>
            
            <!-- Tooltip (solo cuando colapsado) -->
            <div 
              v-if="isCollapsed"
              @click="navigateTo(item.route)"
              class="floating-menu absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 cursor-pointer hover:bg-primary/20"
            >
              <!-- Flechita -->
              <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
                <div class="border-8 border-transparent border-r-light-card dark:border-r-dark-card"></div>
              </div>
              <span class="text-sm text-light-text dark:text-dark-text">{{ item.label }}</span>
            </div>
          </template>

          <!-- Item CON hijos (submenu) -->
          <template v-else>
            <div 
              @click="!isCollapsed && handleItemClick(item)"
              class="sidebar-item p-4 relative"
              :class="{ 'active': isItemActive(item) }"
            >
              <component :is="item.icon" :size="20" stroke-width="2" />
              
              <!-- Badge SIEMPRE visible cuando collapsed (absolute afuera del flujo) -->
              <span
                v-if="isCollapsed && item.id === 'soporte' && canSeeTicketsBadge && newTicketsCount > 0"
                class="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none pointer-events-none"
              >
                {{ ticketBadgeLabel }}
              </span>
              
              <span v-if="showText" class="text-sm font-semibold flex-1">{{ item.label }}</span>
              
              <component 
                v-if="showText"
                :is="expandedMenus[item.id] ? ChevronDown : ChevronRight"
                :size="16"
                class="transition-transform duration-200 text-light-muted dark:text-gray-400"
              />
            </div>

            <!-- Submenu expandible -->
            <ul 
              v-if="showText"
              class="sidebar-submenu"
              :class="expandedMenus[item.id] ? 'max-h-96' : 'max-h-0'"
            >
              <li v-for="child in item.children" :key="child.id">
                <div 
                  @click="navigateTo(child.route)"
                  class="sidebar-item text-sm py-2"
                  :class="{ 'active': isChildActive(child) }"
                >
                  <Circle :size="6" fill="currentColor" />
                  <span class="flex items-center gap-2">
                    <span>{{ child.label }}</span>
                    <span
                      v-if="shouldShowTicketBadge(child)"
                      class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none"
                    >
                      {{ ticketBadgeLabel }}
                    </span>
                  </span>
                </div>
              </li>
            </ul>

            <!-- Menú flotante (cuando colapsado) -->
            <div 
              v-if="isCollapsed"
              class="floating-menu absolute left-full top-0 ml-2 py-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 min-w-48"
            >
              <!-- Flechita apuntando al icono -->
              <div class="absolute left-0 top-3 -translate-x-full">
                <div class="border-8 border-transparent border-r-light-card dark:border-r-dark-card"></div>
              </div>
              <!-- Título del grupo -->
              <div class="px-4 py-2 text-sm font-semibold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border mb-1">
                {{ item.label }}
              </div>
              <!-- Opciones del submenú -->
              <div 
                v-for="child in item.children" 
                :key="child.id"
                @click.stop="navigateTo(child.route)"
                class="px-4 py-2 text-sm text-light-muted dark:text-dark-muted hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors flex items-center justify-between gap-2"
                :class="{ '!text-primary !bg-primary/10': isChildActive(child) }"
              >
                <span>{{ child.label }}</span>
                <span
                  v-if="shouldShowTicketBadge(child)"
                  class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none"
                >
                  {{ ticketBadgeLabel }}
                </span>
              </div>
            </div>
          </template>
        </li>
      </ul>
    </nav>

    <!-- Footer / Toggle -->
    <div 
      v-if="!isMobile" 
      class="flex-none p-2 border-t border-light-border dark:border-dark-border"
    >
      <button 
        @click="emit('toggle')"
        class="flex items-center w-full rounded-lg text-light-muted dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 group"
        :class="showText ? 'px-4 py-2 gap-3' : 'justify-center py-2'"
      >
        <component 
            :is="collapsed ? ChevronsRight : ChevronsLeft" 
            :size="20"
            class="transition-transform duration-300" 
        />
        <span v-if="showText" class="font-medium text-sm whitespace-nowrap opacity-100 transition-opacity duration-300">
          Colapsar menú
        </span>
      </button>
    </div>
  </aside>
</template>
