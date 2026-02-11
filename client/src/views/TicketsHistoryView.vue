<script setup>
/**
 * @fileoverview Historial de Soporte Técnico.
 * Sincronizada 100% con el estándar visual de EquiposView.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import TicketsService from '../services/TicketsService'
import { useSwal } from '../composables/useSwal'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { Search, Eye, History, Trash2 } from 'lucide-vue-next'

// PrimeVue
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const router = useRouter()
const { error: toastError, success: toastSuccess, confirmDelete } = useSwal()

// Data
const tickets = ref([])
const loading = ref(true)

// Filtros
const globalFilter = ref('')
const statusFilter = ref(null)

const statusOptions = [
  { label: 'Resuelto', value: 'RESUELTO' },
  { label: 'Cerrado', value: 'CERRADO' }
]

const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'equipo_display', header: 'Equipo/Modelo', sortable: true, width: '30%' },
  { field: 'tipo_falla', header: 'Falla Original', sortable: true, width: '20%' },
  { field: 'fecha_creacion', header: 'Registro', sortable: true, width: '15%' },
  { field: 'estatus', header: 'Resultado', sortable: true, width: '15%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '15%', align: 'right' }
]

const filteredTickets = computed(() => {
  let result = tickets.value
  if (globalFilter.value) {
    const s = globalFilter.value.toLowerCase()
    result = result.filter(t => 
      t.equipo_marca?.toLowerCase().includes(s) ||
      t.equipo_modelo?.toLowerCase().includes(s) ||
      t.tipo_falla?.toLowerCase().includes(s) ||
      String(t.id).includes(s)
    )
  }
  if (statusFilter.value) result = result.filter(t => t.estatus === statusFilter.value)
  return result
})

const loadHistory = async () => {
  loading.value = true
  try {
    const all = await TicketsService.getAll()
    tickets.value = all.map(t => ({
      ...t,
      equipo_marca: t.equipos?.marca || 'N/A',
      equipo_modelo: t.equipos?.modelo || 'S/N',
      equipo_display: `${t.equipos?.marca || 'N/A'} ${t.equipos?.modelo || ''}`
    })).filter(t => {
      const s = (t.estatus || '').toUpperCase()
      return s === 'RESUELTO' || s === 'CERRADO'
    })
  } catch (error) {
    toastError('Error al cargar historial')
  } finally {
    loading.value = false
  }
}

const viewDetail = (ticket) => {
  router.push({ name: 'tickets-detalle', params: { id: ticket.id } })
}

const deleteTicket = async (ticket) => {
  const result = await confirmDelete({
    title: '¿Eliminar Ticket Histórico?',
    text: `Esta acción es irreversible. Se eliminará el folio #${ticket.id} y toda su evidencia.`,
    confirmButtonText: 'Eliminar definitivamente',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await TicketsService.delete(ticket.id)
      toastSuccess('Ticket eliminado del historial')
      loadHistory()
    } catch (e) {
      toastError('Error al eliminar registro')
    }
  }
}

onMounted(loadHistory)
const getSeverity = getStatusSeverity
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-all duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" :size="18" />
            <InputText 
              v-model="globalFilter" 
              placeholder="Buscar en el archivo histórico..." 
              class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" 
            />
          </div>
          <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Resultado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <div class="flex gap-2 w-full md:w-auto justify-end">
           <div class="bg-slate-50 dark:bg-dark-bg px-4 py-2 rounded-xl border border-light-border dark:border-dark-border flex items-center gap-2 opacity-60">
              <History class="text-slate-400" :size="16" />
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wide">{{ filteredTickets.length }} Archivados</span>
           </div>
        </div>
      </div>

      <!-- DATATABLE -->
      <DataTable :data="filteredTickets" :columns="columns" :loading="loading" row-key="id">
        
        <!-- ID -->
        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <!-- Equipo -->
        <template #equipo_display="{ data }">
          <div>
            <div class="text-gray-900 dark:text-white font-bold text-base leading-tight">{{ data.equipo_marca }}</div>
            <span class="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{{ data.equipo_modelo }}</span>
          </div>
        </template>

        <!-- Falla -->
        <template #tipo_falla="{ data }">
          <span class="text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wide italic">{{ data.tipo_falla }}</span>
        </template>

        <!-- Registro -->
        <template #fecha_creacion="{ data }">
          <span class="text-gray-600 dark:text-gray-300 text-sm font-medium">{{ new Date(data.fecha_creacion).toLocaleDateString() }}</span>
        </template>

        <!-- Resultado -->
        <template #estatus="{ data }">
          <Tag :value="data.estatus" :severity="getSeverity(data.estatus)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
        </template>

        <!-- Acciones -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-center">
            <button 
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" 
              @click="viewDetail(data)" 
              title="Ver historial completo"
            >
              <Eye :size="16" />
            </button>
            <button
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all"
              @click="deleteTicket(data)"
              title="Eliminar historial"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </template>

      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
