<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AsignacionesService from '../services/AsignacionesService'

// Componentes PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()

const asignaciones = ref([])
const loading = ref(true)

// Filtros
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS },
  activa: { value: null, matchMode: FilterMatchMode.EQUALS }
})

const viewMode = ref('active') // 'active' | 'history' | 'all'

const loadAsignaciones = async () => {
    loading.value = true
    try {
        let params = {}
        if (viewMode.value === 'active') params.activa = 'true'
        else if (viewMode.value === 'history') params.activa = 'false'
        
        const payload = await AsignacionesService.getAll(params)
        // Filter out component assignments (sub-assignments) to show only main equipment
        asignaciones.value = payload.filter(a => !a.id_equipo_padre)
    } catch (error) {
        console.error('Error al cargar asignaciones:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las asignaciones', life: 3000 })
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    if (route.query.view === 'history') {
        viewMode.value = 'history'
    }
    loadAsignaciones()
})

// Watch route changes
watch(() => route.query.view, (newVal) => {
    if (newVal === 'history') viewMode.value = 'history'
    else if (newVal === 'active' || !newVal) viewMode.value = 'active'
})

// Watch viewMode change
watch(viewMode, () => {
    loadAsignaciones()
})

const openNew = () => {
    router.push({ name: 'asignaciones-nuevo' })
}

const viewAsignacion = (data) => {
    router.push({ name: 'asignaciones-detalle', params: { id: data.id } })
}

const finalizarAsignacion = (data) => {
    confirm.require({
        message: `¿Desea finalizar la asignación del equipo ${data.equipo_nombre}?`,
        header: 'Finalizar Asignación',
        icon: 'pi pi-check-square',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Finalizar',
        rejectClass: 'p-button-secondary p-button-text',
        acceptClass: 'p-button-warning !bg-orange-500 !border-none hover:!bg-orange-600',
        accept: async () => {
            try {
                await AsignacionesService.finalizar(data.id)
                toast.add({ severity: 'success', summary: 'Finalizado', detail: 'Asignación finalizada correctamente', life: 3000 })
                loadAsignaciones()
            } catch (error) {
                console.error('Error al finalizar:', error)
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo finalizar la asignación', life: 3000 })
            }
        }
    })
}

// Helpers
const getSeverity = (status) => {
    if (!status) return 'secondary'
    const s = status.toUpperCase()
    if (s.includes('ACTIVA')) return 'success'
    if (s.includes('FINALIZADA')) return 'info'
    if (s.includes('CANCELADA')) return 'danger'
    return 'secondary'
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    // backend sends YYYY-MM-DDTHH:mm:ss.sssZ usually, or just string
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

const getAsignadoA = (data) => {
    if (data.id_empleado) return `${data.empleado_nombres} ${data.empleado_apellidos}`
    if (data.id_sucursal_asignado) return data.sucursal_asignada_nombre
    if (data.id_area_asignado) return data.area_asignada_nombre
    return 'N/A'
}

const getTipoAsignacion = (data) => {
    if (data.id_empleado) return { label: 'Empleado', icon: 'pi-user', color: 'text-blue-500 bg-blue-50' }
    if (data.id_sucursal_asignado) return { label: 'Sucursal', icon: 'pi-building', color: 'text-orange-500 bg-orange-50' }
    if (data.id_area_asignado) return { label: 'Área', icon: 'pi-briefcase', color: 'text-purple-500 bg-purple-50' }
    return { label: 'Desconocido', icon: 'pi-question', color: 'text-gray-500' }
}

const skeletonRows = new Array(5).fill({})
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <!-- Search -->
            <div class="relative w-full sm:w-64">
                 <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
                 <InputText v-model="filters['global'].value" placeholder="Buscar..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <!-- View Mode Switch -->
            <div class="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
                <button 
                    @click="viewMode = 'active'"
                    :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'active' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700']"
                >Activas</button>
                <button 
                    @click="viewMode = 'history'"
                    :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'history' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700']"
                >Historial</button>
                <button 
                    @click="viewMode = 'all'"
                    :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'all' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700']"
                >Todas</button>
            </div>
        </div>

        <Button label="Nueva Asignación" icon="pi pi-plus" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-6 !py-2.5 !rounded-lg !text-white !text-sm shadow-lg shadow-emerald-900/20 w-full md:w-auto" @click="openNew" />
      </div>

      <!-- DATATABLE -->
      <DataTable 
        :value="loading ? skeletonRows : asignaciones" 
        :paginator="true" 
        :rows="10" 
        dataKey="id" 
        :filters="filters" 
        :loading="false" 
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['equipo_nombre', 'equipo_numero_serie', 'empleado_nombres', 'empleado_apellidos', 'sucursal_asignada_nombre', 'area_asignada_nombre']"
      >
        <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                    <i class="pi pi-file-o text-4xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No hay asignaciones</h3>
                <p class="text-gray-500 text-sm max-w-xs mx-auto">No se encontraron registros activos o que coincidan con la búsqueda.</p>
            </div>
        </template>

        <!-- Equipo -->
        <Column field="equipo_nombre" header="Equipo" sortable style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="flex flex-col">
                    <span class="text-gray-900 dark:text-white font-bold text-sm">{{ data.equipo_nombre }}</span>
                    <span class="text-xs text-gray-500 font-mono">{{ data.equipo_numero_serie }}</span>
                    <Tag v-if="data.equipo_padre_nombre" icon="pi pi-link" value="Componente" severity="info" class="mt-1 !text-[10px] w-fit" />
                </div>
            </template>
        </Column>

        <!-- Asignado A -->
        <Column header="Asignado A" style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="flex items-center gap-2">
                    <div :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', getTipoAsignacion(data).color]">
                        <i :class="['pi text-sm', getTipoAsignacion(data).icon]"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-900 dark:text-white font-medium text-sm">{{ getAsignadoA(data) }}</span>
                        <span class="text-xs text-gray-500">{{ getTipoAsignacion(data).label }}</span>
                    </div>
                </div>
            </template>
        </Column>

        <!-- Fecha Asignación -->
        <Column field="fecha_asignacion" header="Fecha Asignación" sortable style="width: 15%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-700 dark:text-gray-300 text-sm">{{ formatDate(data.fecha_asignacion) }}</span>
            </template>
        </Column>

        <!-- Status -->
        <Column field="status_nombre" header="Estado" sortable style="width: 15%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="5rem" />
                <Tag v-else :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5" />
            </template>
        </Column>

        <!-- Actions -->
        <Column header="Acciones" style="width: 15%; text-align: right">
            <template #body="{ data }">
                <div v-if="loading" class="flex gap-2">
                    <Skeleton size="2rem" />
                </div>
                <div v-else class="flex gap-1 justify-end">
                    <button class="w-7 h-7 rounded bg-gray-100 hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all" @click="viewAsignacion(data)" title="Ver Detalle">
                        <i class="pi pi-eye text-xs"></i>
                    </button>
                    <!-- Mostrar botón finalizar solo si está activa -->
                    <button v-if="!data.fecha_fin_asignacion" class="w-7 h-7 rounded bg-gray-100 hover:bg-orange-50 text-orange-500 flex items-center justify-center transition-all" @click="finalizarAsignacion(data)" title="Finalizar Asignación">
                        <i class="pi pi-check-square text-xs"></i>
                    </button>
                </div>
            </template>
        </Column>

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
