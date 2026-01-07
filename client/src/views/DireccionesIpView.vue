<script setup>
/**
 * @fileoverview Vista de control de Direcciones IP.
 * Gestiona el inventario de IPs, permitiendo filtrar por segmento, estado y disponibilidad.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DireccionesIpService from '../services/DireccionesIpService'
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-vue-next'

// Componentes PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'

const toast = useToast()
const direccionesIp = ref([])
const loading = ref(true)

// Configuración de Filtros
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Filtro de segmento (separado porque no es parte de los filtros de DataTable)
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

// Cargar datos
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
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las direcciones IP', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDireccionesIp()
})

// Watch para recargar cuando cambia el segmento
import { watch } from 'vue'
watch(selectedSegmento, () => {
  loadDireccionesIp()
})

// Helpers UI
const router = useRouter()

const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('DISPONIBLE')) return 'success'
  if (s.includes('ASIGNADO')) return 'warn'
  if (s.includes('RESERVADO')) return 'contrast'
  return 'secondary'
}

const openNew = () => {
    router.push({ name: 'direcciones-ip-nuevo' })
}

const viewDireccionIp = (ip) => {
    router.push({ name: 'direcciones-ip-detalle', params: { id: ip.id } })
}

const editDireccionIp = (ip) => {
    router.push({ name: 'direcciones-ip-editar', params: { id: ip.id } })
}

const confirm = useConfirm()

// Lógica de Eliminación
const confirmDeleteDireccionIp = (ip) => {
    confirm.require({
        message: `¿Estás seguro de que deseas eliminar permanentemente la IP "${ip.direccion_ip}"? Esta acción no se puede deshacer.`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar IP',
        rejectClass: 'btn-secondary',
        acceptClass: 'btn-danger ml-2',
        accept: async () => {
            try {
                await DireccionesIpService.delete(ip.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: `IP ${ip.direccion_ip} eliminada correctamente`, life: 3000 })
                loadDireccionesIp()
            } catch (error) {
                console.error('Error al eliminar IP:', error)
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la dirección IP', life: 3000 })
            }
        }
    })
}

const skeletonRows = new Array(5).fill({})
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar: Filters, Search & Actions -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <!-- Left: Search & Filters -->
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <!-- Search Input -->
            <div class="relative w-full sm:w-64">
                 <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                 <InputText v-model="filters['global'].value" placeholder="Buscar IP, sucursal..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <!-- Filter by Segmento -->
            <Select v-model="selectedSegmento" :options="segmentos" optionLabel="label" optionValue="value" placeholder="Segmento" showClear class="w-full sm:w-56 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />

            <!-- Filter by Status -->
            <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <!-- Right: New IP Button -->
        <button class="btn-primary w-full md:w-auto" @click="openNew">
            <Plus :size="18" />
            <span>Nueva IP</span>
        </button>
      </div>

      <!-- DATATABLE -->
      <DataTable 
        :value="loading ? skeletonRows : direccionesIp" 
        :paginator="true" 
        :rows="15" 
        dataKey="id" 
        :filters="filters" 
        :loading="false" 
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}-{last} de {totalRecords}"
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['direccion_ip', 'nombre_sucursal', 'nombre_empresa', 'comentario']"
      >
        <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Search class="text-gray-400 dark:text-gray-500" :size="40" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
                <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros o agrega una nueva dirección IP.</p>
                <Button label="Limpiar Filtros" text class="mt-4 !text-primary" @click="filters['global'].value = null; filters['status_nombre'].value = null; selectedSegmento = null" />
            </div>
        </template>

        <!-- ID Column -->
        <Column field="id" header="ID" sortable style="width: 6%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
            </template>
        </Column>

        <!-- IP Address Column -->
        <Column field="direccion_ip" header="Dirección IP" sortable style="width: 18%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="8rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="text-gray-900 dark:text-white font-mono text-base font-bold">{{ data.direccion_ip }}</div>
            </template>
        </Column>

        <!-- Branch/Company Column -->
        <Column field="nombre_sucursal" header="Sucursal/Empresa" sortable style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="flex flex-col">
                    <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.nombre_sucursal || 'Sin sucursal' }}</span>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5">{{ data.nombre_empresa || 'N/A' }}</span>
                </div>
            </template>
        </Column>

        <!-- Comment Column -->
        <Column field="comentario" header="Comentario" sortable style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="12rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-700 dark:text-gray-300 text-sm">{{ data.comentario || '-' }}</span>
            </template>
        </Column>

        <!-- Status Column -->
        <Column field="status_nombre" header="Estado" sortable style="width: 11%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="5rem" height="1.5rem" borderRadius="4px" class="!bg-gray-200 dark:!bg-dark-border" />
                <Tag v-else :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
            </template>
        </Column>

        <!-- Actions Column -->
        <Column header="Acciones" style="width: 15%; text-align: right">
            <template #body="{ data }">
                <div v-if="loading" class="flex gap-2 justify-start">
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                </div>
                <div v-else class="flex gap-1 justify-end">
                    <!-- View Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewDireccionIp(data)" title="Ver detalles">
                        <Eye :size="16" />
                    </button>
                    <!-- Edit Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editDireccionIp(data)" title="Editar">
                        <Pencil :size="16" />
                    </button>
                    <!-- Delete Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteDireccionIp(data)" title="Eliminar">
                        <Trash2 :size="16" />
                    </button>
                </div>
            </template>
        </Column>

      </DataTable>
    </div>
  </div>
</template>

<style scoped>
/* Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
