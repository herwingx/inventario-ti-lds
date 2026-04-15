<script setup>
/**
 * @fileoverview Consola General de Soporte Técnico (Tickets Activos).
 * Sincronizada 100% con el estándar visual de EquiposView.
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import TicketsService from '../services/TicketsService'
import { useAuthStore } from '../stores/auth'
import { useSwal } from '../composables/useSwal'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { 
  Search, 
  Check, 
  Eye, 
  Trash2,
  Plus
} from 'lucide-vue-next'

// PrimeVue
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const router = useRouter()
const authStore = useAuthStore()
const { error: toastError, success: toastSuccess, confirmWarning, confirmDelete } = useSwal()

// Data
const tickets = ref([])
const loading = ref(true)
let ticketsListPollingInterval = null

const roleId = computed(() => authStore.user?.roleId)
const isAdmin = computed(() => roleId.value === 1)
const isAnalyst = computed(() => roleId.value === 3)
const canViewAdminColumns = computed(() => roleId.value !== 2)
const canCreateTicket = computed(() => roleId.value !== 3)

// Filtros
const globalFilter = ref('')
const statusFilter = ref(null)
const priorityFilter = ref(null)

const statusOptions = [
  { label: 'Abierto', value: 'ABIERTO' },
  { label: 'En Progreso', value: 'EN_PROGRESO' },
  { label: 'Pendiente', value: 'PENDIENTE' }
]

const priorityOptions = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Crítica', value: 'CRITICA' }
]

const columns = computed(() => {
  const baseColumns = [
    { field: 'id', header: 'ID', sortable: true, width: '6%' },
    { field: 'equipo_display', header: 'Equipo/Modelo', sortable: true, width: '26%' },
    { field: 'tipo_falla', header: 'Tipo de Falla', sortable: true, width: '16%' },
    { field: 'prioridad', header: 'Prioridad', sortable: true, width: '12%' },
    { field: 'estatus', header: 'Estado', sortable: true, width: '12%' },
    { field: 'fecha_creacion', header: 'Registro', sortable: true, width: '12%' },
    { field: 'actions', header: 'Acciones', sortable: false, width: '10%', align: 'right' }
  ]

  if (!canViewAdminColumns.value) {
    return baseColumns
  }

  return [
    { field: 'id', header: 'ID', sortable: true, width: '5%' },
    { field: 'equipo_display', header: 'Equipo/Modelo', sortable: true, width: '25%' },
    { field: 'reporta_nombre', header: 'Reportó', sortable: true, width: '14%' },
    { field: 'tecnico_asignado', header: 'Asignado a', sortable: true, width: '14%' },
    { field: 'tipo_falla', header: 'Tipo de Falla', sortable: true, width: '15%' },
    { field: 'prioridad', header: 'Prioridad', sortable: true, width: '12%' },
    { field: 'estatus', header: 'Estado', sortable: true, width: '12%' },
    { field: 'fecha_creacion', header: 'Registro', sortable: true, width: '10%' },
    { field: 'actions', header: 'Acciones', sortable: false, width: '8%', align: 'right' }
  ]
})

const createTicket = () => {
  if (!canCreateTicket.value) return
  router.push({ name: 'tickets-nuevo' })
}

const filteredTickets = computed(() => {
  let result = tickets.value
  if (globalFilter.value) {
    const s = globalFilter.value.toLowerCase()
    result = result.filter(t => 
      t.equipo_marca?.toLowerCase().includes(s) ||
      t.equipo_modelo?.toLowerCase().includes(s) ||
      t.reporta_nombre?.toLowerCase().includes(s) ||
      t.tecnico_asignado?.toLowerCase().includes(s) ||
      t.titulo?.toLowerCase().includes(s) ||
      t.categoria?.toLowerCase().includes(s) ||
      t.tipo_falla?.toLowerCase().includes(s) ||
      String(t.id).includes(s)
    )
  }
  if (statusFilter.value) result = result.filter(t => t.estatus === statusFilter.value)
  if (priorityFilter.value) result = result.filter(t => t.prioridad === priorityFilter.value)
  return result
})

const loadTickets = async () => {
  loading.value = true
  try {
    const all = await TicketsService.getAll()
    tickets.value = all.map(t => ({
      ...t,
      equipo_marca: t.equipos?.marca || 'N/A',
      equipo_modelo: t.equipos?.modelo || 'S/N',
      equipo_display: `${t.equipos?.marca || 'N/A'} ${t.equipos?.modelo || ''}`,
      reporta_nombre: getUserDisplayName(
        t.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema,
        t.nombre_reporta || t.email_reporta || 'Usuario Externo'
      ),
      tecnico_asignado: getUserDisplayName(
        t.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema,
        'Sin asignar'
      )
    })).filter(t => {
      const s = (t.estatus || '').toUpperCase()
      return s !== 'RESUELTO' && s !== 'CERRADO'
    })
  } catch (error) {
    toastError('Error al cargar reportes')
  } finally {
    loading.value = false
  }
}

const markAsResolved = async (ticket) => {
  const result = await confirmWarning({
    title: '¿Resolver Ticket?',
    text: `El folio #${ticket.id} se marcará como RESUELTO.`,
    confirmButtonText: 'Sí, resolver',
    cancelButtonText: 'Cancelar'
  })
  if (result.isConfirmed) {
    try {
      await TicketsService.update(ticket.id, { estatus: 'RESUELTO' })
      toastSuccess('Ticket finalizado')
      loadTickets()
    } catch (e) {
      console.error(e)
      toastError('Error al actualizar')
    }
  }
}

const confirmDeleteTicket = async (ticket) => {
  const result = await confirmDelete({
    title: '¿Eliminar Ticket?',
    text: `Esta acción no se puede deshacer. Se eliminará el folio #${ticket.id}.`,
    confirmButtonText: 'Eliminar permanentemente',
    cancelButtonText: 'Cancelar'
  })
  if (result.isConfirmed) {
    try {
      await TicketsService.delete(ticket.id)
      toastSuccess('Ticket eliminado')
      loadTickets()
    } catch (e) {
      toastError('Error al eliminar')
    }
  }
}

const viewDetail = (ticket) => {
  router.push({ name: 'tickets-detalle', params: { id: ticket.id } })
}

// Auto-refresh polling para sincronización en tiempo real
const startTicketsPolling = () => {
  loadTickets()
  ticketsListPollingInterval = setInterval(loadTickets, 15000) // Cada 15 segundos
}

const stopTicketsPolling = () => {
  if (ticketsListPollingInterval) {
    clearInterval(ticketsListPollingInterval)
    ticketsListPollingInterval = null
  }
}

onMounted(startTicketsPolling)
onUnmounted(stopTicketsPolling)

const getPrioritySeverity = (p) => {
  const map = { 'BAJA': 'secondary', 'MEDIA': 'info', 'ALTA': 'warn', 'CRITICA': 'danger' }
  return map[p] || 'info'
}
const getSeverity = getStatusSeverity
const formatStatus = (s) => s ? String(s).replace(/_/g, ' ') : ''

const prettifyUsername = (username) => {
  const source = String(username || '').trim()
  if (!source) return ''

  return source
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const getUserDisplayName = (user, fallback = 'Usuario Externo') => {
  const firstName = String(user?.nombres || '').trim()
  const lastName = String(user?.apellidos || '').trim()
  if (firstName && lastName) return `${firstName} ${lastName}`

  const employeeFirstName = String(user?.empleados?.nombres || '').trim()
  const employeeLastName = String(user?.empleados?.apellidos || '').trim()
  if (employeeFirstName && employeeLastName) return `${employeeFirstName} ${employeeLastName}`

  const prettyUsername = prettifyUsername(user?.username)
  return prettyUsername || fallback
}
</script>

<template>
  <div class="animate-fade-in-up pt-2 sm:pt-3">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-all duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" :size="18" />
            <InputText 
              v-model="globalFilter" 
              placeholder="Buscar folio, equipo, falla..." 
              class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" 
            />
          </div>
          <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
          <Select v-model="priorityFilter" :options="priorityOptions" optionLabel="label" optionValue="value" placeholder="Prioridad" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <div class="flex gap-2 w-full md:w-auto justify-end">
          <button
            @click="createTicket"
            class="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
          >
            <Plus :size="16" />
            Nuevo Ticket
          </button>
           <div class="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
              <span class="text-xs font-bold text-primary uppercase tracking-wide">{{ filteredTickets.length }} Pendientes</span>
           </div>
        </div>
      </div>

      <!-- DATATABLE -->
      <DataTable 
        :data="filteredTickets" 
        :columns="columns" 
        :loading="loading" 
        :rows="10"
        row-key="id"
      >
        
        <!-- Empty State -->
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Search class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron tickets</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros de búsqueda.</p>
          </div>
        </template>

        <!-- ID -->
        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <!-- Equipo -->
        <template #equipo_display="{ data }">
          <div>
            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.equipo_marca }}</div>
            <span class="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{{ data.equipo_modelo }}</span>
          </div>
        </template>

        <!-- Falla -->
        <template #tipo_falla="{ data }">
          <span class="text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wide italic">{{ data.tipo_falla }}</span>
        </template>

        <!-- Reportó -->
        <template #reporta_nombre="{ data }">
          <span class="text-gray-700 dark:text-gray-200 text-xs font-semibold">{{ data.reporta_nombre }}</span>
        </template>

        <!-- Asignado -->
        <template #tecnico_asignado="{ data }">
          <span class="text-gray-700 dark:text-gray-200 text-xs font-semibold">{{ data.tecnico_asignado }}</span>
        </template>

        <!-- Prioridad -->
        <template #prioridad="{ data }">
          <Tag :value="data.prioridad" :severity="getPrioritySeverity(data.prioridad)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
        </template>

        <!-- Estatus -->
        <template #estatus="{ data }">
          <Tag :value="formatStatus(data.estatus)" :severity="getSeverity(data.estatus)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
        </template>

        <!-- Fecha -->
        <template #fecha_creacion="{ data }">
          <span class="text-gray-600 dark:text-gray-300 text-sm font-medium">{{ new Date(data.fecha_creacion).toLocaleDateString() }}</span>
        </template>

        <!-- ACCIONES -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-center">
            <button
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all"
              @click="markAsResolved(data)"
              title="Marcar como resuelto"
              v-if="isAdmin"
            >
              <Check :size="16" />
            </button>
            <button
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all"
              @click="viewDetail(data)"
              title="Ver detalles"
            >
              <Eye :size="16" />
            </button>
            <button
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all"
              @click="confirmDeleteTicket(data)"
              title="Eliminar"
              v-if="isAdmin"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </template>
      </DataTable>

      <div v-if="isAnalyst" class="mt-4 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3">
        Modo Analista: puedes atender tickets asignados (actualizar estatus y comentar en detalle). No puedes crear, eliminar, cambiar prioridad ni reasignar.
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>