<script setup>
/**
 * @fileoverview Vista de Notas y Observaciones.
 * Muestra bitácoras o notas rápidas asociadas a equipos o procesos generales.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import NotasService from '../services/NotasService'
import DataTable from '../components/ui/DataTable.vue'
import { Search, Plus, Pencil, Trash2, StickyNote, User, Calendar, Monitor, Settings } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError } = useSwal()

// Data
const notas = ref([])
const loading = ref(true)
const globalFilter = ref('')

// Columnas
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'titulo', header: 'Nota', sortable: true, width: '40%' },
  { field: 'relacionado', header: 'Relacionado a', sortable: false, width: '20%' },
  { field: 'fecha_registro', header: 'Detalles', sortable: true, width: '20%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '15%', align: 'right' }
]

const filteredNotas = computed(() => {
  if (!globalFilter.value) return notas.value
  const search = globalFilter.value.toLowerCase()
  return notas.value.filter(n =>
    n.titulo?.toLowerCase().includes(search) ||
    n.contenido?.toLowerCase().includes(search) ||
    n.equipo_numero_serie?.toLowerCase().includes(search) ||
    n.usuario_creador?.toLowerCase().includes(search)
  )
})

onMounted(async () => {
  loadNotas()
})

const loadNotas = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    notas.value = await NotasService.getAll()
  } catch (error) {
    toastError('No se pudieron cargar las notas')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const openNew = () => {
  router.push({ name: 'notas-nuevo' })
}

const editNota = (nota) => {
  router.push({ name: 'notas-editar', params: { id: nota.id } })
}

const deleteNota = async (nota) => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: '¿Estás seguro de eliminar esta nota?',
    confirmButtonText: 'Eliminar Nota',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await NotasService.delete(nota.id)
      toastSuccess('Nota eliminada')
      loadNotas()
    } catch (error) {
      toastError('No se pudo eliminar la nota')
    }
  }
}

const truncate = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
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
        
        <div class="relative w-full md:w-96">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
          <InputText v-model="globalFilter" placeholder="Buscar en notas..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
        </div>

        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Crear Nota</span>
        </button>
      </div>

      <!-- DataTable Nativo -->
      <DataTable 
        :data="filteredNotas"
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <StickyNote class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Sin Notas</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay notas registradas aún.</p>
            <button v-if="globalFilter" class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">Limpiar Filtros</button>
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
            <span class="text-gray-500 dark:text-gray-400 text-sm block mt-1">{{ truncate(data.contenido, 100) }}</span>
          </div>
        </template>

        <template #skeleton-titulo>
          <div class="space-y-1">
            <div class="skeleton h-4 w-40"></div>
            <div class="skeleton h-3 w-60"></div>
          </div>
        </template>

        <template #relacionado="{ data }">
          <div class="flex flex-col gap-1">
            <Tag v-if="data.equipo_numero_serie" :value="'Equipo: ' + data.equipo_numero_serie" severity="info" class="!text-xs w-fit !font-bold">
              <template #icon>
                <Monitor :size="10" class="mr-1" />
              </template>
            </Tag>
            <Tag v-if="data.mantenimiento_fecha_inicio" :value="'Mto: ' + formatDate(data.mantenimiento_fecha_inicio)" severity="warn" class="!text-xs w-fit !font-bold">
              <template #icon>
                <Settings :size="10" class="mr-1" />
              </template>
            </Tag>
            <span v-if="!data.equipo_numero_serie && !data.mantenimiento_fecha_inicio" class="text-gray-400 text-xs italic">General</span>
          </div>
        </template>

        <template #skeleton-relacionado>
          <div class="skeleton h-5 w-28 rounded-md"></div>
        </template>

        <template #fecha_registro="{ data }">
          <div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <User :size="14" class="text-primary" /> {{ data.usuario_creador || 'Sistema' }}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
              <Calendar :size="14" class="text-primary" /> {{ formatDate(data.fecha_registro) }}
            </div>
          </div>
        </template>

        <template #skeleton-fecha_registro>
          <div class="space-y-1">
            <div class="skeleton h-3 w-20"></div>
            <div class="skeleton h-3 w-28"></div>
          </div>
        </template>

        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editNota(data)" title="Editar">
              <Pencil :size="16" />
            </button>
            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="deleteNota(data)" title="Eliminar">
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
