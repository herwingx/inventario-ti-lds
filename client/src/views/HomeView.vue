<script setup>
/**
 * @fileoverview Vista Principal (Dashboard).
 * Resumen ejecutivo del sistema con métricas clave, accesos directos y actividad reciente.
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
  Server,
  ArrowUpRight,
  Sparkles,
  Gauge
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const lastUpdatedAt = ref(null)
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

const statCards = computed(() => [
  {
    id: 'equipos',
    title: 'Equipos registrados',
    subtitle: `${stats.value.equipos_disponibles} disponibles`,
    value: stats.value.equipos,
    icon: Monitor,
    color: 'primary',
    route: '/equipos'
  },
  {
    id: 'empleados',
    title: 'Empleados activos',
    subtitle: 'Personal registrado',
    value: stats.value.empleados,
    icon: Users,
    color: 'warning',
    route: '/empleados'
  },
  {
    id: 'asignaciones',
    title: 'Asignaciones activas',
    subtitle: 'Recursos asignados',
    value: stats.value.asignaciones,
    icon: Link,
    color: 'success',
    route: '/asignaciones'
  },
  {
    id: 'mantenimientos',
    title: 'Mantenimientos',
    subtitle: 'Equipos en reparación',
    value: stats.value.mantenimientos,
    icon: Wrench,
    color: 'info',
    route: '/mantenimientos'
  }
])

const quickAccessItems = [
  {
    id: 'equipos',
    title: 'Nuevo equipo',
    description: 'Registrar hardware',
    icon: Plus,
    route: '/equipos/nuevo',
    color: 'blue'
  },
  {
    id: 'asignaciones',
    title: 'Nueva asignación',
    description: 'Asignar equipo a usuario',
    icon: UserPlus,
    route: '/asignaciones/nuevo',
    color: 'teal'
  },
  {
    id: 'mantenimientos',
    title: 'Reportar fallo',
    description: 'Crear ticket de mantenimiento',
    icon: AlertTriangle,
    route: '/mantenimientos/nuevo',
    color: 'red'
  },
  {
    id: 'inventario',
    title: 'Ver inventario',
    description: 'Explorar equipos y estado',
    icon: Monitor,
    route: '/equipos',
    color: 'green'
  }
]

const roleLabel = computed(() => {
  const roleId = authStore.user?.roleId
  if (roleId === 1) return 'Administrador'
  if (roleId === 2) return 'Viewer'
  if (roleId === 3) return 'Analista'
  return 'Usuario'
})

const operationalScore = computed(() => {
  const total = stats.value.equipos || 0
  if (!total) return 0
  return Math.round((stats.value.equipos_disponibles / total) * 100)
})

const availabilityPercentage = computed(() => {
  const total = stats.value.equipos || 0
  if (!total) return 0
  const available = statusDistribution.value.find(s => s.label === 'DISPONIBLE')?.count || 0
  return Math.round((available / total) * 100)
})

const criticalEquipmentCount = computed(() => {
  return statusDistribution.value
    .filter(s => ['EN MANTENIMIENTO', 'INACTIVO', 'BAJA'].includes(s.label))
    .reduce((sum, s) => sum + s.count, 0)
})

const assignmentRate = computed(() => {
  const total = stats.value.equipos || 0
  if (!total) return 0
  const assigned = statusDistribution.value.find(s => s.label === 'ASIGNADO')?.count || 0
  return Math.round((assigned / total) * 100)
})

const recentActivityCount = computed(() => recentActivity.value.length)

function navigateTo(route) {
  if (route) router.push(route)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
}

function formatFullDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function getActivityState(activity) {
  return activity?.activo
    ? {
        label: 'Activo',
        tone: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      }
    : {
        label: 'Finalizado',
        tone: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
      }
}

function getAvailabilityLabel() {
  const available = stats.value.equipos_disponibles || 0
  const total = stats.value.equipos || 0
  if (!total) return 'Sin datos'
  return `${available} de ${total} equipos disponibles`
}

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

    equipmentDistribution.value = (data.equipos_por_tipo || []).map(item => ({
      label: item.nombre_tipo,
      count: item.cantidad,
      percentage: Math.round((item.cantidad / (data.equipos || 1)) * 100)
    }))

    const statusColors = {
      DISPONIBLE: 'bg-emerald-500',
      ASIGNADO: 'bg-primary',
      'EN MANTENIMIENTO': 'bg-orange-500',
      BAJA: 'bg-slate-500',
      INACTIVO: 'bg-red-500',
      CANCELADO: 'bg-slate-400',
      ACTIVO: 'bg-emerald-600',
      FINALIZADO: 'bg-blue-500',
      RESERVADA: 'bg-yellow-500',
      PENDIENTE: 'bg-amber-500'
    }

    statusDistribution.value = (data.equipos_por_status || []).map(item => ({
      label: item.nombre_status,
      count: item.cantidad,
      percentage: Math.round((item.cantidad / (data.equipos || 1)) * 100),
      color: statusColors[item.nombre_status] || 'bg-primary'
    }))

    recentActivity.value = data.actividad_reciente || []
    lastUpdatedAt.value = new Date()
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
  <div class="animate-fade-in space-y-6 w-full min-w-0 max-w-full">
    <section class="hero-shell relative overflow-hidden rounded-[2rem] border border-light-border/80 dark:border-dark-border shadow-2xl w-full min-w-0 max-w-full">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,180,151,0.20),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]"></div>
      <div class="relative p-6 sm:p-7 lg:p-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] items-start w-full min-w-0 max-w-full">
        <div class="min-w-0 max-w-full space-y-6">
          <div class="flex flex-wrap items-center gap-3">
            <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
              <Sparkles :size="14" />
              Panel de control
            </span>
            <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary/15 border border-primary/20 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              <Gauge :size="14" />
              {{ roleLabel }}
            </span>
          </div>

          <div class="max-w-3xl space-y-3">
            <p class="text-[10px] font-black uppercase tracking-[0.34em] text-light-muted/70 dark:text-white/55">Resumen ejecutivo</p>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-light-text dark:text-white">
              Bienvenido, <span class="text-primary">{{ authStore.username }}</span>
            </h1>
            <p class="text-sm sm:text-base text-light-muted dark:text-white/70 max-w-2xl leading-6">
              Vista rápida del estado operativo: inventario, asignaciones, mantenimiento y actividad reciente en un solo lugar.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-light-card/90 dark:bg-dark-card/70 border border-light-border dark:border-dark-border text-[10px] font-black uppercase tracking-[0.16em] text-light-muted dark:text-white/80">
              <Monitor :size="14" />
              {{ getAvailabilityLabel() }}
            </span>
            <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-light-card/90 dark:bg-dark-card/70 border border-light-border dark:border-dark-border text-[10px] font-black uppercase tracking-[0.16em] text-light-muted dark:text-white/80">
              <TrendingUp :size="14" />
              Operación {{ operationalScore }}%
            </span>
            <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-light-card/90 dark:bg-dark-card/70 border border-light-border dark:border-dark-border text-[10px] font-black uppercase tracking-[0.16em] text-light-muted dark:text-white/80">
              <History :size="14" />
              {{ recentActivityCount }} actividades recientes
            </span>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 min-w-0 max-w-full">
          <div class="glass-panel p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Disponibilidad</p>
            <p class="mt-2 text-xl font-black text-white">{{ availabilityPercentage }}%</p>
            <p class="text-sm text-white/70">del inventario operacional</p>
          </div>
          <div class="glass-panel p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Requieren atención</p>
            <p class="mt-2 text-xl font-black text-white">{{ criticalEquipmentCount }}</p>
            <p class="text-sm text-white/70">en problemas o inactivos</p>
          </div>
          <div class="glass-panel p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Asignación</p>
            <p class="mt-2 text-xl font-black text-white">{{ assignmentRate }}%</p>
            <p class="text-sm text-white/70">de equipos en uso</p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0 max-w-full">
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
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 w-full min-w-0 max-w-full">
      <div class="space-y-6 min-w-0 max-w-full">
        <div class="panel-card p-6">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p class="section-kicker">Atajos</p>
              <h3 class="section-title mt-1">Acciones rápidas</h3>
            </div>
            <button @click="navigateTo('/equipos')" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              Ver inventario
              <ArrowUpRight :size="16" />
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div class="panel-card p-6">
          <div class="flex items-center justify-between gap-3 mb-6">
            <div>
              <p class="section-kicker">Actividad</p>
              <h3 class="section-title mt-1">Actividad reciente</h3>
            </div>
            <button @click="navigateTo('/asignaciones')" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              Ver todo
              <ArrowUpRight :size="16" />
            </button>
          </div>

          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="flex gap-4">
              <div class="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div v-else class="space-y-0 divide-y divide-light-border dark:divide-dark-border">
            <div
              v-for="(activity, index) in recentActivity"
              :key="index"
              class="py-4 first:pt-0 last:pb-0 flex items-center gap-4 group"
            >
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors border" :class="getActivityState(activity).tone">
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
                <span v-if="!activity.activo" class="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Fin: {{ formatDate(activity.fecha_fin) }}
                </span>
              </div>
            </div>

            <div v-if="recentActivity.length === 0" class="text-center py-8">
              <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Inbox class="text-slate-400" :size="24" />
              </div>
              <p class="text-light-muted dark:text-dark-muted">No hay actividad reciente.</p>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-6 min-w-0 max-w-full">
        <div class="panel-card p-6">
          <div class="flex items-center justify-between mb-6 gap-3">
            <div>
              <p class="section-kicker">Inventario</p>
              <h3 class="section-title mt-1">Distribución por tipo</h3>
            </div>
            <span class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-light-muted dark:text-dark-muted">
              Total {{ stats.equipos }}
            </span>
          </div>

          <div v-if="loading" class="space-y-4">
            <div v-for="i in 4" :key="i" class="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>

          <div v-else class="space-y-4">
            <div v-for="item in equipmentDistribution" :key="item.label" class="group">
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-light-text dark:text-dark-text group-hover:text-primary transition-colors">{{ item.label }}</span>
                <span class="text-light-muted dark:text-dark-muted text-xs">{{ item.count }}</span>
              </div>
              <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

        <div class="panel-card p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="section-kicker">Estado</p>
              <h3 class="section-title mt-1">Salud operativa</h3>
            </div>
            <Server class="text-light-muted dark:text-dark-muted" :size="20" />
          </div>

          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>

          <div v-else class="space-y-5">
            <div v-for="item in statusDistribution" :key="item.label" class="group">
              <div class="flex justify-between text-sm mb-1.5">
                <span class="font-medium text-light-text dark:text-dark-text group-hover:text-primary transition-colors">{{ item.label }}</span>
                <span class="font-bold text-light-text dark:text-dark-text">{{ item.count }}</span>
              </div>
              <div class="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

        <div class="panel-card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="section-kicker">Actualización</p>
              <h3 class="section-title mt-1">Último refresco</h3>
            </div>
            <ArrowUpRight :size="18" class="text-primary" />
          </div>
          <p class="text-sm text-light-muted dark:text-dark-muted">
            {{ lastUpdatedAt ? formatFullDate(lastUpdatedAt) : 'Cargando información...' }}
          </p>
          <p class="text-xs text-light-muted dark:text-dark-muted mt-2">
            El tablero muestra inventario, asignaciones y actividad reciente con la data más nueva disponible.
          </p>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-shell {
  background: linear-gradient(135deg, rgba(11, 15, 20, 0.96), rgba(18, 25, 31, 0.94));
}

.panel-card {
  @apply bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-card;
}

.section-kicker {
  @apply text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted;
}

.section-title {
  @apply text-lg font-black text-light-text dark:text-dark-text;
}

.glass-panel {
  @apply rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg;
}
</style>
