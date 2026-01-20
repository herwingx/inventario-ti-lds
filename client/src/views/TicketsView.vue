<script setup>
/**
 * @fileoverview Vista de Tickets de Soporte.
 * Muestra listado de tickets con filtros por estado y prioridad.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import TicketsService from '../services/TicketsService'
import DataTable from '../components/ui/DataTable.vue'
import { Search, Plus, Eye, Pencil, Trash2, Ticket, User, Calendar, Monitor, AlertCircle, Clock, CheckCircle } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

// Data
const tickets = ref([])
const loading = ref(true)
const globalFilter = ref('')
const estatusFilter = ref(null)
const prioridadFilter = ref(null)

// Opciones de filtros
const estatusOptions = [
  { label: 'Todos', value: null },
  { label: 'Abierto', value: 'ABIERTO' },
  { label: 'En Progreso', value: 'EN_PROGRESO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Resuelto', value: 'RESUELTO' },
  { label: 'Cerrado', value: 'CERRADO' }
]

const prioridadOptions = [
  { label: 'Todas', value: null },
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Crítica', value: 'CRITICA' }
]

// Columnas
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'equipo', header: 'Equipo', sortable: true, width: '20%' },
  { field: 'tipo_falla', header: 'Tipo', sortable: true, width: '12%' },
  { field: 'prioridad', header: 'Prioridad', sortable: true, width: '10%' },
  { field: 'estatus', header: 'Estado', sortable: true, width: '12%' },
  { field: 'asignado_a', header: 'Técnico', sortable: true, width: '15%' },
  { field: 'fecha_creacion', header: 'Fecha', sortable: true, width: '13%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '13%', align: 'right' }
]

const filteredTickets = computed(() => {
  let result = tickets.value

  // Filtro por búsqueda global
  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(t =>
      t.descripcion?.toLowerCase().includes(search) ||
      t.equipo_marca?.toLowerCase().includes(search) ||
      t.equipo_modelo?.toLowerCase().includes(search) ||
      t.equipo_serie?.toLowerCase().includes(search) ||
      t.asignado_a?.toLowerCase().includes(search)
    )
  }

  // Filtro por estatus
  if (estatusFilter.value) {
    result = result.filter(t => t.estatus === estatusFilter.value)
  }

  // Filtro por prioridad
  if (prioridadFilter.value) {
    result = result.filter(t => t.prioridad === prioridadFilter.value)
  }

  return result
})

onMounted(async () => {
  loadTickets()
})

const loadTickets = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 400))
  try {
    tickets.value = await TicketsService.getAll()
  } catch (error) {
    toastError('No se pudieron cargar los tickets')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getPrioridadSeverity = (prioridad) => {
  const map = {
    'BAJA': 'secondary',
    'MEDIA': 'info',
    'ALTA': 'warn',
    'CRITICA': 'danger'
  }
  return map[prioridad] || 'secondary'
}

const getEstatusSeverity = (estatus) => {
  const map = {
    'ABIERTO': 'danger',
    'EN_PROGRESO': 'warn',
    'PENDIENTE': 'secondary',
    'RESUELTO': 'success',
    'CERRADO': 'contrast'
  }
  return map[estatus] || 'secondary'
}

const getEstatusIcon = (estatus) => {
  const map = {
    'ABIERTO': AlertCircle,
    'EN_PROGRESO': Clock,
    'PENDIENTE': Clock,
    'RESUELTO': CheckCircle,
    'CERRADO': CheckCircle
  }
  return map[estatus] || AlertCircle
}

const openNew = () => {
  // TODO: Implementar formulario de tickets
  toastInfo('Los tickets se crean desde el escaneo QR del equipo')
}

const viewTicket = (ticket) => {
  router.push({ name: 'tickets-detalle', params: { id: ticket.id } })
}

const editTicket = (ticket) => {
  router.push({ name: 'tickets-detalle', params: { id: ticket.id } })
}

const deleteTicket = async (ticket) => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: '¿Estás seguro de eliminar este ticket?',
    confirmButtonText: 'Eliminar Ticket',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await TicketsService.delete(ticket.id)
      toastSuccess('Ticket eliminado')
      loadTickets()
    } catch (error) {
      toastError('No se pudo eliminar el ticket')
    }
  } else {
    toastInfo('Operación cancelada')
  }
}

const clearFilters = () => {
  globalFilter.value = ''
  estatusFilter.value = null
  prioridadFilter.value = null
}

const truncate = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        
        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <!-- Búsqueda -->
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="globalFilter" placeholder="Buscar tickets..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <!-- Filtro Estado -->
          <Select 
            v-model="estatusFilter" 
            :options="estatusOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Estado" 
            class="w-full sm:w-40"
          />

          <!-- Filtro Prioridad -->
          <Select 
            v-model="prioridadFilter" 
            :options="prioridadOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Prioridad" 
            class="w-full sm:w-40"
          />
        </div>

        <button class="btn-primary w-full lg:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nuevo Ticket</span>
        </button>
      </div>

      <!-- DataTable -->
      <DataTable 
        :data="filteredTickets"
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Ticket class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Sin Tickets</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay tickets de soporte registrados.</p>
            <button v-if="globalFilter || estatusFilter || prioridadFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <template #skeleton-id>
          <div class="skeleton h-4 w-8"></div>
        </template>

        <template #equipo="{ data }">
          <div class="flex items-center gap-2">
            <Monitor :size="16" class="text-primary flex-shrink-0" />
            <div>
              <div class="text-gray-900 dark:text-white font-semibold text-sm">{{ data.equipo_marca }} {{ data.equipo_modelo }}</div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">{{ data.equipo_serie }}</span>
            </div>
          </div>
        </template>

        <template #skeleton-equipo>
          <div class="space-y-1">
            <div class="skeleton h-4 w-32"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
        </template>

        <template #tipo_falla="{ data }">
          <Tag :value="data.tipo_falla" severity="info" class="!text-xs !font-bold" />
        </template>

        <template #skeleton-tipo_falla>
          <div class="skeleton h-5 w-20 rounded-md"></div>
        </template>

        <template #prioridad="{ data }">
          <Tag :value="data.prioridad" :severity="getPrioridadSeverity(data.prioridad)" class="!text-xs !font-bold" />
        </template>

        <template #skeleton-prioridad>
          <div class="skeleton h-5 w-16 rounded-md"></div>
        </template>

        <template #estatus="{ data }">
          <div class="flex items-center gap-1.5">
            <component :is="getEstatusIcon(data.estatus)" :size="14" />
            <Tag :value="data.estatus.replace('_', ' ')" :severity="getEstatusSeverity(data.estatus)" class="!text-xs !font-bold" />
          </div>
        </template>

        <template #skeleton-estatus>
          <div class="skeleton h-5 w-24 rounded-md"></div>
        </template>

        <template #asignado_a="{ data }">
          <div v-if="data.asignado_a" class="flex items-center gap-1.5">
            <User :size="14" class="text-primary" />
            <span class="text-gray-700 dark:text-gray-300 text-sm">{{ data.asignado_a }}</span>
          </div>
          <span v-else class="text-gray-400 text-sm italic">Sin asignar</span>
        </template>

        <template #skeleton-asignado_a>
          <div class="skeleton h-4 w-24"></div>
        </template>

        <template #fecha_creacion="{ data }">
          <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Calendar :size="14" class="text-primary" />
            {{ formatDate(data.fecha_creacion) }}
          </div>
        </template>

        <template #skeleton-fecha_creacion>
          <div class="skeleton h-3 w-28"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewTicket(data)" title="Ver Detalle">
              <Eye :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="deleteTicket(data)" title="Eliminar">
              <Trash2 :size="16" />
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
