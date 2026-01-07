<script setup>
import { useThemeStore } from '../../stores/theme'
import { useAuthStore } from '../../stores/auth'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggleSidebar'])

const themeStore = useThemeStore()
const authStore = useAuthStore()
const route = useRoute()

const pageTitle = computed(() => route.meta.title || 'Panel de Control')

// Computed para el margen izquierdo del header
const headerStyle = computed(() => {
  if (props.isMobile) {
    return { left: '0' }
  }
  return { left: props.sidebarCollapsed ? '5rem' : '16rem' }
})
</script>

<template>
  <header 
    class="header"
    :style="headerStyle"
  >
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Hamburger menu (móvil) -->
      <button 
        v-if="isMobile"
        @click="emit('toggleSidebar')"
        class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
      >
        <i class="pi pi-bars text-lg text-light-text dark:text-dark-text"></i>
      </button>

      <!-- Page title -->
      <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right side - Actions -->
    <div class="flex items-center gap-4">
      <!-- Theme Toggle -->
      <button 
        @click="themeStore.toggleTheme"
        class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
        :title="themeStore.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      >
        <i 
          class="pi text-lg"
          :class="themeStore.isDark ? 'pi-sun text-yellow-400' : 'pi-moon text-gray-600'"
        ></i>
      </button>

      <!-- User Dropdown -->
      <div class="relative group">
        <button class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <!-- Avatar -->
          <div 
            class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm"
          >
            {{ authStore.userInitial }}
          </div>
          
          <!-- User info (oculto en móvil pequeño) -->
          <div class="text-left hidden sm:block">
            <span class="block text-sm font-medium text-light-text dark:text-dark-text">
              {{ authStore.username }}
            </span>
          </div>
          
          <i class="pi pi-angle-down text-xs text-gray-500 hidden sm:block"></i>
        </button>

        <!-- Dropdown Menu -->
        <div class="absolute right-0 top-full mt-2 w-48 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div class="py-2">
            <a 
              href="#"
              class="flex items-center gap-3 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
            >
              <i class="pi pi-user text-primary"></i>
              <span>Perfil</span>
            </a>
            <hr class="my-2 border-light-border dark:border-dark-border" />
            <button 
              @click="authStore.logout"
              class="flex items-center gap-3 px-4 py-2 w-full text-sm text-danger hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
            >
              <i class="pi pi-sign-out"></i>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
