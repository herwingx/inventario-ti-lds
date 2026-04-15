<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TheSidebar from '../components/layout/TheSidebar.vue'
import TheHeader from '../components/layout/TheHeader.vue'
import { useAuthStore } from '../stores/auth'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const authStore = useAuthStore()
const route = useRoute()
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false) // Para móvil
const isMobile = ref(false)
const mainScrollRef = ref(null)

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

const sidebarWidth = computed(() => {
  if (isMobile.value) return '0px'
  return sidebarCollapsed.value ? '5rem' : '16rem'
})

const mainStyle = computed(() => ({
  marginLeft: sidebarWidth.value,
  width: isMobile.value ? '100%' : `calc(100vw - ${sidebarWidth.value})`
}))

onMounted(() => {
  // authStore initialization is handled in the store definition via localStorage
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    if (mainScrollRef.value) {
      mainScrollRef.value.scrollTo({ top: 0, behavior: 'auto' })
    }
  }
)
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-300">
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

    <!-- Main Content: footer fijo + área scrollable -->
    <main 
      class="h-[calc(100vh-5rem)] mt-20 overflow-hidden flex flex-col transition-all duration-300 w-full min-w-0 box-border"
      :style="mainStyle"
    >
      <div ref="mainScrollRef" class="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div class="px-6 py-4 min-w-0 box-border">
          <RouterView v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </RouterView>
        </div>
      </div>

      <!-- Footer: vive dentro del main para no generar scroll global -->
      <footer class="flex-none px-6 py-4 text-center text-sm text-light-muted dark:text-dark-muted border-t border-light-border dark:border-dark-border">
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
    </main>
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
