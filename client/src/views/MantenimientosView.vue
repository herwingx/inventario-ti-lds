<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import MaintenanceService from '../services/MaintenanceService'
import { 
  Calendar, CheckCircle, Clock, AlertTriangle, Plus, Filter, 
  Archive, Wrench, X 
} from 'lucide-vue-next'
import { useSwal } from '../composables/useSwal'

// Componentes PrimeVue
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const router = useRouter()
const { success, error, confirmSuccess } = useSwal()

// Estado
const mantenimientos = ref([])
const loading = ref(true)

// Opciones para Selects PrimeVue
const statusOptions = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'En Progreso', value: 'EN_PROGRESO' },
  { label: 'Completado', value: 'COMPLETADO' },
  { label: 'Vencido', value: 'VENCIDO' }
]

const typeOptions = [
  { label: 'Preventivo', value: 'PREVENTIVO' },
  { label: 'Correctivo', value: 'CORRECTIVO' }
]

// Filtros
const filters = ref({
  estatus: null,
  tipo: null,
  proximos: false
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const params = { 
      estatus: filters.value.estatus?.value, 
      tipo: filters.value.tipo?.value,
      proximos: filters.value.proximos
    }
    Object.keys(params).forEach(key => !params[key] && delete params[key])
    
    mantenimientos.value = await MaintenanceService.getAll(params)
  } catch (err) {
    console.error(err)
    error('Error al cargar mantenimientos')
  } finally {
    loading.value = false
  }
}

// Watchers
watch(filters, () => {
  loadData()
}, { deep: true })

// Helpers visuales
const getStatusData = (status) => {
  const map = {
    'PENDIENTE': { severity: 'warning', icon: Clock, label: 'Pendiente' },
    'EN_PROGRESO': { severity: 'info', icon: Wrench, label: 'En Progreso' },
    'COMPLETADO': { severity: 'success', icon: CheckCircle, label: 'Completado' },
    'CANCELADO': { severity: 'secondary', icon: X, label: 'Cancelado' },
    'VENCIDO': { severity: 'danger', icon: AlertTriangle, label: 'Vencido' }
  }
  return map[status] || map['PENDIENTE'] // Fallback seguro
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  })
}

// Acciones
const openNew = () => {
  router.push({ name: 'mantenimientos-nuevo' })
}

const markCompleted = async (item) => {
  const result = await confirmSuccess({
    title: '¿Marcar como completado?',
    text: "Se registrará la fecha actual y costo del servicio.",
    confirmButtonText: 'Sí, completar'
  })

  if (result.isConfirmed) {
    try {
      await MaintenanceService.update(item.id, { 
        estatus: 'COMPLETADO',
        fecha_fin: new Date() // Aseguramos enviar fecha_fin
      })
      success('Marcado como completado')
      loadData()
    } catch (err) {
      error('Error al actualizar')
    }
  }
}
</script>

<template>
  <div class="animate-fade-in-up">
    <!-- Contenedor Principal -->
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Filtros (Estilo Unificado con Correos) -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <!-- Izquierda: Search + Filters -->
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <!-- TODO: Implementar búsqueda por texto en API si es necesario, por ahora es visual -->
          <!-- <div class="relative w-full sm:w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText v-model="filters.search" placeholder="Buscar..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
          </div> -->

          <Select 
            v-model="filters.estatus" 
            :options="statusOptions" 
            optionLabel="label" 
            placeholder="Estado" 
            showClear
            class="w-full sm:w-48 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" 
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <Tag 
                  :value="slotProps.value.label" 
                  :severity="getStatusData(slotProps.value.value).severity"
                  class="!text-xs !font-bold !px-2 !py-0.5"
                />
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center">
                <Tag 
                  :value="slotProps.option.label" 
                  :severity="getStatusData(slotProps.option.value).severity"
                  class="!text-xs !font-bold !px-2 !py-0.5"
                />
              </div>
            </template>
          </Select>

          <Select 
            v-model="filters.tipo" 
            :options="typeOptions" 
            optionLabel="label" 
            placeholder="Tipo" 
            showClear
            class="w-full sm:w-48 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" 
          />
          
          <div class="flex items-center h-full"> 
             <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border h-full">
              <input type="checkbox" v-model="filters.proximos" class="rounded text-primary focus:ring-primary border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card w-4 h-4">
              <span class="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">Próximos (30d)</span>
            </label>
          </div>
        </div>

        <!-- Derecha: Botón -->
        <button @click="openNew" class="btn-primary w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all">
          <Plus :size="18" />
          <span class="font-bold">Nuevo Mantenimiento</span>
        </button>
      </div>

      <!-- Lista de Mantenimientos -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="mantenimientos.length === 0" class="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-dark-bg rounded-xl border border-dashed border-gray-300 dark:border-dark-border">
        <div class="w-16 h-16 bg-gray-100 dark:bg-dark-card rounded-full flex items-center justify-center mb-4">
          <Archive class="text-gray-400 dark:text-gray-500" :size="32" />
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">No hay mantenimientos</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Intenta cambiar los filtros o programa uno nuevo.</p>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div 
          v-for="item in mantenimientos" 
          :key="item.id"
          class="bg-white dark:bg-dark-card rounded-xl shadow-sm hover:shadow-lg hover:border-primary/50 transition-all p-5 border border-gray-200 dark:border-dark-border relative group duration-300"
        >
          <!-- Badge Estado -->
          <div class="flex justify-between items-start mb-3">
            <Tag 
              :value="getStatusData(item.estatus).label" 
              :severity="getStatusData(item.estatus).severity" 
              class="!text-xs !font-bold px-2 py-1 !rounded-md"
            >
              <template #icon>
                <component :is="getStatusData(item.estatus).icon" :size="12" class="mr-1" />
              </template>
            </Tag>
            <span class="text-xs font-mono font-bold text-gray-400 dark:text-gray-500">#{{ item.id }}</span>
          </div>

          <h3 class="font-bold text-gray-900 dark:text-white mb-1 text-lg line-clamp-1" :title="item.titulo">{{ item.titulo }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-10">{{ item.descripcion }}</p>

          <!-- Equipo -->
          <div class="bg-gray-50 dark:bg-dark-bg rounded-lg p-3 mb-4 flex items-center gap-3 border border-gray-100 dark:border-dark-border">
            <div class="p-2 bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-100 dark:border-dark-border">
              <Wrench :size="18" class="text-gray-500 dark:text-gray-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                {{ item.marca }} {{ item.modelo }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-mono truncate tracking-wide max-w-[150px]">{{ item.numero_serie }}</p>
            </div>
          </div>

          <!-- Meta -->
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-dark-border">
            <div class="flex items-center gap-1.5 font-medium">
              <Calendar :size="14" />
              <span :class="{'text-red-500 dark:text-red-400 font-bold': item.estatus === 'PENDIENTE' && new Date(item.fecha_programada) < new Date()}">
                {{ formatDate(item.fecha_programada) }}
              </span>
            </div>
          </div>

          <!-- Acciones Hover -->
          <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button v-if="item.estatus === 'PENDIENTE'" @click="markCompleted(item)" class="bg-white dark:bg-dark-bg p-2 rounded-lg shadow-md text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-dark-border transition-colors" title="Completar">
              <CheckCircle :size="18" />
            </button>
          </div>
        </div>
      </div>
    
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
