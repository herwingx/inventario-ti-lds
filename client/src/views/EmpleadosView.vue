<script setup>
/**
 * @fileoverview Vista del directorio de Empleados.
 * Muestra el listado de personal, sus puestos y ubicaciones, con opciones de gestión.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EmpleadosService from '../services/EmpleadosService'

// Componentes PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'

const toast = useToast()
const empleados = ref([])
const loading = ref(true)

// Configuración de Filtros
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS },
  nombre_area: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Opciones para el filtro de Estado
const statuses = ref([
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' },
    { label: 'Suspendido', value: 'SUSPENDIDO' },
    { label: 'Baja', value: 'BAJA' }
]);

// Cargar datos
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

// Helpers UI
const router = useRouter()

const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('ACTIVO')) return 'success'
  if (s.includes('INACTIVO')) return 'warn'
  if (s.includes('SUSPENDIDO')) return 'contrast'
  if (s.includes('BAJA')) return 'danger'
  return 'secondary'
}

const openNew = () => {
    router.push({ name: 'empleados-nuevo' })
}

const viewEmpleado = (empleado) => {
    router.push({ name: 'empleados-detalle', params: { id: empleado.id } })
}

const editEmpleado = (empleado) => {
    router.push({ name: 'empleados-editar', params: { id: empleado.id } })
}

const confirm = useConfirm()

// Lógica de Eliminación
const confirmDeleteEmpleado = (empleado) => {
    const nombreCompleto = `${empleado.nombres} ${empleado.apellidos}`
    confirm.require({
        message: `¿Estás seguro de que deseas eliminar permanentemente a ${nombreCompleto}? Esta acción no se puede deshacer.`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar Empleado',
        rejectClass: 'p-button-secondary p-button-text',
        acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600 !px-6',
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
                 <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
                 <InputText v-model="filters['global'].value" placeholder="Buscar nombre, email, puesto..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <!-- Filter by Status -->
            <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <!-- Right: New Employee Button -->
        <Button label="Nuevo Empleado" icon="pi pi-plus" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-6 !py-2.5 !rounded-lg !text-white !text-sm shadow-lg shadow-emerald-900/20 w-full md:w-auto" @click="openNew" />
      </div>

      <!-- DATATABLE -->
      <DataTable 
        :value="loading ? skeletonRows : empleados" 
        :paginator="true" 
        :rows="10" 
        dataKey="id" 
        :filters="filters" 
        :loading="false" 
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}-{last} de {totalRecords}"
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['nombres', 'apellidos', 'numero_empleado', 'email_personal', 'puesto', 'nombre_area']"
      >
        <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                    <i class="pi pi-search text-4xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
                <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros de búsqueda o agrega un nuevo empleado.</p>
                <Button label="Limpiar Filtros" text class="mt-4 !text-primary" @click="filters['global'].value = null; filters['status_nombre'].value = null" />
            </div>
        </template>

        <!-- ID Column -->
        <Column field="id" header="ID" sortable style="width: 5%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
            </template>
        </Column>

        <!-- Employee Number Column -->
        <Column field="numero_empleado" header="No. Empleado" sortable style="width: 10%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="5rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-900 dark:text-white font-mono text-base font-bold">{{ data.numero_empleado || 'N/A' }}</span>
            </template>
        </Column>

        <!-- Name Column -->
        <Column field="nombres" header="Nombre Completo" sortable style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else>
                    <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.nombres }} {{ data.apellidos }}</div>
                     <span class="text-gray-500 dark:text-gray-400 text-xs font-medium">{{ data.email_personal || 'Sin email' }}</span>
                </div>
            </template>
        </Column>

        <!-- Company/Area Column -->
        <Column field="nombre_empresa" header="Empresa/Área" sortable style="width: 20%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="8rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="flex flex-col">
                    <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.nombre_empresa || 'N/A' }}</span>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5">{{ data.nombre_area || 'Sin área' }}</span>
                </div>
            </template>
        </Column>

        <!-- Position Column -->
        <Column field="puesto" header="Puesto" sortable style="width: 15%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-800 dark:text-gray-200 text-sm font-bold bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">{{ data.puesto || 'N/A' }}</span>
            </template>
        </Column>

        <!-- Status Column -->
        <Column field="status_nombre" header="Estado" sortable style="width: 10%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="5rem" height="1.5rem" borderRadius="4px" class="!bg-gray-200 dark:!bg-dark-border" />
                <Tag v-else :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
            </template>
        </Column>

        <!-- Actions Column -->
        <Column header="Acciones" style="width: 12%; text-align: right">
            <template #body="{ data }">
                <div v-if="loading" class="flex gap-2 justify-start">
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                </div>
                <div v-else class="flex gap-1 justify-start">
                    <!-- View Button -->
                    <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all border border-gray-200 dark:border-transparent hover:border-blue-500" @click="viewEmpleado(data)" title="Ver detalles">
                        <i class="pi pi-eye text-xs"></i>
                    </button>
                    <!-- Edit Button -->
                    <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-border text-primary flex items-center justify-center transition-all border border-gray-200 dark:border-transparent" @click="editEmpleado(data)" title="Editar">
                        <i class="pi pi-pencil text-xs"></i>
                    </button>
                    <!-- Delete Button -->
                    <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center transition-all border border-gray-200 dark:border-transparent hover:border-red-500" @click="confirmDeleteEmpleado(data)" title="Eliminar">
                        <i class="pi pi-trash text-xs"></i>
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
