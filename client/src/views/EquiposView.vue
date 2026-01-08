<script setup>
/**
 * @fileoverview Vista principal del módulo de Equipos.
 * 
 * Esta vista proporciona una interfaz completa para la gestión del inventario de hardware.
 * Características principales:
 * - Listado paginado de equipos con DataTable nativo.
 * - Filtrado avanzado por texto global, estado y tipo de dispositivo.
 * - Acciones directas para crear, ver detalles, editar y eliminar equipos.
 * - Feedback visual mediante Skeleton loading y Toasts.
 * 
 * @module User Interface/Views/Equipos
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EquiposService from '../services/EquiposService'
import DataTable from '../components/ui/DataTable.vue'
import { 
  Search, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2
} from 'lucide-vue-next'

// Componentes PrimeVue (solo los necesarios)
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const toast = useToast()
const router = useRouter()
const confirm = useConfirm()

// Data
const equipos = ref([])
const loading = ref(true)

// Configuración de Filtros
const globalFilter = ref('')
const statusFilter = ref(null)
const typeFilter = ref(null)

// Opciones para el filtro de Estado
const statuses = ref([
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Asignado', value: 'ASIGNADO' },
  { label: 'En Mantenimiento', value: 'EN MANTENIMIENTO' },
  { label: 'Baja', value: 'BAJA' }
])

// Opciones para el filtro de Tipo
const deviceTypes = ref([
  { label: 'Laptop', value: 'LAPTOP' },
  { label: 'Computadora', value: 'COMPUTADORA' },
  { label: 'Monitor', value: 'MONITOR' },
  { label: 'Impresora', value: 'IMPRESORA' },
  { label: 'Teclado', value: 'TECLADO' },
  { label: 'Mouse', value: 'MOUSE' },
  { label: 'Lector', value: 'LECTOR DE BARRAS' },
  { label: 'Teléfono', value: 'TELEFONO IP' },
  { label: 'Tablet', value: 'TABLET' }
])

// Definición de columnas para DataTable
const columns = [
  { field: 'id', header: 'ID', sortable: true, width: '5%' },
  { field: 'numero_serie', header: 'Número Serie', sortable: true, width: '15%' },
  { field: 'nombre_equipo', header: 'Equipo/Modelo', sortable: true, width: '25%' },
  { field: 'nombre_tipo_equipo', header: 'Tipo', sortable: true, width: '12%' },
  { field: 'nombre_sucursal_actual', header: 'Ubicación', sortable: true, width: '20%' },
  { field: 'status_nombre', header: 'Estado', sortable: true, width: '10%' },
  { field: 'actions', header: 'Acciones', sortable: false, width: '13%', align: 'right' }
]

/**
 * Datos filtrados según los criterios de búsqueda.
 */
const filteredEquipos = computed(() => {
  let result = equipos.value

  // Filtro global (texto)
  if (globalFilter.value) {
    const search = globalFilter.value.toLowerCase()
    result = result.filter(e => 
      e.nombre_equipo?.toLowerCase().includes(search) ||
      e.numero_serie?.toLowerCase().includes(search) ||
      e.marca?.toLowerCase().includes(search) ||
      e.modelo?.toLowerCase().includes(search) ||
      e.status_nombre?.toLowerCase().includes(search)
    )
  }

  // Filtro por estado
  if (statusFilter.value) {
    result = result.filter(e => e.status_nombre?.toUpperCase() === statusFilter.value)
  }

  // Filtro por tipo
  if (typeFilter.value) {
    result = result.filter(e => e.nombre_tipo_equipo?.toUpperCase() === typeFilter.value)
  }

  return result
})

/**
 * Carga asíncrona de equipos desde el backend.
 */
const loadEquipos = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  try {
    equipos.value = await EquiposService.getAll()
  } catch (error) {
    console.error('Error al cargar equipos:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los equipos', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEquipos()
})

import { getStatusSeverity } from '../utils/status'

/**
 * Determina el color (severidad) del tag de estado.
 * Usa la utilidad centralizada.
 */
const getSeverity = getStatusSeverity

/** Redirige a la vista de creación de nuevo equipo. */
const openNew = () => {
  router.push({ name: 'equipos-nuevo' })
}

/** Redirige a la vista de detalles de un equipo. */
const viewEquipo = (equipo) => {
  router.push({ name: 'equipos-detalle', params: { id: equipo.id } })
}

/** Redirige a la vista de edición de un equipo. */
const editEquipo = (equipo) => {
  router.push({ name: 'equipos-editar', params: { id: equipo.id } })
}

/**
 * Inicia el flujo de confirmación para eliminar un equipo.
 * @param {Object} equipo - Objeto del equipo a eliminar.
 */
