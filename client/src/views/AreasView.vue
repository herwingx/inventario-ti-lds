<script setup>
/**
 * @fileoverview Vista de listado de Áreas.
 * Muestra una tabla con todas las áreas administrativas y permite filtrar, crear, editar o eliminar.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AreasService from '../services/AreasService'
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
const areas = ref([])
const loading = ref(true)

// Configuración de Filtros
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS },
  nombre_empresa: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Opciones para el filtro de Estado
const statuses = ref([
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' }
]);

// Cargar datos
const loadAreas = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    areas.value = await AreasService.getAll()
  } catch (error) {
    console.error('Error al cargar áreas:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las áreas', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAreas()
})

// Helpers UI
const router = useRouter()

const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('ACTIVO')) return 'success'
  if (s.includes('INACTIVO')) return 'danger'
  return 'secondary'
}

const openNew = () => {
    router.push({ name: 'areas-nuevo' })
}

const viewArea = (area) => {
    router.push({ name: 'areas-detalle', params: { id: area.id } })
}

const editArea = (area) => {
    router.push({ name: 'areas-editar', params: { id: area.id } })
}

const confirm = useConfirm()

// Lógica de Eliminación
const confirmDeleteArea = (area) => {
    confirm.require({
        message: `¿Estás seguro de que deseas eliminar permanentemente el área "${area.nombre}"? Esta acción no se puede deshacer.`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar Área',
        rejectClass: 'btn-secondary',
        acceptClass: 'btn-danger ml-2',
        accept: async () => {
            try {
                await AreasService.delete(area.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: `Área ${area.nombre} eliminada correctamente`, life: 3000 })
                loadAreas()
            } catch (error) {
                console.error('Error al eliminar área:', error)
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el área', life: 3000 })
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
            <!-- Search Input (Primary) -->
            <div class="relative w-full sm:w-72">
                 <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                 <InputText v-model="filters['global'].value" placeholder="Buscar área, empresa..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <!-- Filter by Status -->
            <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <!-- Right: New Area Button -->
        <button class="btn-primary w-full md:w-auto" @click="openNew">
            <Plus :size="18" />
            <span>Nueva Área</span>
        </button>
      </div>

      <!-- DATATABLE -->
      <DataTable 
        :value="loading ? skeletonRows : areas" 
        :paginator="true" 
        :rows="10" 
        dataKey="id" 
        :filters="filters" 
        :loading="false" 
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}-{last} de {totalRecords}"
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['nombre', 'nombre_empresa']"
      >
        <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Search class="text-gray-400 dark:text-gray-500" :size="40" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
                <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros de búsqueda o agrega una nueva área.</p>
                <Button label="Limpiar Filtros" text class="mt-4 !text-primary" @click="filters['global'].value = null; filters['status_nombre'].value = null" />
            </div>
        </template>

        <!-- ID Column -->
        <Column field="id" header="ID" sortable style="width: 8%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
            </template>
        </Column>

        <!-- Name Column -->
        <Column field="nombre" header="Nombre del Área" sortable style="width: 35%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="text-gray-900 dark:text-white font-bold text-base">{{ data.nombre }}</div>
            </template>
        </Column>

        <!-- Company Column -->
        <Column field="nombre_empresa" header="Empresa" sortable style="width: 30%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="8rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-800 dark:text-gray-200 text-sm font-bold bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">{{ data.nombre_empresa }}</span>
            </template>
        </Column>

        <!-- Status Column -->
        <Column field="status_nombre" header="Estado" sortable style="width: 12%">
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
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewArea(data)" title="Ver detalles">
                        <Eye :size="16" />
                    </button>
                    <!-- Edit Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editArea(data)" title="Editar">
                        <Pencil :size="16" />
                    </button>
                    <!-- Delete Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteArea(data)" title="Eliminar">
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
