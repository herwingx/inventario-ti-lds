<script setup>
/**
 * @fileoverview Vista de administración de Cuentas de Correo.
 * Muestra el inventario de correos corporativos y su estado actual.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import CorreosService from '../services/CorreosService'
import EmpleadosService from '../services/EmpleadosService'
import { Search, Plus, Eye, Pencil, Trash2, Mail } from 'lucide-vue-next'

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
        acceptLabel: 'Eliminar Cuenta',
        rejectClass: 'btn-secondary',
        acceptClass: 'btn-danger ml-2',
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
      
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div class="relative w-full sm:w-64">
                 <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                 <InputText v-model="filters['global'].value" placeholder="Buscar email, usuario..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
            <Plus :size="18" />
            <span>Nueva Cuenta</span>
        </button>
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
                <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Mail class="text-gray-400 dark:text-gray-500" :size="40" />
                </div>
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
                <div v-if="loading" class="flex gap-2 justify-end">
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                </div>
                <div v-else class="flex gap-1 justify-end">
                    <!-- View Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewCorreo(data)" title="Ver Detalle">
                        <Eye :size="16" />
                    </button>
                    <!-- Edit Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editCorreo(data)" title="Editar">
                        <Pencil :size="16" />
                    </button>
                    <!-- Delete Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteCorreo(data)" title="Eliminar">
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
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
