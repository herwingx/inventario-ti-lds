<script setup>
/**
 * @fileoverview Vista del directorio de Empleados.
 * Muestra el listado de personal, sus puestos y ubicaciones, con opciones de gestión.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EmpleadosService from '../services/EmpleadosService'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const toast = useToast()
const router = useRouter()
const confirm = useConfirm()

// Data
const empleados = ref([])
const loading = ref(true)

// Filtros
const globalFilter = ref('')
const statusFilter = ref(null)

// Opciones para el filtro de Estado
const statuses = ref([
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Inactivo', value: 'INACTIVO' },
  { label: 'Suspendido', value: 'SUSPENDIDO' },
  { label: 'Baja', value: 'BAJA' }
])

// Columnas
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'numero_empleado', header: 'No. Empleado', sortable: true, width: '8%' },
  { field: 'nombres', header: 'Nombre Completo', sortable: true, width: '22%' },
  { field: 'email_corporativo', header: 'Email Corp.', sortable: true, width: '20%' },
  { field: 'nombre_empresa', header: 'Empresa/Área', sortable: true, width: '15%' },
  { field: 'puesto', header: 'Puesto', sortable: true, width: '15%' },
  { field: 'status_nombre', header: 'Estado', sortable: true, width: '5%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '10%', align: 'right' }
]

const filteredEmpleados = computed(() => {
  let result = empleados.value

  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(e => 
      e.nombres?.toLowerCase().includes(search) ||
      e.apellidos?.toLowerCase().includes(search) ||
      e.numero_empleado?.toLowerCase().includes(search) ||
      e.email_personal?.toLowerCase().includes(search) ||
      e.puesto?.toLowerCase().includes(search) ||
      e.nombre_area?.toLowerCase().includes(search)
    )
  }

  if (statusFilter.value) {
    result = result.filter(e => e.status_nombre?.toUpperCase() === statusFilter.value)
  }

  return result
})

const loadEmpleados = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    empleados.value = await EmpleadosService.getAll()
  } catch (error) {
    console.error('Error al cargar empleados:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los empleados', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEmpleados()
})

// Usando función centralizada getStatusSeverity desde utils/status.js
const getSeverity = getStatusSeverity

const openNew = () => {
  router.push({ name: 'empleados-nuevo' })
}

const viewEmpleado = (empleado) => {
  router.push({ name: 'empleados-detalle', params: { id: empleado.id } })
}

const editEmpleado = (empleado) => {
  router.push({ name: 'empleados-editar', params: { id: empleado.id } })
}

const confirmDeleteEmpleado = (empleado) => {
  const nombreCompleto = `${empleado.nombres} ${empleado.apellidos}`
  confirm.require({
    message: `¿Estás seguro de que deseas eliminar permanentemente a ${nombreCompleto}? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar Empleado',
    rejectClass: 'btn-secondary',
    acceptClass: 'btn-danger ml-2',
    accept: async () => {
      try {
        await EmpleadosService.delete(empleado.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: `Empleado ${nombreCompleto} eliminado correctamente`, life: 3000 })
        loadEmpleados()
      } catch (error) {
        console.error('Error al eliminar empleado:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el empleado', life: 3000 })
      }
    }
  })
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
            <InputText v-model="globalFilter" placeholder="Buscar nombre, email, puesto..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <Select v-model="statusFilter" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      <!-- DATATABLE NATIVO -->
      <DataTable 
        :data="filteredEmpleados" 
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Search class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros de búsqueda o agrega un nuevo empleado.</p>
            <button class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <template #skeleton-id>
          <div class="skeleton h-4 w-8"></div>
        </template>

        <template #numero_empleado="{ data }">
          <span class="text-gray-900 dark:text-white font-mono text-base font-bold">{{ data.numero_empleado || 'N/A' }}</span>
        </template>

        <template #skeleton-numero_empleado>
          <div class="skeleton h-4 w-16"></div>
        </template>

        <template #nombres="{ data }">
          <div>
            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.nombres }} {{ data.apellidos }}</div>
            <span class="text-gray-500 dark:text-gray-400 text-xs font-medium">{{ data.email_personal || 'Sin email' }}</span>
          </div>
        </template>

        <template #skeleton-nombres>
          <div class="space-y-1">
            <div class="skeleton h-4 w-32"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
        </template>

        <template #email_corporativo="{ data }">
          <span v-if="data.email_corporativo" class="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1.5 truncate max-w-[200px]" :title="data.email_corporativo">
            {{ data.email_corporativo }}
          </span>
          <span v-else class="text-gray-400 dark:text-gray-600 text-xs italic">No asignado</span>
        </template>

        <template #skeleton-email_corporativo>
          <div class="skeleton h-4 w-32"></div>
        </template>

        <template #nombre_empresa="{ data }">
          <div class="flex flex-col">
            <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.nombre_empresa || 'N/A' }}</span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5">{{ data.nombre_area || 'Sin área' }}</span>
          </div>
        </template>

        <template #skeleton-nombre_empresa>
          <div class="space-y-1">
            <div class="skeleton h-4 w-24"></div>
            <div class="skeleton h-3 w-16"></div>
          </div>
        </template>

        <template #puesto="{ data }">
          <span class="text-gray-800 dark:text-gray-200 text-sm font-bold bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">{{ data.puesto || 'N/A' }}</span>
        </template>

        <template #skeleton-puesto>
          <div class="skeleton h-6 w-20 rounded-md"></div>
        </template>

        <template #status_nombre="{ data }">
          <Tag :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-16 rounded-md"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewEmpleado(data)" title="Ver detalles">
              <Eye :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editEmpleado(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteEmpleado(data)" title="Eliminar">
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
