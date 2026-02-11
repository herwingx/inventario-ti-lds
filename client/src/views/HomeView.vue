<script setup>
/**
 * @fileoverview Vista Principal (Dashboard).
 * Muestra un resumen general del sistema, incluyendo estadísticas clave,
 * tarjetas de acceso rápido, distribución de inventario y actividad reciente.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import DashboardService from '../services/DashboardService'
import StatCard from '../components/dashboard/StatCard.vue'
import QuickAccessCard from '../components/dashboard/QuickAccessCard.vue'
import { 
  Monitor, 
  Users, 
  Link, 
  Wrench,
  Plus,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  History,
  CheckCircle,
  User,
  Inbox,
  Server
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Estado
const loading = ref(true)
const stats = ref({
  equipos: 0,
  empleados: 0,
  asignaciones: 0,
  mantenimientos: 0,
  equipos_disponibles: 0
})
const equipmentDistribution = ref([])
const statusDistribution = ref([])
const recentActivity = ref([])

// Configuración de las cards de estadísticas
const statCards = computed(() => [
  {
    id: 'equipos',
    title: 'Equipos Registrados',
    subtitle: `${stats.value.equipos_disponibles} Disponibles`,
    value: stats.value.equipos,
    icon: Monitor,
    color: 'primary',
    route: '/equipos'
  },
  {
    id: 'empleados',
    title: 'Empleados Activos',
    subtitle: 'Personal Registrado',
    value: stats.value.empleados,
    icon: Users,
    color: 'warning',
    route: '/empleados'
  },
  {
    id: 'asignaciones',
    title: 'Asig. Activas',
    subtitle: 'Recursos Asignados',
    value: stats.value.asignaciones,
    icon: Link,
    color: 'success',
    route: '/asignaciones'
  },
  {
    id: 'mantenimientos',
    title: 'Mantenimientos',
    subtitle: 'Equipos en Reparación',
    value: stats.value.mantenimientos,
    icon: Wrench,
    color: 'info',
    route: '/mantenimientos' 
  }
])

// Configuración de los accesos rápidos
const quickAccessItems = [
  {
    id: 'equipos',
    title: 'Nuevo Equipo',
    description: 'Registrar hardware',
    icon: Plus,
    route: '/equipos/nuevo', 
    color: 'blue'
  },
  {
    id: 'asignaciones',
    title: 'Nueva Asignación',
    description: 'Asignar equipo a usuario',
    icon: UserPlus,
    route: '/asignaciones/nuevo', 
    color: 'teal'
  },
  {
    id: 'mantenimientos',
    title: 'Reportar Fallo',
    description: 'Crear ticket de mantenimiento',
    icon: AlertTriangle,
    route: '/mantenimientos/nuevo', 
    color: 'red'
  }
]

// ... (rest of script)

// Note: I need to duplicate the rest of script content or use partial replacement carefully.
// I'll replace the script block first part.

/**
 * Navega a una ruta específica
 */
function navigateTo(route) {
  if (route) router.push(route)
}

/**
 * Carga los datos del dashboard.
 * Ahora utiliza el endpoint optimizado del backend.
 */
