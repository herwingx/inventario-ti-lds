<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TicketsService from '../services/TicketsService'
import StatCard from '../components/dashboard/StatCard.vue'
import { useAuthStore } from '../stores/auth'
import { useSwal } from '../composables/useSwal'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  Clock3,
  CircleDollarSign,
  RefreshCw,
  TimerReset,
  TrendingUp,
  Users
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const { error: toastError } = useSwal()

const metricsLoading = ref(true)
const supportMetrics = ref(null)
let refreshInterval = null

const canViewMetrics = computed(() => authStore.user?.roleId !== 2)

const emptyMetrics = {
  summary: {
    total_tickets: 0,
    created_in_range: 0,
    resolved_in_range: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    pending_tickets: 0,
    closed_tickets: 0,
    resolution_rate: 0,
    average_resolution_hours: 0,
    average_open_age_hours: 0,
    overdue_open_tickets: 0
  },
  charts: {
    timeline: [],
    by_status: [],
    by_priority: [],
    by_category: [],
    by_analyst: []
  },
  range: { days: 30 }
}

const formatDurationHours = (hours) => {
  if (!Number.isFinite(hours) || hours <= 0) return '0h'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  if (days <= 0) return `${Math.round(hours)}h`
  if (remainingHours === 0) return `${days}d`
  return `${days}d ${remainingHours}h`
}

const getMetricValue = (key) => supportMetrics.value?.summary?.[key] ?? emptyMetrics.summary[key]
const getChartSeries = (key) => supportMetrics.value?.charts?.[key] ?? emptyMetrics.charts[key]
const getSeriesMax = (series = []) => Math.max(...series.map(item => item.value || 0), 1)
const getTimelineMax = computed(() => {
  const series = getChartSeries('timeline')
  return Math.max(...series.map(item => Math.max(item.created || 0, item.resolved || 0)), 1)
})

const timelineSeries = computed(() => getChartSeries('timeline'))
const statusSeries = computed(() => getChartSeries('by_status'))
const prioritySeries = computed(() => getChartSeries('by_priority'))
const categorySeries = computed(() => getChartSeries('by_category'))
const analystSeries = computed(() => getChartSeries('by_analyst'))
const visibleTimelineSeries = computed(() => {
  const series = timelineSeries.value
  if (series.length <= 14) return series
  return series.slice(-14)
})

const rangeDays = computed(() => supportMetrics.value?.range?.days || 30)
const createdCount = computed(() => getMetricValue('created_in_range'))
const resolvedCount = computed(() => getMetricValue('resolved_in_range'))
const resolutionRate = computed(() => getMetricValue('resolution_rate'))
const overdueTickets = computed(() => getMetricValue('overdue_open_tickets'))
const openTickets = computed(() => getMetricValue('open_tickets'))
const averageResolutionHours = computed(() => getMetricValue('average_resolution_hours'))
const averageOpenAgeHours = computed(() => getMetricValue('average_open_age_hours'))

const totalTimelineActivity = computed(() => timelineSeries.value.reduce((sum, item) => sum + (item.created || 0) + (item.resolved || 0), 0))
const activeDays = computed(() => timelineSeries.value.filter(item => (item.created || 0) + (item.resolved || 0) > 0).length)
const visibleActiveDays = computed(() => visibleTimelineSeries.value.filter(item => (item.created || 0) + (item.resolved || 0) > 0).length)

const peakCreatedDay = computed(() => {
  if (!timelineSeries.value.length) return null
  return timelineSeries.value.reduce((best, item) => ((item.created || 0) > (best?.created || 0) ? item : best), timelineSeries.value[0])
})

const peakResolvedDay = computed(() => {
  if (!timelineSeries.value.length) return null
  return timelineSeries.value.reduce((best, item) => ((item.resolved || 0) > (best?.resolved || 0) ? item : best), timelineSeries.value[0])
})

const topCategory = computed(() => categorySeries.value[0] || null)
const topAnalyst = computed(() => analystSeries.value[0] || null)

