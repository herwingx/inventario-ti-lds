<script setup>
/**
 * @fileoverview Vista de catálogo de Empresas.
 * Gestiona las entidades corporativas del grupo.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import EmpresasService from '../services/EmpresasService'
import DataTable from '../components/ui/DataTable.vue'
import { getStatusSeverity } from '../utils/status'
import { Search, Plus, Pencil, Trash2, Building } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

const { confirmDelete: swalConfirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()
const router = useRouter()

// Data
const empresas = ref([])
const loading = ref(true)
const globalFilter = ref('')

// Columnas
const columns = [
  { field: 'nombre', header: 'Nombre', sortable: true, width: '50%' },
  { field: 'status_nombre', header: 'Estado', sortable: true, width: '25%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '25%', align: 'right' }
]

const filteredEmpresas = computed(() => {
  if (!globalFilter.value) return empresas.value
  const search = globalFilter.value.toLowerCase()
  return empresas.value.filter(e =>
    e.nombre?.toLowerCase().includes(search) ||
    e.status_nombre?.toLowerCase().includes(search)
  )
})

const loadEmpresas = async () => {
  loading.value = true
  try {
    empresas.value = await EmpresasService.getAll()
  } catch (error) {
    toastError('No se pudieron cargar las empresas')
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

const confirmDelete = async (data) => {
  const result = await swalConfirmDelete({
    title: 'Confirmar Eliminación',
    text: `¿Estás seguro de eliminar "${data.nombre}"?`,
    confirmButtonText: 'Eliminar Empresa',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await EmpresasService.delete(data.id)
      toastSuccess('Empresa eliminada')
      loadEmpresas()
    } catch (error) {
      toastError('No se pudo eliminar (tienes sucursales asociadas?)')
    }
  } else {
    toastInfo('Operación cancelada')
  }
}

const clearFilters = () => {
  globalFilter.value = ''
}
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
          <InputText v-model="globalFilter" placeholder="Buscar empresa..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
        </div>
        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nueva Empresa</span>
        </button>
      </div>

      <DataTable 
        :data="filteredEmpresas" 
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Building class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron empresas</h3>
            <button v-if="globalFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #nombre="{ data }">
          <span class="font-bold text-gray-900 dark:text-white text-base">{{ data.nombre }}</span>
        </template>

        <template #skeleton-nombre>
          <div class="skeleton h-4 w-36"></div>
        </template>

        <template #status_nombre="{ data }">
          <Tag :value="data.status_nombre" :severity="getStatusSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5" />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-16 rounded-md"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editEmpresa(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDelete(data)" title="Eliminar">
              <Trash2 :size="16" />
            </button>
          </div>
        </template>

        <template #skeleton-actions>
          <div class="flex gap-2 justify-end">
            <div class="skeleton w-8 h-8 rounded-lg"></div>
            <div class="skeleton w-8 h-8 rounded-lg"></div>
          </div>
        </template>
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