async function loadDashboardData() {
  loading.value = true
  try {
    const data = await DashboardService.getStats()
    stats.value = {
      equipos: data.equipos || 0,
      empleados: data.empleados || 0,
      asignaciones: data.asignaciones || 0,
      mantenimientos: data.mantenimientos || 0,
      equipos_disponibles: data.equipos_disponibles || 0
    }
    
    // Procesar distribución para visualización simple
    equipmentDistribution.value = data.equipos_por_tipo.map(item => ({
      label: item.nombre_tipo,
      count: item.cantidad,
      percentage: Math.round((item.cantidad / (data.equipos || 1)) * 100)
    }))

    // Procesar distribución por estado
    const statusColors = {
      'Disponible': 'bg-green-500',
      'Asignado': 'bg-blue-500',
      'En Mantenimiento': 'bg-orange-500',
      'Baja': 'bg-gray-500',
      'Extraviado': 'bg-red-500'
    }

    statusDistribution.value = (data.equipos_por_status || []).map(item => ({
      label: item.nombre_status,
      count: item.cantidad,
      percentage: Math.round((item.cantidad / (data.equipos || 1)) * 100),
      color: statusColors[item.nombre_status] || 'bg-primary'
    }))

    recentActivity.value = data.actividad_reciente
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
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
            Panel de Control - Resumen de Operaciones TI
          </p>
        </div>
        <div class="hidden md:block">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center">
            <TrendingUp class="text-primary" :size="32" />
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        v-for="stat in statCards"
        :key="stat.id"
        :title="stat.title"
        :subtitle="stat.subtitle"
        :value="stat.value"
        :icon="stat.icon"
        :loading="loading"
        :color="stat.color"
        class="cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1"
        @click="navigateTo(stat.route)"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Columna Principal: Actividad y Gráficas -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Actividad Reciente (Prioridad Alta) -->
        <div class="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-card">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-light-text dark:text-dark-text flex items-center gap-2">
              <History class="text-primary" :size="20" />
              Actividad Reciente
            </h3>
            <button 
              @click="navigateTo('/asignaciones')" 
              class="text-sm text-primary hover:text-primary-dark font-medium hover:underline"
            >
              Ver todo
            </button>
          </div>

          <div v-if="loading" class="space-y-4">
             <div v-for="i in 3" :key="i" class="flex gap-4">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div class="flex-1 space-y-2">
                   <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                   <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
             </div>
          </div>

          <div v-else class="space-y-0 divide-y divide-light-border dark:divide-dark-border">
            <div 
              v-for="(activity, index) in recentActivity" 
              :key="index"
              class="py-4 first:pt-0 last:pb-0 flex items-center gap-4 group"
            >
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
                :class="[
                  activity.activo 
                    ? 'bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 text-green-600 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-zinc-800 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 text-gray-400 dark:text-gray-500'
                ]"
              >
                <CheckCircle v-if="activity.activo" :size="18" />
                <History v-else :size="18" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-light-text dark:text-dark-text truncate">
                  {{ activity.nombre_equipo }}
                </p>
                <div class="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted mt-0.5">
                  <User :size="12" />
                  <span>{{ activity.empleado }}</span>
                </div>
              </div>
              <div class="text-xs text-right text-light-muted dark:text-dark-muted whitespace-nowrap flex flex-col items-end">
                <span>{{ formatDate(activity.fecha) }}</span>
                <span v-if="!activity.activo" class="text-[10px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-500 font-medium mt-0.5">
                  Fin: {{ formatDate(activity.fecha_fin) }}
                </span>
              </div>
            </div>
            
            <div v-if="recentActivity.length === 0" class="text-center py-8">
               <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Inbox class="text-gray-400" :size="24" />
               </div>
               <p class="text-light-muted dark:text-dark-muted">No hay actividad reciente.</p>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas (Horizontal en col principal para balancear) -->
         <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAccessCard
              v-for="item in quickAccessItems"
              :key="item.id"
              :title="item.title"
              :description="item.description"
              :icon="item.icon"
              :color="item.color"
              @click="navigateTo(item.route)"
              class="h-full"
            />
          </div>
      </div>

      <!-- Columna Lateral: Distribución y Perfil -->
      <div class="lg:col-span-1 space-y-6">
        
        <!-- Distribución de Inventario -->
        <div class="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-card">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-light-text dark:text-dark-text">Inventario</h3>
            <span class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-light-muted dark:text-dark-muted">
              Total: {{ stats.equipos }}
            </span>
          </div>
          
          <div v-if="loading" class="space-y-4">
             <div v-for="i in 4" :key="i" class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="item in equipmentDistribution" :key="item.label" class="group">
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-light-text dark:text-dark-text group-hover:text-primary transition-colors">{{ item.label }}</span>
                <span class="text-light-muted dark:text-dark-muted text-xs">{{ item.count }}</span>
              </div>
              <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-1000 ease-out"
                  :style="{ width: `${item.percentage}%` }"
                ></div>
              </div>
            </div>
             <div v-if="equipmentDistribution.length === 0" class="text-center py-4 text-light-muted dark:text-dark-muted text-sm">
                Sin datos disponibles.
             </div>
          </div>
        </div>

        <!-- Info Card Compacta -->
        <!-- Estado Operativo -->
        <div class="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-card">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-light-text dark:text-dark-text">Estado Operativo</h3>
             <Server class="text-light-muted dark:text-dark-muted" :size="20" />
          </div>
          
           <div v-if="loading" class="space-y-4">
             <div v-for="i in 3" :key="i" class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          <div v-else class="space-y-5">
             <div v-for="item in statusDistribution" :key="item.label" class="group">
               <div class="flex justify-between text-sm mb-1.5">
                 <span class="font-medium text-light-text dark:text-dark-text group-hover:text-primary transition-colors">{{ item.label }}</span>
                 <span class="font-bold text-light-text dark:text-dark-text">{{ item.count }}</span>
               </div>
               <div class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                 <div 
                   class="h-full rounded-full transition-all duration-1000 ease-out"
                   :class="item.color"
                   :style="{ width: `${item.percentage}%` }"
                 ></div>
               </div>
               <div class="text-[10px] text-right text-light-muted dark:text-dark-muted mt-0.5">
                  {{ item.percentage }}% del total
               </div>
             </div>
             
             <div v-if="statusDistribution.length === 0" class="text-center py-4 text-light-muted dark:text-dark-muted text-sm">
                Sin datos de estado.
             </div>
          </div>
        </div>

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
