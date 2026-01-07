<script setup>
/**
 * @fileoverview Vista principal del módulo de Equipos.
 * 
 * Esta vista proporciona una interfaz completa para la gestión del inventario de hardware.
 * Características principales:
 * - Listado paginado de equipos con DataTable.
 * - Filtrado avanzado por texto global, estado y tipo de dispositivo.
 * - Acciones directas para crear, ver detalles, editar y eliminar equipos.
 * - Feedback visual mediante Skeleton loading y Toasts.
 * 
 * @module User Interface/Views/Equipos
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EquiposService from '../services/EquiposService'
import { 
  Search, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  AlertTriangle 
} from 'lucide-vue-next'

// Componentes PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select' // Dropdown para filtro

const toast = useToast()
const equipos = ref([])
const loading = ref(true)

// Configuración de Filtros
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status_nombre: { value: null, matchMode: FilterMatchMode.EQUALS },
  nombre_tipo_equipo: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Opciones para el filtro de Estado
const statuses = ref([
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Asignado', value: 'ASIGNADO' },
    { label: 'En Mantenimiento', value: 'EN MANTENIMIENTO' },
    { label: 'Baja', value: 'BAJA' }
]);

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
]);

/**
 * Carga asíncrona de equipos desde el backend.
 * 
 * Se ejecuta al montar el componente. Incluye un delay artificial mínimo (600ms)
 * para evitar parpadeos (flickering) en la UI si la respuesta es demasiado rápida,
 * asegurando que el skeleton loader se vea fluido.
 */
const loadEquipos = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600)) // Pequeño delay para suavidad
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

// Helpers UI
const router = useRouter()

/**
 * Determina el color (severidad) del tag de estado según el valor recibido.
 * 
 * @param {string} status - Estado del equipo (ej. 'DISPONIBLE').
 * @returns {string} Clase de severidad de PrimeVue ('success', 'warn', etc.).
 */
const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('DISPONIBLE')) return 'success'
  if (s.includes('ASIGNADO')) return 'warn'
  if (s.includes('MANTENIMIENTO')) return 'contrast'
  if (s.includes('BAJA') || s.includes('DAÑADO')) return 'danger'
  return 'secondary'
}

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


const confirm = useConfirm()

/**
 * Inicia el flujo de confirmación para eliminar un equipo.
 * 
 * Muestra un diálogo modal de confirmación. Si el usuario acepta,
 * procede con la eliminación física del registro y recarga la lista.
 * 
 * @param {Object} equipo - Objeto del equipo a eliminar.
 */
const confirmDeleteEquipo = (equipo) => {
    confirm.require({
        message: `¿Estás seguro de que deseas eliminar permanentemente ${equipo.nombre_equipo}? Esta acción no se puede deshacer.`,
        header: 'Confirmar Eliminación',
        // Icono removido de propiedades directas para usar el slot o componente por defecto de confirm
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

const skeletonRows = new Array(5).fill({})
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
                 <InputText v-model="filters['global'].value" placeholder="Buscar serial, marca, modelo..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
            </div>

            <!-- Filter by Status -->
            <Select v-model="filters['status_nombre'].value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />

            <!-- Filter by Type (New) -->
            <Select v-model="filters['nombre_tipo_equipo'].value" :options="deviceTypes" optionLabel="label" optionValue="value" placeholder="Tipo" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
        </div>

        <!-- Right: New Equipment Button -->
        <button class="btn-primary w-full md:w-auto" @click="openNew">
          <Plus :size="18" />
          <span>Nuevo Equipo</span>
        </button>
      </div>

      <!-- DATATABLE -->
      <DataTable 
        :value="loading ? skeletonRows : equipos" 
        :paginator="true" 
        :rows="10" 
        dataKey="id" 
        :filters="filters" 
        :loading="false" 
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}-{last} de {totalRecords}"
        class="custom-table"
        :rowHover="true"
        :globalFilterFields="['nombre_equipo', 'numero_serie', 'marca', 'modelo', 'status_nombre']"
      >
        <template #empty>
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Search class="text-gray-400 dark:text-gray-500" :size="40" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">No se encontraron resultados</h3>
                <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta ajustar tus filtros de búsqueda o agrega un nuevo equipo al inventario.</p>
                <Button label="Limpiar Filtros" text class="mt-4 !text-primary" @click="filters['global'].value = null; filters['status_nombre'].value = null" />
            </div>
        </template>

        <!-- ID Column -->
        <Column field="id" header="ID" sortable style="width: 5%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
            </template>
        </Column>

        <!-- Serial Column -->
        <Column field="numero_serie" header="Número Serie" sortable style="width: 15%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="8rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-900 dark:text-white font-mono text-base font-bold group-hover:text-primary dark:group-hover:text-primary transition-colors">{{ data.numero_serie }}</span>
            </template>
        </Column>

        <!-- Name Column -->
        <Column field="nombre_equipo" header="Equipo/Modelo" sortable style="width: 25%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else>
                    <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.nombre_equipo }}</div>
                     <span class="text-gray-500 dark:text-gray-400 text-xs font-medium">{{ data.marca }} {{ data.modelo }}</span>
                </div>
            </template>
        </Column>

        <!-- Type Column -->
        <Column field="nombre_tipo_equipo" header="Tipo" sortable style="width: 15%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <span v-else class="text-gray-800 dark:text-gray-200 text-sm font-bold bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">{{ data.nombre_tipo_equipo }}</span>
            </template>
        </Column>

        <!-- Location Column -->
        <Column field="nombre_sucursal_actual" header="Ubicación" sortable style="width: 20%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="12rem" class="!bg-gray-200 dark:!bg-dark-border" />
                <div v-else class="flex flex-col">
                    <span class="text-gray-900 dark:text-white text-sm font-bold">{{ data.nombre_sucursal_actual }}</span>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-0.5">{{ data.nombre_empresa }}</span>
                </div>
            </template>
        </Column>

        <!-- Status Column -->
        <Column field="status_nombre" header="Estado" sortable style="width: 10%">
            <template #body="{ data }">
                <Skeleton v-if="loading" width="5rem" height="1.5rem" borderRadius="4px" class="!bg-gray-200 dark:!bg-dark-border" />
                <Tag v-else :value="data.status_nombre" :severity="getSeverity(data.status_nombre)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
            </template>
        </Column>


        <!-- Actions Column -->
        <Column header="Acciones" style="width: 12%; text-align: right">
            <template #body="{ data }">
                <div v-if="loading" class="flex gap-2 justify-start">
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                    <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                </div>
                <div v-else class="flex gap-1 justify-end">
                    <!-- View Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all" @click="viewEquipo(data)" title="Ver detalles">
                        <Eye :size="16" />
                    </button>
                    <!-- Edit Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editEquipo(data)" title="Editar">
                        <Pencil :size="16" />
                    </button>
                    <!-- Delete Button -->
                    <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="confirmDeleteEquipo(data)" title="Eliminar">
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
/* Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 
   CUSTOM DATATABLE STYLING 
   Moved to main.css for global usage
*/


</style>

