<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import CorreosService from '../services/CorreosService'
import EmpleadosService from '../services/EmpleadosService'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()

const correos = ref([])
const loading = ref(true)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS }
})

const statuses = ref([
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' },
    { label: 'Suspendido', value: 'SUSPENDIDO' }
])

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
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar',
        rejectClass: 'p-button-secondary p-button-text',
        acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600',
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

// Helpers
const getSeverity = (status) => {
    if (!status) return 'secondary'
    const s = status.toUpperCase()
    if (s.includes('ACTIVO')) return 'success'
    if (s.includes('INACTIVO')) return 'warn'
    if (s.includes('SUSPENDIDO')) return 'danger'
    return 'secondary'
}

const skeletonRows = new Array(5).fill({})
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div class="relative w-full sm:w-64">
                 <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
                 <InputText v-model="filters['global'].value" placeholder="Buscar email, usuario..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <Button label="Nueva Cuenta" icon="pi pi-plus" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-6 !py-2.5 !rounded-lg !text-white !text-sm shadow-lg w-full md:w-auto" @click="openNew" />
      </div>

      <!-- DataTable -->
      <DataTable 
        :value="loading ? skeletonRows : correos" 
        :paginator="true" 
        :rows="10" 
        dataKey="id" 
        :filters="filters" 
        :loading="false" 
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['email', 'usuario_email', 'nombre_empleado', 'apellido_empleado']"
      >
         <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <i class="pi pi-envelope text-4xl text-gray-400 mb-3"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron cuentas</h3>
            </div>
        </template>

        <Column field="email" header="Email Corporativo" sortable style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="12rem" />
                <div v-else class="flex flex-col">
                    <span class="text-gray-900 dark:text-white font-bold text-sm">{{ data.email }}</span>
                    <span class="text-xs text-gray-500">{{ data.usuario_email }}</span>
                </div>
            </template>
        </Column>

        <Column field="nombre_empleado" header="Asignado A" sortable style="width: 25%">
            <template #body="{ data }">
                 <Skeleton v-if="loading" width="10rem" />
                 <div v-else>
                     <span v-if="data.nombre_empleado" class="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {{ data.nombre_empleado }} {{ data.apellido_empleado }}
                     </span>
                     <span v-else class="text-gray-400 text-sm italic">Sin asignar</span>
                 </div>
            </template>
        </Column>

        <Column field="status_nombre" header="Estado" sortable style="width: 15%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="6rem" />
                <Tag v-else :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5" />
            </template>
        </Column>

        <Column header="Acciones" style="width: 15%; text-align: right">
            <template #body="{ data }">
                <div v-if="loading" class="flex gap-2">
                    <Skeleton size="2rem" />
                </div>
                <div v-else class="flex gap-1 justify-end">
                    <button class="w-8 h-8 rounded bg-gray-100 hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all" @click="viewCorreo(data)" title="Ver Detalle">
                        <i class="pi pi-eye text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-primary flex items-center justify-center transition-all" @click="editCorreo(data)" title="Editar">
                        <i class="pi pi-pencil text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded bg-gray-100 hover:bg-red-50 text-red-500 flex items-center justify-center transition-all" @click="confirmDeleteCorreo(data)" title="Eliminar">
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
