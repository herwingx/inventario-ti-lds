<script setup>
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
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border">
      
      <div class="flex justify-between items-center mb-6">
        <div class="relative w-full sm:w-64">
             <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
             <InputText v-model="filters['global'].value" placeholder="Buscar empresa..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-none" />
        </div>
        <Button label="Nueva Empresa" icon="pi pi-plus" class="!bg-primary !border-none" @click="openNew" />
      </div>

      <DataTable :value="loading ? skeletonRows : empresas" :paginator="true" :rows="10" :filters="filters" :loading="false">
        <Column field="nombre" header="Nombre" sortable>
             <template #body="{ data }">
                <Skeleton v-if="loading" />
                <span v-else class="font-bold text-gray-900 dark:text-white">{{ data.nombre }}</span>
             </template>
        </Column>

        <Column field="status_nombre" header="Estado" sortable>
             <template #body="{ data }">
                <Skeleton v-if="loading" />
                <Tag v-else :value="data.status_nombre" :severity="data.status_nombre === 'ACTIVO' ? 'success' : 'warn'" />
             </template>
        </Column>

        <Column header="Acciones" style="width: 10rem; text-align: right">
            <template #body="{ data }">
                 <div v-if="!loading" class="flex justify-end gap-2">
                    <Button icon="pi pi-pencil" text rounded aria-label="Editar" @click="editEmpresa(data)" />
                    <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Eliminar" @click="confirmDelete(data)" />
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
