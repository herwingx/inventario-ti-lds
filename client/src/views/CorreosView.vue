<script setup>
/**
 * @fileoverview Vista de administración de Cuentas de Correo.
 * Muestra el inventario de correos corporativos y su estado actual.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import CorreosService from '../services/CorreosService'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { Search, Plus, Eye, Pencil, Trash2, Mail } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()

// Data
const correos = ref([])
const loading = ref(true)
const globalFilter = ref('')
const statusFilter = ref(null)

const statuses = ref([
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Inactivo', value: 'INACTIVO' },
  { label: 'Suspendido', value: 'SUSPENDIDO' }
])

// Columnas
const columns = [
  { field: 'email', header: 'Email Corporativo', sortable: true, width: '25%' },
  { field: 'nombre_empleado', header: 'Asignado A', sortable: true, width: '25%' },
  { field: 'status_nombre', header: 'Estado', sortable: true, width: '15%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '15%', align: 'right' }
]

const filteredCorreos = computed(() => {
  let result = correos.value

  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(c =>
      c.email?.toLowerCase().includes(search) ||
      c.usuario_email?.toLowerCase().includes(search) ||
      c.nombre_empleado?.toLowerCase().includes(search) ||
      c.apellido_empleado?.toLowerCase().includes(search)
    )
  }

  if (statusFilter.value) {
    result = result.filter(c => c.status_nombre?.toUpperCase() === statusFilter.value)
  }

  return result
})

const loadCorreos = async () => {
  loading.value = true
  try {
    correos.value = await CorreosService.getAll()
  } catch (error) {
    console.error('Error al cargar correos:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas de correo', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCorreos()
})

const openNew = () => {
  router.push({ name: 'correos-nuevo' })
}

const viewCorreo = (data) => {
  router.push({ name: 'correos-detalle', params: { id: data.id } })
}

const editCorreo = (data) => {
  router.push({ name: 'correos-editar', params: { id: data.id } })
}

const confirmDeleteCorreo = (data) => {
  confirm.require({
    message: `¿Estás seguro de que deseas eliminar la cuenta "${data.email}"? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar Cuenta',
    rejectClass: 'btn-secondary',
    acceptClass: 'btn-danger ml-2',
    accept: async () => {
      try {
        await CorreosService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: `Cuenta ${data.email} eliminada correctamente`, life: 3000 })
        loadCorreos()
      } catch (error) {
        console.error('Error al eliminar:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la cuenta', life: 3000 })
      }
    }
  })
}

// Usando función centralizada getStatusSeverity desde utils/status.js
const getSeverity = getStatusSeverity

const clearFilters = () => {
  globalFilter.value = ''
  statusFilter.value = null
}
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="globalFilter" placeholder="Buscar email, usuario..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <Select v-model="statusFilter" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      <DataTable 
        :data="filteredCorreos" 
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Mail class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron cuentas</h3>
            <button v-if="globalFilter || statusFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #email="{ data }">
          <div class="flex items-center gap-1.5" :title="data.email">
            <span class="text-gray-900 dark:text-gray-100 font-bold text-sm">{{ data.email.split('@')[0] }}</span>
            <span class="text-gray-400 dark:text-gray-500 font-normal text-sm">@{{ data.email.split('@')[1] }}</span>
          </div>
        </template>

        <template #skeleton-email>
          <div class="space-y-1">
            <div class="skeleton h-4 w-40"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
        </template>

        <template #nombre_empleado="{ data }">
          <div v-if="data.nombre_empleado" class="flex flex-col justify-center h-full">
             <span class="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
               {{ data.nombre_empleado }} {{ data.apellido_empleado }}
             </span>
          </div>
          <div v-else class="flex items-center h-full">
             <span class="text-gray-400 dark:text-gray-500 text-sm italic">Sin asignar</span>
          </div>
        </template>

        <template #skeleton-nombre_empleado>
          <div class="skeleton h-4 w-28"></div>
        </template>

        <template #status_nombre="{ data }">
          <Tag :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5" />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-16 rounded-md"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewCorreo(data)" title="Ver Detalle">
              <Eye :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editCorreo(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteCorreo(data)" title="Eliminar">
              <Trash2 :size="16" />
            </button>
          </div>
        </template>

        <template #skeleton-actions>
          <div class="flex gap-2 justify-end">
            <div class="skeleton w-8 h-8 rounded-lg"></div>
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