const confirmDeleteEquipo = (equipo) => {
  confirm.require({
    message: `¿Estás seguro de que deseas eliminar permanentemente ${equipo.nombre_equipo}? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar Equipo',
    rejectClass: 'btn-secondary',
    acceptClass: 'btn-danger ml-2',
    accept: async () => {
      try {
        await EquiposService.delete(equipo.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: `Equipo ${equipo.nombre_equipo} eliminado correctamente`, life: 3000 })
        loadEquipos()
      } catch (error) {
        console.error('Error al eliminar equipo:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el equipo', life: 3000 })
      }
    }
  })
}

/** Limpiar todos los filtros */
const clearFilters = () => {
  globalFilter.value = ''
  statusFilter.value = null
  typeFilter.value = null
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
      
      <!-- Toolbar: Filters, Search & Actions -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <!-- Left: Search & Filters -->
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <!-- Search Input (Primary) -->
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
            <InputText 
              v-model="globalFilter" 
              placeholder="Buscar serial, marca, modelo..." 
              class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" 
            />
          </div>

          <!-- Filter by Status -->
          <Select 
            v-model="statusFilter" 
            :options="statuses" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Estado" 
            showClear 
            class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" 
          />

          <!-- Filter by Type -->
          <Select 
            v-model="typeFilter" 
            :options="deviceTypes" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Tipo" 
            showClear 
            class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" 
          />
        </div>

        <!-- Right: New Equipment Button -->
        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nuevo Equipo</span>
        </button>
      </div>

      <!-- DATATABLE NATIVO -->
      <DataTable 
        :data="filteredEquipos" 
        :columns="columns"
        :loading="loading"
        :rows="10"
        row-key="id"
      >
        <!-- Empty State -->
        <template #empty>
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
              <Search class="text-gray-400 dark:text-gray-500" :size="40" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros de búsqueda o agrega un nuevo equipo al inventario.</p>
            <button class="mt-4 text-primary font-medium hover:underline" @click="clearFilters">
              Limpiar Filtros
            </button>
          </div>
        </template>

        <!-- ID Column -->
        <template #id="{ data }">
          <span class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
        </template>

        <!-- Skeleton for ID -->
        <template #skeleton-id>
          <div class="skeleton h-4 w-8"></div>
        </template>

        <!-- Serial Number Column -->
        <template #numero_serie="{ data }">
          <span class="text-gray-900 dark:text-white font-mono text-base font-bold">{{ data.numero_serie }}</span>
        </template>

        <template #skeleton-numero_serie>
          <div class="skeleton h-4 w-24"></div>
        </template>

        <!-- Equipment Name Column -->
        <template #nombre_equipo="{ data }">
          <div>
            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.nombre_equipo }}</div>
            <span class="text-gray-500 dark:text-gray-400 text-xs font-medium">{{ data.marca }} {{ data.modelo }}</span>
          </div>
        </template>

        <template #skeleton-nombre_equipo>
          <div class="space-y-1">
            <div class="skeleton h-4 w-32"></div>
            <div class="skeleton h-3 w-20"></div>
          </div>
        </template>

        <!-- Type Column -->
        <template #nombre_tipo_equipo="{ data }">
          <span class="text-gray-800 dark:text-gray-200 text-sm font-bold bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">
            {{ data.nombre_tipo_equipo }}
          </span>
        </template>

        <template #skeleton-nombre_tipo_equipo>
          <div class="skeleton h-6 w-20 rounded-md"></div>
        </template>

        <!-- Location Column -->
        <template #nombre_sucursal_actual="{ data }">
          <div class="flex flex-col">
            <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.nombre_sucursal_actual }}</span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5">{{ data.nombre_empresa }}</span>
          </div>
        </template>

        <template #skeleton-nombre_sucursal_actual>
          <div class="space-y-1">
            <div class="skeleton h-4 w-28"></div>
            <div class="skeleton h-3 w-16"></div>
          </div>
        </template>

        <!-- Status Column -->
        <template #status_nombre="{ data }">
          <Tag 
            :value="data.status_nombre" 
            :severity="getSeverity(data.status_nombre)" 
            class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" 
          />
        </template>

        <template #skeleton-status_nombre>
          <div class="skeleton h-6 w-20 rounded-md"></div>
        </template>

        <!-- Actions Column -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-end">
            <!-- View Button -->
            <button 
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" 
              @click="viewEquipo(data)" 
              title="Ver detalles"
            >
              <Eye :size="16" />
            </button>
            <!-- Edit Button -->
            <button 
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" 
              @click="editEquipo(data)" 
              title="Editar"
            >
              <Pencil :size="16" />
            </button>
            <!-- Delete Button -->
            <button 
              class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" 
              @click="confirmDeleteEquipo(data)" 
              title="Eliminar"
            >
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
/* Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
