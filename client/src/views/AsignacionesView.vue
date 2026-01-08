<script setup>
/**
 * @fileoverview Vista principal de gestión de Asignaciones.
 * Permite visualizar el historial y estado actual de asignaciones de equipos.
 * Soporta finalizar asignaciones, ver detalles y crear nuevas.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import AsignacionesService from '../services/AsignacionesService'
import DataTable from '../components/ui/DataTable.vue'
import { 
  Search, 
  Plus, 
  FileText, 
  Link, 
  User, 
  Building, 
  Briefcase, 
  HelpCircle, 
  Eye, 
  CheckSquare 
} from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

const { confirmWarning, success: toastSuccess, error: toastError } = useSwal()
const router = useRouter()
const route = useRoute()

// Data
const asignaciones = ref([])
const loading = ref(true)
const globalFilter = ref('')
const viewMode = ref('active') // 'active' | 'history' | 'all'

// Columnas
const columns = [
  { field: 'equipo_nombre', header: 'Equipo', sortable: true, width: '25%' },
  { field: 'asignado_a', header: 'Asignado A', sortable: false, width: '25%' },
  { field: 'fecha_asignacion', header: 'Fecha Asignación', sortable: true, width: '15%' },
  { field: 'status_nombre', header: 'Estado', sortable: true, width: '15%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '15%', align: 'right' }
]

const filteredAsignaciones = computed(() => {
  if (!globalFilter.value) return asignaciones.value
  const search = globalFilter.value.toLowerCase()
  return asignaciones.value.filter(a =>
    a.equipo_nombre?.toLowerCase().includes(search) ||
    a.equipo_numero_serie?.toLowerCase().includes(search) ||
    a.empleado_nombres?.toLowerCase().includes(search) ||
    a.empleado_apellidos?.toLowerCase().includes(search) ||
    a.sucursal_asignada_nombre?.toLowerCase().includes(search) ||
    a.area_asignada_nombre?.toLowerCase().includes(search)
  )
})

const loadAsignaciones = async () => {
  loading.value = true
  try {
    let params = {}
    if (viewMode.value === 'active') params.activa = 'true'
    else if (viewMode.value === 'history') params.activa = 'false'
    
    const payload = await AsignacionesService.getAll(params)
    asignaciones.value = payload.filter(a => !a.id_equipo_padre)
  } catch (error) {
    console.error('Error al cargar asignaciones:', error)
    toastError('No se pudieron cargar las asignaciones')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.view === 'history') {
    viewMode.value = 'history'
  }
  loadAsignaciones()
})

watch(() => route.query.view, (newVal) => {
  if (newVal === 'history') viewMode.value = 'history'
  else if (newVal === 'active' || !newVal) viewMode.value = 'active'
})

watch(viewMode, () => {
  loadAsignaciones()
})

const openNew = () => {
  router.push({ name: 'asignaciones-nuevo' })
}

const viewAsignacion = (data) => {
  router.push({ name: 'asignaciones-detalle', params: { id: data.id } })
}

const finalizarAsignacion = async (data) => {
  const result = await confirmWarning({
    title: 'Finalizar Asignación',
    text: `¿Desea finalizar la asignación del equipo ${data.equipo_nombre}?`,
    confirmButtonText: 'Finalizar',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await AsignacionesService.finalizar(data.id)
      toastSuccess('Asignación finalizada correctamente')
      loadAsignaciones()
    } catch (error) {
      console.error('Error al finalizar:', error)
      toastError('No se pudo finalizar la asignación')
    }
  }
}

import { getStatusSeverity } from '../utils/status'

// Helpers
const getSeverity = getStatusSeverity

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const getAsignadoA = (data) => {
  if (data.id_empleado) return `${data.empleado_nombres} ${data.empleado_apellidos}`
  if (data.id_sucursal_asignado) return data.sucursal_asignada_nombre
  if (data.id_area_asignado) return data.area_asignada_nombre
  return 'N/A'
}

const getTipoAsignacion = (data) => {
  if (data.id_empleado) return { label: 'Empleado', icon: User, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' }
  if (data.id_sucursal_asignado) return { label: 'Sucursal', icon: Building, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' }
  if (data.id_area_asignado) return { label: 'Área', icon: Briefcase, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' }
  return { label: 'Desconocido', icon: HelpCircle, color: 'text-gray-500' }
}

const clearFilters = () => {
  globalFilter.value = ''
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <!-- Search -->
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="globalFilter" placeholder="Buscar..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <!-- View Mode Switch -->
          <div class="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
            <button 
              @click="viewMode = 'active'"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'active' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700']"
            >Activas</button>
            <button 
              @click="viewMode = 'history'"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'history' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700']"
            >Historial</button>
            <button 
              @click="viewMode = 'all'"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'all' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700']"
            >Todas</button>
          </div>
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nueva Asignación</span>
        </button>
      </div>

      <!-- DATATABLE NATIVO -->
      <DataTable 
        :data="filteredAsignaciones" 
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <FileText class="text-gray-400" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No hay asignaciones</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">No se encontraron registros activos o que coincidan con la búsqueda.</p>
            <button v-if="globalFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <!-- Equipo -->
        <template #equipo_nombre="{ data }">
          <div class="flex flex-col">
            <span class="text-gray-900 dark:text-white font-bold text-sm">{{ data.equipo_nombre }}</span>
            <span class="text-xs text-gray-500 font-mono">{{ data.equipo_numero_serie }}</span>
            <div v-if="data.equipo_padre_nombre" class="flex items-center gap-1 mt-1 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md w-fit">
              <Link :size="10" />
              <span>Componente</span>
            </div>
          </div>
        </template>

        <template #skeleton-equipo_nombre>
          <div class="space-y-1">
            <div class="skeleton h-4 w-28"></div>
            <div class="skeleton h-3 w-20"></div>
          </div>
        </template>

        <!-- Asignado A -->
        <template #asignado_a="{ data }">
          <div class="flex items-center gap-2">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', getTipoAsignacion(data).color]">
              <component :is="getTipoAsignacion(data).icon" :size="16" />
            </div>
            <div class="flex flex-col">
              <span class="text-gray-900 dark:text-white font-medium text-sm">{{ getAsignadoA(data) }}</span>
              <span class="text-xs text-gray-500">{{ getTipoAsignacion(data).label }}</span>
            </div>
          </div>
        </template>

        <template #skeleton-asignado_a>
          <div class="flex items-center gap-2">
            <div class="skeleton w-8 h-8 rounded-full"></div>
            <div class="space-y-1">
              <div class="skeleton h-4 w-24"></div>
              <div class="skeleton h-3 w-16"></div>
            </div>
          </div>
        </template>

        <!-- Fecha Asignación -->
        <template #fecha_asignacion="{ data }">
          <span class="text-gray-700 dark:text-gray-300 text-sm">{{ formatDate(data.fecha_asignacion) }}</span>
        </template>

        <template #skeleton-fecha_asignacion>
          <div class="skeleton h-4 w-20"></div>
        </template>

        <!-- Status -->
        <template #status_nombre="{ data }">
          <Tag :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5" />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-16 rounded-md"></div>
        </template>

        <!-- Actions -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewAsignacion(data)" title="Ver Detalle">
              <Eye :size="16" />
            </button>
            <button v-if="!data.fecha_fin_asignacion" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-500 dark:text-orange-400 flex items-center justify-center transition-all" @click="finalizarAsignacion(data)" title="Finalizar Asignación">
              <CheckSquare :size="16" />
            </button>
          </div>
        </template>

        <template #skeleton-actions>
          <div class="flex gap-2 justify-end">
            <div class="skeleton w-8 h-8 rounded-lg"></div>
            <div class="skeleton w-8 h-8 rounded-lg"></div>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