const healthState = computed(() => {
  if (overdueTickets.value > 0) {
    return {
      tone: 'warning',
      label: 'Revisar backlog',
      description: `${overdueTickets.value} tickets abiertos ya cruzaron el umbral de atención.`
    }
  }

  if (resolutionRate.value >= 80) {
    return {
      tone: 'success',
      label: 'Flujo saludable',
      description: 'La capacidad de cierre está por encima de la meta esperada.'
    }
  }

  return {
    tone: 'info',
    label: 'Monitoreo normal',
    description: 'No hay alertas críticas, pero conviene vigilar el volumen abierto.'
  }
})

const averageResolutionLabel = computed(() => formatDurationHours(averageResolutionHours.value))
const averageOpenAgeLabel = computed(() => formatDurationHours(averageOpenAgeHours.value))

const loadMetrics = async () => {
  if (!canViewMetrics.value) {
    supportMetrics.value = null
    metricsLoading.value = false
    return
  }

  metricsLoading.value = true
  try {
    supportMetrics.value = await TicketsService.getSupportMetrics({ days: 30 })
  } catch (error) {
    console.error('Error loading support metrics:', error)
    supportMetrics.value = emptyMetrics
    toastError('No se pudieron cargar las métricas')
  } finally {
    metricsLoading.value = false
  }
}

const refreshMetrics = () => loadMetrics()
const getDayTotal = (day) => (day?.created || 0) + (day?.resolved || 0)

const getPercent = (value, total) => {
  if (!total) return 0
  return Math.max(8, Math.round((value / total) * 100))
}

const getChartHeight = (value, max) => {
  if (!value || !max) return '0%'
  return `${Math.max(12, Math.round((value / max) * 100))}%`
}

const visibleTimelineMax = computed(() => {
  const series = visibleTimelineSeries.value
  return Math.max(...series.map(item => Math.max(item.created || 0, item.resolved || 0)), 1)
})

