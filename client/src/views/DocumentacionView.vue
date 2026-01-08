<script setup>
/**
 * @fileoverview Vista de galería de Documentación.
 * Permite subir, visualizar y gestionar documentos (manuales, facturas, guías) asociados al inventario.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import DocumentacionService from '../services/DocumentacionService'
import DataTable from '../components/ui/DataTable.vue'
import { Search, Plus, Eye, Pencil, Trash2, FileText, ExternalLink } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

// Data
const documentos = ref([])
const loading = ref(true)
const globalFilter = ref('')
const tipoFilter = ref(null)

const tipos = ref([
  { label: 'Manual', value: 'Manual' },
  { label: 'Guía', value: 'Guía' },
  { label: 'Política', value: 'Política' },
  { label: 'Factura', value: 'Factura' },
  { label: 'Otro', value: 'Otro' }
])

// Columnas
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'titulo', header: 'Título/Descripción', sortable: true, width: '35%' },
  { field: 'tipo_documento', header: 'Tipo', sortable: true, width: '15%' },
  { field: 'fecha_subida', header: 'Fecha', sortable: true, width: '15%' },
  { field: 'url_archivo', header: 'Archivo', sortable: false, width: '10%', align: 'center' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '12%', align: 'right' }
]

const filteredDocumentos = computed(() => {
  let result = documentos.value

  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(d =>
      d.titulo?.toLowerCase().includes(search) ||
      d.descripcion?.toLowerCase().includes(search) ||
      d.tipo_documento?.toLowerCase().includes(search)
    )
  }

  if (tipoFilter.value) {
    result = result.filter(d => d.tipo_documento === tipoFilter.value)
  }

  return result
})

onMounted(async () => {
  loadDocumentos()
})

const loadDocumentos = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    documentos.value = await DocumentacionService.getAll()
  } catch (error) {
    toastError('No se pudieron cargar los documentos')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

const openNew = () => {
  router.push({ name: 'documentacion-nuevo' })
}

const editDocumento = (doc) => {
  router.push({ name: 'documentacion-editar', params: { id: doc.id } })
}

const deleteDocumento = async (doc) => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: '¿Estás seguro de eliminar este documento?',
    confirmButtonText: 'Eliminar Documento',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await DocumentacionService.delete(doc.id)
      toastSuccess('Documento eliminado')
      loadDocumentos()
    } catch (error) {
      toastError('No se pudo eliminar el documento')
    }
  } else {
    toastInfo('Operación cancelada')
  }
}

const openLink = (url) => {
  if (url) window.open(url, '_blank')
}

const clearFilters = () => {
  globalFilter.value = ''
  tipoFilter.value = null
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="globalFilter" placeholder="Buscar documento..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div>

          <Select v-model="tipoFilter" :options="tipos" optionLabel="label" optionValue="value" placeholder="Tipo" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Registrar Documento</span>
        </button>
      </div>

      <!-- DataTable Nativo -->
      <DataTable 
        :data="filteredDocumentos"
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <FileText class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Galería Vacía</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay documentación registrada.</p>
            <button v-if="globalFilter || tipoFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
          </div>
        </template>

        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <template #skeleton-id>
          <div class="skeleton h-4 w-8"></div>
        </template>

        <template #titulo="{ data }">
          <div>
            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.titulo }}</div>
            <span class="text-gray-500 dark:text-gray-400 text-xs truncate block max-w-xs">{{ data.descripcion }}</span>
          </div>
        </template>

        <template #skeleton-titulo>
          <div class="space-y-1">
            <div class="skeleton h-4 w-40"></div>
            <div class="skeleton h-3 w-60"></div>
          </div>
        </template>

        <template #tipo_documento="{ data }">
          <Tag :value="data.tipo_documento" severity="info" class="!text-xs !font-bold px-3 py-1 !rounded-md" />
        </template>

        <template #skeleton-tipo_documento>
          <div class="skeleton h-5 w-16 rounded-md"></div>
        </template>

        <template #fecha_subida="{ data }">
          <span class="text-gray-700 dark:text-gray-200 text-sm font-bold">{{ formatDate(data.fecha_subida) }}</span>
        </template>

        <template #skeleton-fecha_subida>
          <div class="skeleton h-4 w-24"></div>
        </template>

        <template #url_archivo="{ data }">
          <button 
            v-if="data.url_archivo" 
            class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-all mx-auto" 
            @click="openLink(data.url_archivo)" 
            title="Ver Archivo"
          >
            <ExternalLink :size="16" />
          </button>
          <span v-else class="text-gray-400 text-xs">-</span>
        </template>

        <template #skeleton-url_archivo>
          <div class="skeleton w-8 h-8 rounded-lg mx-auto"></div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editDocumento(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="deleteDocumento(data)" title="Eliminar">
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
