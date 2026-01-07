<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import TheSidebar from '../components/layout/TheSidebar.vue'
import TheHeader from '../components/layout/TheHeader.vue'
import { useAuthStore } from '../stores/auth'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const authStore = useAuthStore()
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false) // Para móvil
const isMobile = ref(false)

// Detectar si es móvil
function checkMobile() {
  isMobile.value = window.innerWidth < 1024 // lg breakpoint
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function closeSidebar() {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

// Computed para determinar si mostrar el sidebar
const showSidebar = computed(() => {
  if (isMobile.value) {
    return sidebarOpen.value
  }
  return true
})

onMounted(() => {
  // authStore initialization is handled in the store definition via localStorage
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
    <!-- Overlay para móvil -->
    <transition name="fade">
      <div 
        v-if="isMobile && sidebarOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="closeSidebar"
      ></div>
    </transition>

    <!-- Sidebar -->
    <transition name="slide-sidebar">
      <TheSidebar 
        v-show="showSidebar"
        :collapsed="sidebarCollapsed"
        :isMobile="isMobile"
        @toggle="toggleSidebar"
        @close="closeSidebar"
      />
    </transition>

    <!-- Header -->
    <TheHeader 
      :sidebarCollapsed="sidebarCollapsed" 
      :isMobile="isMobile"
      @toggleSidebar="toggleSidebar"
    />

    <!-- Main Content - flex-1 para ocupar todo el espacio disponible -->
    <main 
      class="flex-1 pt-[6rem] pb-6 px-6 transition-all duration-300"
      :style="{ marginLeft: isMobile ? '0' : (sidebarCollapsed ? '5rem' : '16rem') }"
    >
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- Footer - siempre al fondo -->
    <footer 
      class="py-4 px-6 text-center text-sm text-light-muted dark:text-dark-muted border-t border-light-border dark:border-dark-border transition-all duration-300 mt-auto"
      :style="{ marginLeft: isMobile ? '0' : (sidebarCollapsed ? '5rem' : '16rem') }"
    >
      <p>
        Copyright © Desarrollado con ❤️ por 
        <a 
          href="https://github.com/herwingx" 
          target="_blank" 
          class="text-primary hover:text-primary-hover transition-colors"
        >
          herwingx
        </a> 
        {{ new Date().getFullYear() }}
      </p>
    </footer>
  </div>
  <Toast />
  <ConfirmDialog />
</template>

<style scoped>
.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
  transition: transform 0.3s ease;
}

.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  transform: translateX(-100%);
}
</style>
