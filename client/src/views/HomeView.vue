<script setup>
/**
 * @fileoverview Vista Principal (Dashboard).
 * Muestra un resumen general del sistema, incluyendo estadísticas clave,
 * tarjetas de acceso rápido y la información del usuario actual.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import DashboardService from '../services/DashboardService'
import StatCard from '../components/dashboard/StatCard.vue'
import QuickAccessCard from '../components/dashboard/QuickAccessCard.vue'
import UserInfoCard from '../components/dashboard/UserInfoCard.vue'

const router = useRouter()
const authStore = useAuthStore()

// Estado
const loading = ref(true)
const stats = ref({
  equipos: 0,
  empleados: 0,
  asignaciones: 0,
  mantenimientos: 0
})

// Configuración de las cards de estadísticas
const statCards = computed(() => [
  {
    title: 'Equipos Registrados',
    subtitle: 'Inventario Activo',
    value: stats.value.equipos,
    icon: 'pi pi-desktop',
    color: 'primary'
  },
  {
    title: 'Empleados Activos',
    subtitle: 'Personal Registrado',
    value: stats.value.empleados,
    icon: 'pi pi-users',
    color: 'warning'
  },
  {
    title: 'Asig. Activas',
    subtitle: 'Recursos Asignados',
    value: stats.value.asignaciones,
    icon: 'pi pi-link',
    color: 'success'
  },
  {
    title: 'Mantenimientos',
    subtitle: 'Servicio Técnico',
    value: stats.value.mantenimientos,
    icon: 'pi pi-cog',
    color: 'info'
  }
])

// Configuración de los accesos rápidos
const quickAccessItems = [
  {
    id: 'equipos',
    title: 'Gestionar Equipos',
    description: 'Inventario y registro de equipos',
    icon: 'pi pi-desktop',
    route: '/equipos',
    color: 'blue'
  },
  {
    id: 'personal',
    title: 'Gestionar Personal',
    description: 'Empleados y usuarios del sistema',
    icon: 'pi pi-users',
    route: '/empleados',
    color: 'green'
  },
  {
    id: 'asignaciones',
    title: 'Asignar Recursos',
    description: 'Asignación de equipos e IPs',
    icon: 'pi pi-link',
    route: '/asignaciones',
    color: 'teal'
  },
  {
    id: 'email',
    title: 'Correo Corporativo',
    description: 'Gestión de cuentas de email',
    icon: 'pi pi-envelope',
    route: '/cuentas-email',
    color: 'orange'
  },
  {
    id: 'mantenimientos',
    title: 'Mantenimientos',
    description: 'Registro de mantenimiento técnico',
    icon: 'pi pi-cog',
    route: '/mantenimientos',
    color: 'red'
  },
  {
    id: 'documentacion',
    title: 'Documentación',
    description: 'Notas y documentación del sistema',
    icon: 'pi pi-book',
    route: '/notas',
    color: 'purple'
  }
]

/**
 * Navega a una ruta específica
 */
function navigateTo(route) {
  router.push(route)
}

/**
 * Carga los datos del dashboard
 */
async function loadDashboardData() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulating load for UX
    const data = await DashboardService.getStats()
    stats.value = {
      equipos: data.equipos || 0,
      empleados: data.empleados || 0,
      asignaciones: data.asignaciones || 0,
      mantenimientos: data.mantenimientos || 0
    }
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="animate-fade-in space-y-6">
    <!-- Welcome Header -->
    <div class="welcome-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl md:text-3xl font-bold text-light-text dark:text-dark-text">
            Bienvenido, <span class="text-primary">{{ authStore.username }}</span>
          </h2>
          <p class="text-light-muted dark:text-dark-muted mt-1">
            Panel de Control - Sistema de Inventario y Soporte Técnico
          </p>
        </div>
        <div class="hidden md:block">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center">
            <i class="pi pi-chart-line text-3xl text-primary"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        v-for="stat in statCards"
        :key="stat.title"
        :title="stat.title"
        :subtitle="stat.subtitle"
        :value="stat.value"
        :icon="stat.icon"
        :loading="loading"
        :color="stat.color"
      />
    </div>

    <!-- Quick Access & User Info -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Quick Access Section -->
      <div class="xl:col-span-2">
        <div class="quick-access-section">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-light-text dark:text-dark-text">
              Accesos Rápidos
            </h3>
            <span class="text-sm text-light-muted dark:text-dark-muted">
              {{ quickAccessItems.length }} módulos
            </span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAccessCard
              v-for="item in quickAccessItems"
              :key="item.id"
              :title="item.title"
              :description="item.description"
              :icon="item.icon"
              :color="item.color"
              @click="navigateTo(item.route)"
            />
          </div>
        </div>
      </div>

      <!-- User Info Section -->
      <div class="xl:col-span-1">
        <UserInfoCard :loading="loading" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-card {
  @apply bg-light-card dark:bg-dark-card;
  @apply border border-light-border dark:border-dark-border;
  @apply rounded-2xl p-6;
  @apply shadow-card;
}

.quick-access-section {
  @apply bg-light-card dark:bg-dark-card;
  @apply border border-light-border dark:border-dark-border;
  @apply rounded-2xl p-6;
  @apply shadow-card;
}
</style>
