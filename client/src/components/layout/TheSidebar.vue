<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

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

// Estructura del menú basada en el sidebar original
const menuItems = ref([
  {
    id: 'home',
    label: 'Inicio',
    icon: 'pi pi-home',
    route: '/home'
  },
  {
    id: 'equipos',
    label: 'Equipos',
    icon: 'pi pi-desktop',
    children: [
      { id: 'equipos-list', label: 'Gestionar Equipos', route: '/equipos' },
      { id: 'equipo-form', label: 'Registrar Nuevo Equipo', route: '/equipos/nuevo' }
    ]
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: 'pi pi-users',
    children: [
      { id: 'empleados-list', label: 'Gestionar Empleados', route: '/empleados' },
      { id: 'empleado-form', label: 'Registrar Nuevo Empleado', route: '/empleados/nuevo' }
    ]
  },
  {
    id: 'organizacion',
    label: 'Organización',
    icon: 'pi pi-sitemap',
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
    icon: 'pi pi-share-alt',
    children: [
      { id: 'direcciones-ip-list', label: 'Gestionar Direcciones IP', route: '/direcciones-ip' },
      { id: 'direccion-ip-form', label: 'Registrar Nueva IP', route: '/direcciones-ip/nuevo' }
    ]
  },
  {
    id: 'asignaciones',
    label: 'Asignaciones',
    icon: 'pi pi-link',
    children: [
      { id: 'asignaciones-list', label: 'Gestionar Asignaciones Activas', route: '/asignaciones' },
      { id: 'asignacion-form', label: 'Crear Nueva Asignación', route: '/asignaciones/nuevo' },
      { id: 'asignaciones-historicas', label: 'Asignaciones Históricas', route: '/asignaciones?view=history' }
    ]
  },
  {
    id: 'email',
    label: 'Correo Corporativo',
    icon: 'pi pi-envelope',
    children: [
      { id: 'cuentas-email-list', label: 'Gestionar Cuentas de Email', route: '/cuentas-email' },
      { id: 'cuenta-email-form', label: 'Registrar Nueva Cuenta', route: '/cuentas-email/nuevo' }
    ]
  },
  {
    id: 'mantenimientos',
    label: 'Mantenimientos',
    icon: 'pi pi-cog',
    children: [
      { id: 'mantenimientos-list', label: 'Gestionar Mantenimientos', route: '/mantenimientos' },
      { id: 'mantenimiento-form', label: 'Registrar Mantenimiento', route: '/mantenimientos/nuevo' }
    ]
  },
  {
    id: 'documentacion',
    label: 'Documentación',
    icon: 'pi pi-book',
    children: [
      { id: 'notas-list', label: 'Gestionar Notas', route: '/notas' },
      { id: 'nota-form', label: 'Crear Nueva Nota', route: '/notas/nuevo' }
    ]
  }
])

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

// Estado del item visualmente activo (seleccionado por click)
const activeItemId = ref(null)

/**
 * Inicializar activeItemId basado en la ruta actual
 */
const syncActiveItem = () => {
  for (const item of menuItems.value) {
    if (isActiveRoute(item)) {
      activeItemId.value = item.id
      // Expandir automáticamente el padre si es un submenú
      if (item.children) {
        expandedMenus.value[item.id] = true
      }
      return
    }
  }
}

// Watch route changes to sync active state
import { watch } from 'vue'
watch(() => route.path, () => {
  syncActiveItem()
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

    if (isAlreadyActive) {
      // Si ya estaba activo, solo alternamos su expansión (Toggle)
      expandedMenus.value[item.id] = !expandedMenus.value[item.id]
    } else {
      // Si es nuevo, lo expandimos y (opcional) cerramos los demás
      // Resetear otros menús para efecto acordeón (opcional, limpiar objeto)
      // expandedMenus.value = {} 
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
      <img 
        src="/logo-white.svg" 
        alt="Linea Digital" 
        class="transition-all duration-300 object-contain" 
        :class="showText ? 'h-auto w-[11rem]' : 'h-8 w-auto'" 
      />

      <!-- Botón cerrar en móvil (posición absoluta) -->
      <button 
        v-if="isMobile"
        @click="emit('close')"
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-light-muted dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
      >
        <i class="pi pi-times text-lg"></i>
      </button>
    </div>

    <!-- Navigation -->
    <nav 
      class="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar"
      :class="isCollapsed ? 'px-0' : 'px-0'"
    >
      <ul class="space-y-1">
        <li v-for="item in menuItems" :key="item.id" class="relative group">
          
          <!-- Item SIN hijos (link directo) -->
          <template v-if="!item.children">
            <div 
              @click="handleItemClick(item)"
              class="sidebar-item p-4"
              :class="{ 'active': isItemActive(item) }"
            >
              <i :class="item.icon" class="text-lg"></i>
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
              class="sidebar-item p-4"
              :class="{ 'active': isItemActive(item) }"
            >
              <i :class="item.icon" class="text-lg"></i>
              <span v-if="showText" class="text-sm font-semibold flex-1">{{ item.label }}</span>
              <i 
                v-if="showText"
                class="pi text-xs transition-transform duration-200"
                :class="expandedMenus[item.id] ? 'pi-angle-down' : 'pi-angle-right'"
              ></i>
            </div>

            <!-- Submenu expandible (cuando sidebar expandido) -->
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
                  <i class="pi pi-circle-fill text-[6px]"></i>
                  <span>{{ child.label }}</span>
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
                class="px-4 py-2 text-sm text-light-muted dark:text-dark-muted hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors"
                :class="{ '!text-primary !bg-primary/10': isChildActive(child) }"
              >
                {{ child.label }}
              </div>
            </div>
          </template>
        </li>
      </ul>
    </nav>

    <!-- Footer / Toggle -->
    <div 
      v-if="!isMobile" 
      class="flex-none p-4 border-t border-light-border dark:border-dark-border"
    >
      <button 
        @click="emit('toggle')"
        class="flex items-center w-full rounded-lg text-light-muted dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 group"
        :class="showText ? 'px-4 py-3 gap-3' : 'justify-center py-3'"
      >
        <i 
          class="pi text-xl transition-transform duration-300" 
          :class="collapsed ? 'pi-angle-double-right' : 'pi-angle-double-left'"
        ></i>
        <span v-if="showText" class="font-medium text-sm whitespace-nowrap opacity-100 transition-opacity duration-300">
          Colapsar menú
        </span>
      </button>
    </div>
  </aside>
</template>
