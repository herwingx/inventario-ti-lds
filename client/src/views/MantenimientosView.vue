<script setup>
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
import Select from 'primevue/select' // o Dropdown

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

// Opciones para el filtro de Estado (Mantenimientos)
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
    await new Promise(resolve => setTimeout(resolve, 600)) // Delay para suavidad
    try {
        mantenimientos.value = await MantenimientosService.getAll()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los mantenimientos', life: 3000 })
    } finally {
        loading.value = false
    }
}

const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

const formatDate = (date) => {
    if (!date) return '-'
    // Usar split T para evitar tz issues simples o toLocaleDateString
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
                         <InputText v-model="filters['global'].value" placeholder="Buscar equipo, serie..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
                    </div>

                    <!-- Filter by Status -->
                    <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white" />
                </div>

                 <!-- Right: Action Buttons -->
                 <div class="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                    <Button label="Registrar Servicio" icon="pi pi-plus" class="!bg-primary !border-primary hover:!bg-primary-dark !px-5 !py-2.5 !rounded-lg !font-medium !shadow-lg hover:!shadow-xl hover:!-translate-y-0.5 transition-all !text-white" @click="openNew" />
                 </div>
            </div>

            <!-- Table -->
            <DataTable 
                ref="dt" 
                :value="loading ? skeletonRows : mantenimientos" 
                v-model:filters="filters" 
                dataKey="id"
                :paginator="!loading" 
                :rows="10"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} servicios"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                selectionMode="single"
                stripedRows
                removableSort
                :loading="false"
                class="premium-datatable"
            >
                <!-- Empty State -->
                 <template #empty>
                    <div class="flex flex-col items-center justify-center py-12 text-center">
                        <div class="w-20 h-20 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4">
                            <i class="pi pi-wrench text-3xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">Sin Registros</h3>
                        <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay mantenimientos registrados aún.</p>
                    </div>
                </template>

                <!-- Columns -->
                <!-- ID -->
                <Column field="id" header="ID" sortable style="width: 5rem">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="2rem" />
                         <span v-else class="font-mono text-gray-500">#{{ data.id }}</span>
                    </template>
                </Column>

                <!-- Equipo Info -->
                <Column field="equipo_nombre" header="Equipo" sortable style="min-width: 14rem">
                    <template #body="{ data }">
                        <div v-if="loading" class="flex flex-col gap-1">
                             <Skeleton width="8rem" />
                             <Skeleton width="5rem" height="0.8rem" />
                        </div>
                        <div v-else class="flex flex-col">
                            <span class="font-medium text-gray-900 dark:text-white">{{ data.equipo_nombre }}</span>
                            <span class="text-xs text-gray-500 font-mono">{{ data.equipo_numero_serie }}</span>
                        </div>
                    </template>
                </Column>

                <!-- Fechas -->
                <Column field="fecha_inicio" header="Inicio" sortable style="min-width: 8rem">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="6rem" />
                        <span v-else>{{ formatDate(data.fecha_inicio) }}</span>
                    </template>
                </Column>

                <Column field="fecha_fin" header="Fin" sortable style="min-width: 8rem">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="6rem" />
                        <div v-else>
                            <span v-if="data.fecha_fin">{{ formatDate(data.fecha_fin) }}</span>
                            <Tag v-else value="En Proceso" severity="warn" class="!text-xs !px-2" rounded />
                        </div>
                    </template>
                </Column>

                <Column field="proveedor" header="Proveedor" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="7rem" />
                         <span v-else>{{ data.proveedor || 'Interno' }}</span>
                    </template>
                </Column>

                <!-- Status -->
                <Column field="status_nombre" header="Estado" sortable style="width: 8rem">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="5rem" height="1.5rem" borderRadius="16px" />
                         <Tag v-else :value="data.status_nombre" :severity="getStatusSeverity(data.status_nombre)" class="!text-xs !font-bold !tracking-wider !px-3 !py-1" rounded />
                    </template>
                </Column>

                <!-- Actions -->
                <Column :exportable="false" style="width: 8rem" alignFrozen="right" frozen>
                    <template #body="slotProps">
                        <Skeleton v-if="loading" width="5rem" height="2rem" />
                        <div v-else class="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" outlined rounded class="!w-7 !h-7 !text-gray-500 hover:!text-primary !border-gray-300 hover:!border-primary hover:!bg-primary/10 transition-colors" @click="editMantenimiento(slotProps.data)" v-tooltip.top="'Editar'" />
                            <Button icon="pi pi-trash" outlined rounded class="!w-7 !h-7 !text-gray-500 hover:!text-red-500 !border-gray-300 hover:!border-red-500 hover:!bg-red-50 transition-colors" @click="deleteMantenimiento(slotProps.data)" v-tooltip.top="'Eliminar'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom Table Styling overrides if needed, consistent with EquiposView */
:deep(.p-datatable-header) {
    background: transparent !important;
    border: none !important;
    padding: 0 0 1.5rem 0 !important;
}
</style>
