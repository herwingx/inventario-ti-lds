<script setup>
/**
 * @fileoverview Vista de control de Direcciones IP.
 * Gestiona el inventario de IPs, permitiendo filtrar por segmento, estado y disponibilidad.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import DireccionesIpService from '../services/DireccionesIpService'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

// Data
const direccionesIp = ref([])
const loading = ref(true)
const globalFilter = ref('')
const statusFilter = ref(null)
const selectedSegmento = ref(null)

// Opciones para filtros
const statuses = ref([
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Asignado', value: 'ASIGNADO' },
  { label: 'Reservado', value: 'RESERVADO' }
])

// Segmentos de red (0-15)
const segmentos = ref([
  { label: 'Todos', value: null },
  { label: '0 - Infraestructura y TI', value: 0 },
  { label: '1 - Dirección General TMT', value: 1 },
  { label: '2 - Contabilidad TMT', value: 2 },
  { label: '3 - Operaciones TMT', value: 3 },
  { label: '4 - Almacén TMT', value: 4 },
  { label: '5 - Mesa de Control TMT', value: 5 },
  { label: '6 - Recursos Humanos TMT', value: 6 },
  { label: '7 - Comercial Ventas/Cadenas', value: 7 },
  { label: '8 - Comercial TAE', value: 8 },
  { label: '9 - Comercial Tarifarios', value: 9 },
  { label: '10 - Comercial Publicidad', value: 10 },
  { label: '11 - Comercial Plataformas', value: 11 },
  { label: '12 - Atención y Desarrollo', value: 12 },
  { label: '13 - Invitados y Móviles', value: 13 },
  { label: '14 - Corporativo Lidifon', value: 14 },
  { label: '15 - Reservado Expansión', value: 15 }
])

// Columnas
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '6%' },
  { field: 'direccion_ip', header: 'Dirección IP', sortable: true, width: '18%' },
  { field: 'nombre_sucursal', header: 'Sucursal/Empresa', sortable: true, width: '25%' },
  { field: 'comentario', header: 'Comentario', sortable: true, width: '25%' },
  { field: 'status_nombre', header: 'Estado', sortable: true, width: '11%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '15%', align: 'right' }
]

const filteredDireccionesIp = computed(() => {
  let result = direccionesIp.value

  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(ip =>
      ip.direccion_ip?.toLowerCase().includes(search) ||
      ip.nombre_sucursal?.toLowerCase().includes(search) ||
      ip.nombre_empresa?.toLowerCase().includes(search) ||
      ip.comentario?.toLowerCase().includes(search)
    )
  }

  if (statusFilter.value) {
    result = result.filter(ip => ip.status_nombre?.toUpperCase() === statusFilter.value)
  }

  return result
})

const loadDireccionesIp = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    const params = {}
    if (selectedSegmento.value !== null) {
      params.segmento = selectedSegmento.value
    }
    direccionesIp.value = await DireccionesIpService.getAll(params)
  } catch (error) {
    console.error('Error al cargar direcciones IP:', error)
    toastError('No se pudieron cargar las direcciones IP')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDireccionesIp()
})

watch(selectedSegmento, () => {
  loadDireccionesIp()
})

// Usando función centralizada getStatusSeverity desde utils/status.js
const getSeverity = getStatusSeverity

const openNew = () => {
  router.push({ name: 'direcciones-ip-nuevo' })
}

const viewDireccionIp = (ip) => {
  router.push({ name: 'direcciones-ip-detalle', params: { id: ip.id } })
}

const editDireccionIp = (ip) => {
  router.push({ name: 'direcciones-ip-editar', params: { id: ip.id } })
}

const confirmDeleteDireccionIp = async (ip) => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: `¿Estás seguro de que deseas eliminar permanentemente la IP "${ip.direccion_ip}"? Esta acción no se puede deshacer.`,
    confirmButtonText: 'Eliminar IP',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await DireccionesIpService.delete(ip.id)
      toastSuccess(`IP ${ip.direccion_ip} eliminada correctamente`)
      loadDireccionesIp()
    } catch (error) {
      console.error('Error al eliminar IP:', error)
      toastError('No se pudo eliminar la dirección IP')
    }
  } else {
    toastInfo('Operación cancelada')
  }
}

const clearFilters = () => {
  globalFilter.value = ''
  statusFilter.value = null
  selectedSegmento.value = null
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="globalFilter" placeholder="Buscar IP, sucursal..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <Select v-model="selectedSegmento" :options="segmentos" optionLabel="label" optionValue="value" placeholder="Segmento" showClear class="w-full sm:w-56 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />

          <Select v-model="statusFilter" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nueva IP</span>
        </button>
      </div>

      <!-- DataTable Nativo -->
      <DataTable 
        :data="filteredDireccionesIp"
        :columns="columns"
        :loading="loading"
        :rows="15"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Search class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros o agrega una nueva dirección IP.</p>
            <button class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <template #skeleton-id>
          <div class="skeleton h-4 w-8"></div>
        </template>

        <template #direccion_ip="{ data }">
          <div class="text-gray-900 dark:text-white font-mono text-base font-bold">{{ data.direccion_ip }}</div>
        </template>

        <template #skeleton-direccion_ip>
          <div class="skeleton h-4 w-28"></div>
        </template>

        <template #nombre_sucursal="{ data }">
          <div class="flex flex-col">
            <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.nombre_sucursal || 'Sin sucursal' }}</span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5">{{ data.nombre_empresa || 'N/A' }}</span>
          </div>
        </template>

        <template #skeleton-nombre_sucursal>
          <div class="space-y-1">
            <div class="skeleton h-4 w-32"></div>
            <div class="skeleton h-3 w-20"></div>
          </div>
        </template>

        <template #comentario="{ data }">
          <span class="text-gray-700 dark:text-gray-300 text-sm">{{ data.comentario || '-' }}</span>
        </template>

        <template #skeleton-comentario>
          <div class="skeleton h-4 w-40"></div>
        </template>

        <template #status_nombre="{ data }">
          <Tag :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-20 rounded-md"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewDireccionIp(data)" title="Ver detalles">
              <Eye :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editDireccionIp(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteDireccionIp(data)" title="Eliminar">
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
