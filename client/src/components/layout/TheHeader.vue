<script setup>
/**
 * @fileoverview Header principal de la aplicación.
 * Contiene el título de la página, control de Sidebar (móvil),
 * toggle de tema (Claro/Oscuro) y menú de usuario.
 */
import { useThemeStore } from '../../stores/theme'
import { useAuthStore } from '../../stores/auth'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { Menu, Sun, Moon, ChevronDown, User, LogOut } from 'lucide-vue-next'

const props = defineProps({
  // ...
  sidebarCollapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false }
})

// ... props and emits same ...
const emit = defineEmits(['toggleSidebar'])

const themeStore = useThemeStore()
const authStore = useAuthStore()
const route = useRoute()

const pageTitle = computed(() => route.meta.title || 'Panel de Control')

// ... computed same ...
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
        <Menu class="text-light-text dark:text-dark-text" :size="24" />
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
        <component 
          :is="themeStore.isDark ? Sun : Moon" 
          class="transition-colors"
          :class="themeStore.isDark ? 'text-yellow-400' : 'text-gray-600'"
          :size="20"
        />
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
          
          <ChevronDown class="text-gray-500 hidden sm:block" :size="16" />
        </button>

        <!-- Dropdown Menu -->
        <div class="absolute right-0 top-full mt-2 w-48 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div class="py-2">
            <router-link 
              :to="{ name: 'perfil' }"
              class="flex items-center gap-3 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
            >
              <User class="text-primary" :size="18" />
              <span>Perfil</span>
            </router-link>
            <hr class="my-2 border-light-border dark:border-dark-border" />
            <button 
              @click="authStore.logout"
              class="flex items-center gap-3 px-4 py-2 w-full text-sm text-danger hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
            >
              <LogOut :size="18" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
