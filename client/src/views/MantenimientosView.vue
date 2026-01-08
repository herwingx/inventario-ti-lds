<script setup>
/**
 * @fileoverview Vista de historial de Mantenimientos.
 * Permite visualizar y gestionar los servicios de mantenimiento (preventivo/correctivo) de los equipos.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import MantenimientosService from '../services/MantenimientosService'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { Search, Plus, Pencil, Trash2, Wrench } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

// Data
const mantenimientos = ref([])
const loading = ref(true)
const globalFilter = ref('')
const statusFilter = ref(null)

// Opciones para el filtro de Estado
const statuses = ref([
  { label: 'En Proceso', value: 'EN PROCESO' },
  { label: 'Finalizado', value: 'FINALIZADO' },
  { label: 'Cancelado', value: 'CANCELADO' }
])

// Columnas
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'equipo_nombre', header: 'Equipo/Serie', sortable: true, width: '25%' },
  { field: 'fecha_inicio', header: 'Inicio', sortable: true, width: '15%' },
  { field: 'fecha_fin', header: 'Fin/Estado', sortable: true, width: '15%' },
  { field: 'proveedor', header: 'Proveedor', sortable: true, width: '15%' },
  { field: 'status_nombre', header: 'Status', sortable: true, width: '10%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '12%', align: 'right' }
]

const filteredMantenimientos = computed(() => {
  let result = mantenimientos.value

  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(m =>
      m.equipo_nombre?.toLowerCase().includes(search) ||
      m.equipo_numero_serie?.toLowerCase().includes(search) ||
      m.proveedor?.toLowerCase().includes(search) ||
      m.status_nombre?.toLowerCase().includes(search)
    )
  }

  if (statusFilter.value) {
    result = result.filter(m => m.status_nombre?.toUpperCase() === statusFilter.value)
  }

  return result
})

onMounted(async () => {
  loadMantenimientos()
})

const loadMantenimientos = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    mantenimientos.value = await MantenimientosService.getAll()
  } catch (error) {
    toastError('No se pudieron cargar los mantenimientos')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Usando función centralizada getStatusSeverity desde utils/status.js

const openNew = () => {
  router.push({ name: 'mantenimientos-nuevo' })
}

const editMantenimiento = (mantenimiento) => {
  router.push({ name: 'mantenimientos-editar', params: { id: mantenimiento.id } })
}

const deleteMantenimiento = async (mantenimiento) => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: '¿Estás seguro de eliminar este registro de mantenimiento?',
    confirmButtonText: 'Eliminar Registro',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await MantenimientosService.delete(mantenimiento.id)
      toastSuccess('Registro eliminado')
      loadMantenimientos()
    } catch (error) {
      toastError('No se pudo eliminar el registro')
    }
  } else {
    toastInfo('Operación cancelada')
  }
}

const clearFilters = () => {
  globalFilter.value = ''
  statusFilter.value = null
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="globalFilter" placeholder="Buscar..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <Select v-model="statusFilter" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Registrar Servicio</span>
        </button>
      </div>

      <!-- DataTable Nativo -->
      <DataTable 
        :data="filteredMantenimientos"
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Wrench class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Sin Registros</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay mantenimientos registrados aún.</p>
            <button v-if="globalFilter || statusFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <template #skeleton-id>
          <div class="skeleton h-4 w-8"></div>
        </template>

        <template #equipo_nombre="{ data }">
          <div>
            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.equipo_nombre }}</div>
            <span class="text-gray-500 dark:text-gray-400 text-xs font-medium font-mono">{{ data.equipo_numero_serie }}</span>
          </div>
        </template>

        <template #skeleton-equipo_nombre>
          <div class="space-y-1">
            <div class="skeleton h-4 w-32"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
        </template>

        <template #fecha_inicio="{ data }">
          <span class="text-gray-700 dark:text-gray-200 text-sm font-bold">{{ formatDate(data.fecha_inicio) }}</span>
        </template>

        <template #skeleton-fecha_inicio>
          <div class="skeleton h-4 w-20"></div>
        </template>

        <template #fecha_fin="{ data }">
          <span v-if="data.fecha_fin" class="text-gray-700 dark:text-gray-200 text-sm">{{ formatDate(data.fecha_fin) }}</span>
          <span v-else class="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded uppercase tracking-wider">En Proceso</span>
        </template>

        <template #skeleton-fecha_fin>
          <div class="skeleton h-4 w-20"></div>
        </template>

        <template #proveedor="{ data }">
          <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.proveedor || 'Interno' }}</span>
        </template>

        <template #skeleton-proveedor>
          <div class="skeleton h-4 w-24"></div>
        </template>

        <template #status_nombre="{ data }">
          <Tag :value="data.status_nombre" :severity="getStatusSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-20 rounded-md"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editMantenimiento(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="deleteMantenimiento(data)" title="Eliminar">
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
