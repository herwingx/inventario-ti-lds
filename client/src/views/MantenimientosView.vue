<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import MantenimientosService from '../services/MantenimientosService'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Toolbar from 'primevue/toolbar'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const mantenimientos = ref([])
const loading = ref(true)
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

onMounted(async () => {
    await loadMantenimientos()
})

const loadMantenimientos = async () => {
    loading.value = true
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
    // Ajustar zona horaria si es necesario, o usar simple string split si viene YYYY-MM-DD
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatusSeverity = (status) => {
    switch (status?.toLowerCase()) {
        case 'activo':
        case 'en proceso':
        case 'en reparación':
            return 'warn'
        case 'finalizado':
        case 'completado':
        case 'reparado':
            return 'success'
        case 'cancelado':
            return 'danger'
        default:
            return 'secondary'
    }
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
        acceptClass: 'p-button-danger',
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
</script>

<template>
    <div class="animate-fade-in-up space-y-4">
        <Toolbar class="rounded-xl border-none bg-white/50 dark:bg-dark-card/50 backdrop-blur-md shadow-sm mb-4 p-4">
            <template #start>
                <div class="flex flex-col sm:flex-row gap-2 items-center">
                    <h1 class="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Mantenimientos
                    </h1>
                    <span class="hidden sm:inline text-gray-400">|</span>
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Historial y Servicios</span>
                </div>
            </template>
            <template #end>
                <Button label="Registrar Servicio" icon="pi pi-plus" class="p-button-rounded p-button-primary shadow-lg hover:shadow-xl transition-all" @click="openNew" />
            </template>
        </Toolbar>

        <div class="card bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-100 dark:border-dark-border overflow-hidden">
            <DataTable 
                ref="dt" 
                :value="mantenimientos" 
                v-model:filters="filters" 
                dataKey="id"
                :paginator="true" 
                :rows="10" 
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :loading="loading"
                stripedRows
                removableSort
                class="p-datatable-sm"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                         <IconField iconPosition="left" class="w-full sm:w-64">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="filters['global'].value" placeholder="Buscar..." class="w-full !rounded-lg" />
                        </IconField>
                        <Button icon="pi pi-refresh" text rounded @click="loadMantenimientos" :loading="loading" />
                    </div>
                </template>

                <template #empty>
                     <div class="flex flex-col items-center justify-center py-8 text-gray-500">
                        <i class="pi pi-wrench text-4xl mb-2 opacity-50"></i>
                        <p>No se encontraron registros de mantenimiento.</p>
                    </div>
                </template>
                
                <template #loading>
                    <div class="p-4">
                       <Skeleton width="100%" height="2rem" class="mb-2" />
                       <Skeleton width="100%" height="2rem" class="mb-2" />
                       <Skeleton width="100%" height="2rem" class="mb-2" />
                    </div>
                </template>

                <Column field="id" header="ID" sortable style="width: 5rem">
                    <template #body="{ data }">
                        <span class="font-mono text-gray-500">#{{ data.id }}</span>
                    </template>
                </Column>

                <Column field="equipo_nombre" header="Equipo/Serie" sortable style="min-width: 14rem">
                    <template #body="{ data }">
                        <div class="flex flex-col">
                            <span class="font-medium text-gray-900 dark:text-white">{{ data.equipo_nombre }}</span>
                            <span class="text-xs text-gray-500">{{ data.equipo_numero_serie }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="fecha_inicio" header="Fecha Inicio" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                        {{ formatDate(data.fecha_inicio) }}
                    </template>
                </Column>

                <Column field="fecha_fin" header="Fecha Fin" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                         <span v-if="data.fecha_fin">{{ formatDate(data.fecha_fin) }}</span>
                         <Tag v-else value="En Proceso" severity="warn" class="px-2 py-0.5 text-xs" />
                    </template>
                </Column>
                
                <Column field="proveedor" header="Proveedor" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                        {{ data.proveedor || 'Interno' }}
                    </template>
                </Column>

                <Column field="status_nombre" header="Estado" sortable style="width: 8rem">
                    <template #body="{ data }">
                        <Tag :value="data.status_nombre" :severity="getStatusSeverity(data.status_nombre)" class="px-2 py-1 uppercase text-xs font-bold tracking-wider" />
                    </template>
                </Column>

                <!-- Acciones -->
                <Column :exportable="false" style="min-width: 8rem" alignFrozen="right" frozen>
                    <template #body="slotProps">
                        <div class="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" outlined rounded class="!w-7 !h-7" @click="editMantenimiento(slotProps.data)" v-tooltip.top="'Editar'" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" class="!w-7 !h-7" @click="deleteMantenimiento(slotProps.data)" v-tooltip.top="'Eliminar'" />
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
