<script setup>
/**
 * @fileoverview Vista de historial de Mantenimientos.
 * Permite visualizar y gestionar los servicios de mantenimiento (preventivo/correctivo) de los equipos.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import MantenimientosService from '../services/MantenimientosService'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select' 

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const mantenimientos = ref([])
const loading = ref(true)

// Configuración de Filtros
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Opciones para el filtro de Estado
const statuses = ref([
    { label: 'En Proceso', value: 'EN PROCESO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Cancelado', value: 'CANCELADO' }
])

onMounted(async () => {
    loadMantenimientos()
})

const loadMantenimientos = async () => {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 600)) 
    try {
        mantenimientos.value = await MantenimientosService.getAll()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los mantenimientos', life: 3000 })
    } finally {
        loading.value = false
    }
}

const formatDate = (date) => {
    if (!date) return '-'
    // Formato consistente, ej: 15 Ene, 2024
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatusSeverity = (status) => {
    if (!status) return 'secondary'
    const s = status.toUpperCase()
    if (s.includes('FINALIZADO') || s.includes('COMPLETADO')) return 'success'
    if (s.includes('PROCESO') || s.includes('REPARACIÓN')) return 'warn'
    if (s.includes('CANCELADO')) return 'danger'
    return 'secondary'
}

const openNew = () => {
    router.push({ name: 'mantenimientos-nuevo' })
}

const editMantenimiento = (mantenimiento) => {
    router.push({ name: 'mantenimientos-editar', params: { id: mantenimiento.id } })
}

const deleteMantenimiento = (mantenimiento) => {
    confirm.require({
        message: '¿Está seguro de eliminar este registro de mantenimiento?',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600',
        accept: async () => {
            try {
                await MantenimientosService.delete(mantenimiento.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado', life: 3000 })
                loadMantenimientos()
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro', life: 3000 })
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
                    <div class="relative w-full sm:w-72">
                         <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
                         <InputText v-model="filters['global'].value" placeholder="Buscar..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
                    </div>

                    <!-- Filter by Status -->
                    <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
                </div>

                 <!-- Right: Action Buttons -->
                 <Button label="Registrar Servicio" icon="pi pi-plus" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-6 !py-2.5 !rounded-lg !text-white !text-sm shadow-lg shadow-emerald-900/20 w-full md:w-auto" @click="openNew" />
            </div>

            <!-- Table -->
            <DataTable 
                :value="loading ? skeletonRows : mantenimientos" 
                v-model:filters="filters" 
                dataKey="id"
                :paginator="true" 
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="{first}-{last} de {totalRecords}"
                class="custom-table"
                :rowHover="true"
                :loading="false"
                :globalFilterFields="['equipo_nombre', 'equipo_numero_serie', 'proveedor', 'status_nombre']"
            >
                <template #empty>
                    <div class="flex flex-col items-center justify-center p-12 text-center">
                        <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                            <i class="pi pi-wrench text-3xl text-gray-400 dark:text-gray-500"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Sin Registros</h3>
                        <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay mantenimientos registrados aún.</p>
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

                <!-- Equipo Info -->
                <Column field="equipo_nombre" header="Equipo/Serie" sortable style="width: 25%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <div v-else>
                            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.equipo_nombre }}</div>
                            <span class="text-gray-500 dark:text-gray-400 text-xs font-medium font-mono">{{ data.equipo_numero_serie }}</span>
                        </div>
                    </template>
                </Column>

                <!-- Fechas -->
                <Column field="fecha_inicio" header="Inicio" sortable style="width: 15%">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <span v-else class="text-gray-700 dark:text-gray-200 text-sm font-bold">{{ formatDate(data.fecha_inicio) }}</span>
                    </template>
                </Column>

                <Column field="fecha_fin" header="Fin/Estado" sortable style="width: 15%">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <div v-else>
                            <span v-if="data.fecha_fin" class="text-gray-700 dark:text-gray-200 text-sm">{{ formatDate(data.fecha_fin) }}</span>
                            <span v-else class="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded uppercase tracking-wider">En Proceso</span>
                        </div>
                    </template>
                </Column>

                <Column field="proveedor" header="Proveedor" sortable style="width: 15%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="7rem" class="!bg-gray-200 dark:!bg-dark-border" />
                         <span v-else class="text-gray-900 dark:text-white text-sm font-bold">{{ data.proveedor || 'Interno' }}</span>
                    </template>
                </Column>

                <!-- Status -->
                <Column field="status_nombre" header="Status" sortable style="width: 10%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="5rem" height="1.5rem" borderRadius="4px" class="!bg-gray-200 dark:!bg-dark-border" />
                         <Tag v-else :value="data.status_nombre" :severity="getStatusSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
                    </template>
                </Column>

                <!-- Actions -->
                <Column header="Acciones" style="width: 12%; text-align: right">
                    <template #body="{ data }">
                         <div v-if="loading" class="flex gap-2 justify-start">
                             <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                             <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                         </div>
                         <div v-else class="flex gap-1 justify-start">
                            <!-- Edit Button -->
                            <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-border text-primary flex items-center justify-center transition-all border border-gray-200 dark:border-transparent" @click="editMantenimiento(data)" title="Editar">
                                <i class="pi pi-pencil text-xs"></i>
                            </button>
                            <!-- Delete Button -->
                            <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center transition-all border border-gray-200 dark:border-transparent hover:border-red-500" @click="deleteMantenimiento(data)" title="Eliminar">
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
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
