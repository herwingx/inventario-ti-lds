<script setup>
/**
 * @fileoverview Tarjeta de Información de Usuario.
 * Visualiza el perfil resumido del usuario actual y sus actividades recientes.
 */
import { useAuthStore } from '../../stores/auth'
import Skeleton from 'primevue/skeleton'

const authStore = useAuthStore()

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// Actividades recientes simuladas (en producción vendrían de la API)
const recentActivities = [
  { id: 1, action: 'Equipo registrado', detail: 'PC-001', time: 'Hace 5 min', icon: 'pi pi-desktop', color: 'text-info' },
  { id: 2, action: 'Asignación creada', detail: 'Juan Pérez', time: 'Hace 15 min', icon: 'pi pi-link', color: 'text-success' },
  { id: 3, action: 'Mantenimiento', detail: 'Laptop-042', time: 'Hace 1 hora', icon: 'pi pi-cog', color: 'text-warning' },
]
</script>

<template>
  <div class="user-info-premium h-full">
    <h3 class="text-lg font-bold text-light-text dark:text-dark-text mb-6">
      Información del Usuario
    </h3>

    <!-- Loading Skeleton -->
    <template v-if="loading">
       <div class="text-center mb-6 flex flex-col items-center">
          <Skeleton shape="circle" size="5rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton width="60%" height="1.5rem" class="mt-3 !bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton width="40%" height="1rem" class="mt-2 !bg-gray-200 dark:!bg-gray-700"></Skeleton>
       </div>
       <div class="border-t border-light-border dark:border-dark-border my-4"></div>
       <div class="grid grid-cols-2 gap-4 mb-6">
          <Skeleton height="4rem" borderRadius="0.75rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton height="4rem" borderRadius="0.75rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
       </div>
       <div class="border-t border-light-border dark:border-dark-border my-4"></div>
       <div class="space-y-3">
          <Skeleton height="3rem" borderRadius="0.5rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton height="3rem" borderRadius="0.5rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton height="3rem" borderRadius="0.5rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
       </div>
    </template>

    <!-- Content -->
    <template v-else>
      <!-- Avatar & Name -->
      <div class="text-center mb-6">
        <div class="relative inline-block">
          <div 
            class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
          >
            {{ authStore.userInitial }}
          </div>
          <!-- Status indicator -->
          <div class="absolute bottom-1 right-1 w-5 h-5 bg-success rounded-full border-4 border-light-card dark:border-dark-card"></div>
        </div>
        <h4 class="text-lg font-bold text-light-text dark:text-dark-text mt-3">
          {{ authStore.username }}
        </h4>
        <span class="text-sm text-light-muted dark:text-dark-muted">
          {{ authStore.roleName }}
        </span>
      </div>

      <!-- Divider -->
      <div class="border-t border-light-border dark:border-dark-border my-4"></div>

      <!-- User Stats -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="text-center p-3 bg-primary/5 dark:bg-primary/10 rounded-xl">
          <p class="text-2xl font-bold text-primary">12</p>
          <span class="text-xs text-light-muted dark:text-dark-muted">Equipos</span>
        </div>
        <div class="text-center p-3 bg-success/5 dark:bg-success/10 rounded-xl">
          <p class="text-2xl font-bold text-success">8</p>
          <span class="text-xs text-light-muted dark:text-dark-muted">Activos</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-light-border dark:border-dark-border my-4"></div>

      <!-- Recent Activity -->
      <h4 class="text-sm font-semibold text-light-text dark:text-dark-text mb-3">
        Actividad Reciente
      </h4>
      <div class="space-y-3">
        <div 
          v-for="activity in recentActivities" 
          :key="activity.id"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
        >
          <div class="w-8 h-8 rounded-lg bg-light-bg dark:bg-dark-bg flex items-center justify-center">
            <i :class="[activity.icon, activity.color]" class="text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-light-text dark:text-dark-text truncate">
              {{ activity.action }}
            </p>
            <p class="text-xs text-light-muted dark:text-dark-muted truncate">
              {{ activity.detail }}
            </p>
          </div>
          <span class="text-xs text-light-muted dark:text-dark-muted whitespace-nowrap">
            {{ activity.time }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-info-premium {
  @apply bg-light-card dark:bg-dark-card;
  @apply border border-light-border dark:border-dark-border;
  @apply rounded-2xl p-6;
  @apply shadow-card;
}
</style>
