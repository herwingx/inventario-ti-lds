<script setup>
/**
 * @fileoverview Vista de catálogo de Empresas.
 * Gestiona las entidades corporativas del grupo.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EmpresasService from '../services/EmpresasService'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()

const empresas = ref([])
const loading = ref(true)
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const loadEmpresas = async () => {
    loading.value = true
    try {
        empresas.value = await EmpresasService.getAll()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las empresas', life: 3000 })
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadEmpresas()
})

const openNew = () => {
    router.push({ name: 'empresas-nuevo' })
}

const editEmpresa = (data) => {
    router.push({ name: 'empresas-editar', params: { id: data.id } })
}

const confirmDelete = (data) => {
    confirm.require({
        message: `¿Estás seguro de eliminar "${data.nombre}"?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger !bg-red-500 !border-none',
        accept: async () => {
            try {
                await EmpresasService.delete(data.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Empresa eliminada', life: 3000 })
                loadEmpresas()
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar (tienes sucursales asociadas?)', life: 4000 })
            }
        }
    })
}

const skeletonRows = new Array(3).fill({})
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="relative w-full sm:w-64">
             <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
             <InputText v-model="filters['global'].value" placeholder="Buscar empresa..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
        </div>
        <Button label="Nueva Empresa" icon="pi pi-plus" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-6 !py-2.5 !rounded-lg !text-white !text-sm shadow-lg w-full md:w-auto" @click="openNew" />
      </div>

      <DataTable 
        :value="loading ? skeletonRows : empresas" 
        :paginator="true" 
        :rows="10" 
        :filters="filters" 
        :loading="false"
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['nombre', 'status_nombre']"
      >
        <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <i class="pi pi-building text-4xl text-gray-400 mb-3"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron empresas</h3>
            </div>
        </template>

        <Column field="nombre" header="Nombre" sortable style="width: 50%">
             <template #body="{ data }">
                <Skeleton v-if="loading" width="12rem" />
                <span v-else class="font-bold text-gray-900 dark:text-white text-base">{{ data.nombre }}</span>
             </template>
        </Column>

        <Column field="status_nombre" header="Estado" sortable style="width: 25%">
             <template #body="{ data }">
                <Skeleton v-if="loading" width="6rem" />
                <Tag v-else :value="data.status_nombre" :severity="data.status_nombre === 'ACTIVO' ? 'success' : 'warn'" class="!text-xs !font-bold px-3 py-1.5" />
             </template>
        </Column>

        <Column header="Acciones" style="width: 25%; text-align: right">
            <template #body="{ data }">
                 <div v-if="loading" class="flex gap-2 justify-end">
                    <Skeleton size="2rem" />
                    <Skeleton size="2rem" />
                 </div>
                <div v-else class="flex gap-1 justify-end">
                    <!-- Edit Button -->
                    <button class="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-primary flex items-center justify-center transition-all" @click="editEmpresa(data)" title="Editar">
                        <i class="pi pi-pencil text-xs"></i>
                    </button>
                    <!-- Delete Button -->
                    <button class="w-7 h-7 rounded bg-gray-100 hover:bg-red-50 text-red-500 flex items-center justify-center transition-all" @click="confirmDelete(data)" title="Eliminar">
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