onMounted(() => {
  loadMetrics()
  refreshInterval = setInterval(loadMetrics, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="animate-fade-in-up pt-2 sm:pt-3 w-full min-w-0 max-w-full">
    <div class="space-y-5 w-full min-w-0 max-w-full">
      <section class="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-dark-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl w-full min-w-0 max-w-full">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,201,172,0.28),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]"></div>
        <div class="relative p-5 sm:p-6 lg:p-7 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)] items-start w-full min-w-0 max-w-full">
          <div class="space-y-5 min-w-0 max-w-full">
            <div class="flex flex-wrap items-center gap-3">
              <button @click="router.push({ name: 'tickets' })" class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/10 transition-all">
                <ArrowLeft :size="18" />
              </button>
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.22em] text-white/85">
                <TrendingUp :size="14" />
                Soporte técnico
              </span>
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary/20 border border-primary/20 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                Últimos {{ rangeDays }} días
              </span>
            </div>

            <div class="max-w-3xl space-y-3">
              <p class="text-[10px] font-black uppercase tracking-[0.36em] text-white/55">Tablero ejecutivo</p>
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">Métricas operativas de soporte</h1>
              <p class="text-sm sm:text-base text-white/70 max-w-2xl leading-6">
                Un tablero para leer, de un vistazo, el flujo de tickets, la presión del backlog y la carga por responsable.
                La gráfica muestra el tramo visible más reciente para que las fechas y los valores se entiendan de inmediato.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-white/85">
                <AlertTriangle :size="14" />
                Vencidos {{ overdueTickets }}
              </span>
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-white/85">
                <TimerReset :size="14" />
                Abiertos {{ openTickets }}
              </span>
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-white/85">
                <Clock3 :size="14" />
                Promedio cierre {{ averageResolutionLabel }}
              </span>
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-white/85">
                <Users :size="14" />
                Actividad {{ activeDays }} días
              </span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 min-w-0 max-w-full">
            <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <span class="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Salud operativa</span>
                <span class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                  <RefreshCw :size="12" :class="metricsLoading ? 'animate-spin' : ''" />
                  Auto 30s
                </span>
              </div>
              <div class="space-y-2">
                <h2 class="text-xl font-black">{{ healthState.label }}</h2>
                <p class="text-sm text-white/70 leading-6">{{ healthState.description }}</p>
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/60 mb-2">Resumen</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-white/55">Creados</p>
                  <p class="text-2xl font-black">{{ createdCount }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-white/55">Resueltos</p>
                  <p class="text-2xl font-black">{{ resolvedCount }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-white/55">Tasa</p>
                  <p class="text-2xl font-black">{{ resolutionRate }}%</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-white/55">Apertura</p>
                  <p class="text-2xl font-black">{{ averageOpenAgeLabel }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/60 mb-2">Top foco</p>
              <div class="space-y-3">
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-white/55">Categoría</p>
                  <p class="text-lg font-black leading-tight">{{ topCategory?.label || 'Sin datos' }}</p>
                  <p class="text-sm text-white/65">{{ topCategory?.value || 0 }} tickets</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-white/55">Responsable</p>
                  <p class="text-lg font-black leading-tight">{{ topAnalyst?.label || 'Sin datos' }}</p>
                  <p class="text-sm text-white/65">{{ topAnalyst?.value || 0 }} asignaciones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-w-0 max-w-full">
        <StatCard title="Creados en rango" :value="createdCount" subtitle="Tickets registrados" :loading="metricsLoading" color="primary" :icon="BarChart3" />
        <StatCard title="Resueltos en rango" :value="resolvedCount" subtitle="Tickets cerrados" :loading="metricsLoading" color="success" :icon="Check" />
        <StatCard title="Backlog abierto" :value="openTickets" subtitle="Pendientes de atención" :loading="metricsLoading" color="warning" :icon="TimerReset" />
        <StatCard title="Tiempo promedio" :value="Math.round(averageResolutionHours)" subtitle="De resolución" :loading="metricsLoading" color="info" :icon="Clock3" :growth="averageResolutionLabel" />
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-4 items-start w-full min-w-0 max-w-full">
        <div class="space-y-4 min-w-0 max-w-full">
          <div class="rounded-3xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4 sm:p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-light-muted dark:text-dark-muted">Tendencia</p>
                <h3 class="text-xl font-black text-light-text dark:text-dark-text mt-1">Actividad diaria</h3>
                <p class="text-sm text-light-muted dark:text-dark-muted mt-1">Vista compacta del volumen diario para detectar picos y días planos sin perder contexto. Se muestran los últimos {{ visibleTimelineSeries.length }} días.</p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 dark:bg-dark-bg text-[10px] font-black uppercase tracking-[0.16em] text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border">
                  <ArrowUpRight :size="14" />
                  {{ totalTimelineActivity }} eventos
                </span>
                <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 dark:bg-dark-bg text-[10px] font-black uppercase tracking-[0.16em] text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border">
                  <Users :size="14" />
                  {{ visibleActiveDays }} días con movimiento
                </span>
              </div>
            </div>

            <div v-if="metricsLoading" class="h-72 rounded-3xl bg-slate-100 dark:bg-dark-bg animate-pulse"></div>
            <div v-else-if="!visibleTimelineSeries.length" class="h-72 rounded-3xl border border-dashed border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg flex items-center justify-center text-sm text-light-muted dark:text-dark-muted">
              No hay actividad para mostrar en este rango.
            </div>
            <div v-else class="pb-2 overflow-hidden">
              <div
                class="grid h-72 items-end gap-2 sm:gap-3"
                :style="{ gridTemplateColumns: `repeat(${visibleTimelineSeries.length}, minmax(0, 1fr))` }"
              >
                <div
                  v-for="point in visibleTimelineSeries"
                  :key="point.date"
                  class="min-w-0 group flex flex-col"
                >
                  <div class="h-56 rounded-2xl border border-light-border/70 dark:border-dark-border bg-gradient-to-b from-slate-50 to-white dark:from-dark-bg dark:to-dark-card p-2 shadow-sm transition-all group-hover:border-primary/40 flex flex-col justify-end">
                    <div class="flex items-end gap-2 h-full pb-1">
                      <div class="flex-1 h-full flex flex-col justify-end items-center gap-2">
                        <div class="w-full max-w-[18px] rounded-full bg-primary/15 border border-primary/20 h-full flex items-end overflow-hidden">
                          <div class="w-full rounded-full bg-primary transition-all" :style="{ height: getChartHeight(point.created, visibleTimelineMax) }"></div>
                        </div>
                        <span class="text-[10px] font-black text-primary leading-none">{{ point.created || 0 }}</span>
                      </div>
                      <div class="flex-1 h-full flex flex-col justify-end items-center gap-2">
                        <div class="w-full max-w-[18px] rounded-full bg-emerald-500/15 border border-emerald-500/20 h-full flex items-end overflow-hidden">
                          <div class="w-full rounded-full bg-emerald-500 transition-all" :style="{ height: getChartHeight(point.resolved, visibleTimelineMax) }"></div>
                        </div>
                        <span class="text-[10px] font-black text-emerald-500 leading-none">{{ point.resolved || 0 }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="mt-2 text-center space-y-1 min-h-12">
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-light-muted dark:text-dark-muted leading-none">
                      {{ point.label }}
                    </p>
                    <p class="text-[11px] font-bold text-light-text dark:text-dark-text leading-none">
                      Total {{ getDayTotal(point) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-light-muted dark:text-dark-muted">Pico de creación</p>
                <p class="mt-2 text-lg font-black text-light-text dark:text-dark-text">{{ peakCreatedDay?.label || 'N/A' }}</p>
                <p class="text-sm text-light-muted dark:text-dark-muted">{{ peakCreatedDay?.created || 0 }} tickets</p>
              </div>
              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-light-muted dark:text-dark-muted">Pico de resolución</p>
                <p class="mt-2 text-lg font-black text-light-text dark:text-dark-text">{{ peakResolvedDay?.label || 'N/A' }}</p>
                <p class="text-sm text-light-muted dark:text-dark-muted">{{ peakResolvedDay?.resolved || 0 }} tickets</p>
              </div>
              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-light-muted dark:text-dark-muted">Antigüedad abierta</p>
                <p class="mt-2 text-lg font-black text-light-text dark:text-dark-text">{{ averageOpenAgeLabel }}</p>
                <p class="text-sm text-light-muted dark:text-dark-muted">Tiempo promedio con tickets abiertos</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0 max-w-full">
            <div class="rounded-3xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4 sm:p-5 shadow-sm">
              <div class="flex items-center justify-between mb-4 gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted">Estado actual</p>
                  <h3 class="text-lg font-black text-light-text dark:text-dark-text">Distribución</h3>
                </div>
                <Users :size="16" class="text-primary" />
              </div>

              <div v-if="metricsLoading" class="space-y-3">
                <div v-for="i in 5" :key="i" class="h-9 rounded-xl bg-slate-100 dark:bg-dark-bg animate-pulse"></div>
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in statusSeries" :key="item.label" class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-light-text dark:text-dark-text">{{ item.label }}</span>
                    <span class="text-light-muted dark:text-dark-muted">{{ item.value }}</span>
                  </div>
                  <div class="h-2.5 rounded-full bg-slate-100 dark:bg-dark-bg overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-primary to-teal-500 transition-all" :style="{ width: `${getPercent(item.value, getSeriesMax(statusSeries))}%` }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4 sm:p-5 shadow-sm">
              <div class="flex items-center justify-between mb-4 gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted">Prioridad</p>
                  <h3 class="text-lg font-black text-light-text dark:text-dark-text">Carga por severidad</h3>
                </div>
                <AlertTriangle :size="16" class="text-primary" />
              </div>

              <div v-if="metricsLoading" class="space-y-3">
                <div v-for="i in 4" :key="i" class="h-9 rounded-xl bg-slate-100 dark:bg-dark-bg animate-pulse"></div>
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in prioritySeries" :key="item.label" class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-light-text dark:text-dark-text">{{ item.label }}</span>
                    <span class="text-light-muted dark:text-dark-muted">{{ item.value }}</span>
                  </div>
                  <div class="h-2.5 rounded-full bg-slate-100 dark:bg-dark-bg overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" :style="{ width: `${getPercent(item.value, getSeriesMax(prioritySeries))}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4 min-w-0 max-w-full">
          <div class="rounded-3xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4 sm:p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4 gap-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted">Impacto</p>
                <h3 class="text-lg font-black text-light-text dark:text-dark-text">Categorías y responsables</h3>
              </div>
              <CircleDollarSign :size="16" class="text-primary" />
            </div>

            <div class="space-y-5">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted mb-3">Categorías con más carga</p>
                <div v-if="metricsLoading" class="space-y-2">
                  <div v-for="i in 4" :key="i" class="h-8 rounded-xl bg-slate-100 dark:bg-dark-bg animate-pulse"></div>
                </div>
                <div v-else class="space-y-3">
                  <div v-for="item in categorySeries" :key="item.label" class="space-y-1.5">
                    <div class="flex items-center justify-between text-[11px] font-bold">
                      <span class="truncate text-light-text dark:text-dark-text">{{ item.label }}</span>
                      <span class="text-light-muted dark:text-dark-muted">{{ item.value }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-dark-bg overflow-hidden">
                      <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" :style="{ width: `${getPercent(item.value, getSeriesMax(categorySeries))}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted mb-3">Responsable principal</p>
                <div v-if="metricsLoading" class="h-16 rounded-xl bg-slate-100 dark:bg-dark-card animate-pulse"></div>
                <div v-else-if="topAnalyst" class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-base font-black text-light-text dark:text-dark-text truncate">{{ topAnalyst.label }}</p>
                    <p class="text-sm text-light-muted dark:text-dark-muted">{{ topAnalyst.value }} tickets asignados</p>
                  </div>
                  <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.18em] border border-primary/20">
                    <ArrowUpRight :size="14" />
                    Lidera
                  </span>
                </div>
                <div v-else class="text-sm text-light-muted dark:text-dark-muted">No hay responsables para mostrar.</div>
              </div>

              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted mb-3">Top responsables</p>
                <div v-if="metricsLoading" class="space-y-2">
                  <div v-for="i in 3" :key="i" class="h-8 rounded-xl bg-slate-100 dark:bg-dark-bg animate-pulse"></div>
                </div>
                <div v-else class="space-y-2">
                  <div v-for="item in analystSeries" :key="item.label" class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border">
                    <span class="text-xs font-bold text-light-text dark:text-dark-text truncate">{{ item.label }}</span>
                    <span class="text-xs font-black text-primary">{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4 sm:p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4 gap-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted">Insights</p>
                <h3 class="text-lg font-black text-light-text dark:text-dark-text">Lectura rápida</h3>
              </div>
              <Check :size="16" class="text-primary" />
            </div>

            <div class="space-y-3">
              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted">Volumen total</p>
                <p class="mt-2 text-2xl font-black text-light-text dark:text-dark-text">{{ createdCount + resolvedCount }}</p>
                <p class="text-sm text-light-muted dark:text-dark-muted">Tickets creados y resueltos dentro del rango.</p>
              </div>
              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted">Ritmo</p>
                <p class="mt-2 text-2xl font-black text-light-text dark:text-dark-text">{{ activeDays }} días</p>
                <p class="text-sm text-light-muted dark:text-dark-muted">Con movimiento real en el periodo visualizado.</p>
              </div>
              <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted">Meta operativa</p>
                <p class="mt-2 text-2xl font-black text-light-text dark:text-dark-text">{{ resolutionRate }}%</p>
                <p class="text-sm text-light-muted dark:text-dark-muted">Tasa de resolución reportada por el backend.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(19, 180, 151, 0.25);
  border-radius: 20px;
}
</style>
