<script setup>
/**
 * @fileoverview Vista de catálogo de Sucursales.
 * Muestra las ubicaciones físicas de las empresas y permite su administración.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import SucursalesService from '../services/SucursalesService'
import DataTable from '../components/ui/DataTable.vue'
import { Search, Plus, Eye, Pencil, Trash2, Building } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'

const { confirmDelete: swalConfirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()
const router = useRouter()

// Data
const sucursales = ref([])
const loading = ref(true)
const globalFilter = ref('')

// Columnas
const columns = [
  { field: 'nombre', header: 'Nombre', sortable: true, width: '25%' },
  { field: 'nombre_empresa', header: 'Empresa', sortable: true, width: '20%' },
  { field: 'nombre_tipo_sucursal', header: 'Tipo', sortable: true, width: '15%' },
  { field: 'direccion', header: 'Dirección', sortable: true, width: '25%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '15%', align: 'right' }
]

const filteredSucursales = computed(() => {
  if (!globalFilter.value) return sucursales.value
  const search = globalFilter.value.toLowerCase()
  return sucursales.value.filter(s =>
    s.nombre?.toLowerCase().includes(search) ||
    s.nombre_empresa?.toLowerCase().includes(search) ||
    s.nombre_tipo_sucursal?.toLowerCase().includes(search) ||
    s.ciudad?.toLowerCase().includes(search)
  )
})

const loadSucursales = async () => {
  loading.value = true
  try {
    sucursales.value = await SucursalesService.getAll()
  } catch (error) {
    console.error('Error al cargar sucursales:', error)
    toastError('No se pudieron cargar las sucursales')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSucursales()
})

const openNew = () => {
  router.push({ name: 'sucursales-nuevo' })
}

const editSucursal = (data) => {
  router.push({ name: 'sucursales-editar', params: { id: data.id } })
}

const viewSucursal = (data) => {
  router.push({ name: 'sucursales-detalle', params: { id: data.id } })
}

const confirmDelete = async (data) => {
  const result = await swalConfirmDelete({
    title: 'Confirmar Eliminación',
    text: `¿Estás seguro de eliminar la sucursal "${data.nombre}"?`,
    confirmButtonText: 'Eliminar Sucursal',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await SucursalesService.delete(data.id)
      toastSuccess('Sucursal eliminada')
      loadSucursales()
    } catch (error) {
      toastError('No se pudo eliminar')
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
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
          <InputText v-model="globalFilter" placeholder="Buscar sucursal..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
        </div>
        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      <!-- DataTable Nativo -->
      <DataTable 
        :data="filteredSucursales" 
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
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron sucursales</h3>
            <button v-if="globalFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #nombre="{ data }">
          <span class="font-bold text-gray-900 dark:text-white text-base">{{ data.nombre }}</span>
        </template>

        <template #skeleton-nombre>
          <div class="skeleton h-4 w-32"></div>
        </template>

        <template #nombre_empresa="{ data }">
          <span class="text-gray-700 dark:text-gray-300">{{ data.nombre_empresa || 'N/A' }}</span>
        </template>

        <template #skeleton-nombre_empresa>
          <div class="skeleton h-4 w-24"></div>
        </template>

        <template #nombre_tipo_sucursal="{ data }">
          <span class="text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wide">{{ data.nombre_tipo_sucursal }}</span>
        </template>

        <template #skeleton-nombre_tipo_sucursal>
          <div class="skeleton h-6 w-20 rounded-md"></div>
        </template>

        <template #direccion="{ data }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ data.direccion }}</span>
        </template>

        <template #skeleton-direccion>
          <div class="skeleton h-4 w-40"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewSucursal(data)" title="Ver Detalle">
              <Eye :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editSucursal(data)" title="Editar">
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
