<script setup>
/**
 * @fileoverview Componente de tabla de datos nativo y reutilizable.
 * 
 * Reemplaza PrimeVue DataTable con una implementación HTML nativa que ofrece:
 * - Paginación integrada con navegación completa
 * - Selector de filas por página (5, 10, 20, 50, Todos)
 * - Ordenamiento por columnas (sorting)
 * - Skeleton loading durante carga
 * - Diseño responsive y premium con colores teal
 * - Compatible con dark mode
 * - Slot de contenido vacío personalizable
 * 
 * @module Components/UI/DataTable
 * 
 * @example
 * <DataTable
 *   :data="items"
 *   :columns="columns"
 *   :loading="isLoading"
 *   :rows="10"
 *   :rows-per-page-options="[5, 10, 20, 50]"
 *   row-key="id"
 * >
 *   <template #empty>
 *     <p>No hay datos</p>
 *   </template>
 * </DataTable>
 */
import { ref, computed, watch } from 'vue'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'
import Select from 'primevue/select'

/**
 * @typedef {Object} Column
 * @property {string} field - Nombre del campo en el objeto de datos
 * @property {string} header - Texto del encabezado de columna
 * @property {boolean} [sortable] - Si la columna es ordenable
 * @property {string} [width] - Ancho de la columna (ej: '10%', '150px')
 * @property {string} [align] - Alineación del contenido ('left', 'center', 'right')
 */

const props = defineProps({
  /** Arreglo de datos a mostrar en la tabla */
  data: {
    type: Array,
    default: () => []
  },
  /** 
   * Definición de columnas 
   * @type {Column[]}
   */
  columns: {
    type: Array,
    required: true
  },
  /** Estado de carga para mostrar skeletons */
  loading: {
    type: Boolean,
    default: false
  },
  /** Número de filas por página */
  rows: {
    type: Number,
    default: 10
  },
  /** Campo único identificador de cada fila */
  rowKey: {
    type: String,
    default: 'id'
  },
  /** Mostrar paginador */
  paginator: {
    type: Boolean,
    default: true
  },
  /** Cantidad de filas skeleton durante loading */
  skeletonRows: {
    type: Number,
    default: 5
  },
  /** Opciones de filas por página */
  rowsPerPageOptions: {
    type: Array,
    default: () => [5, 10, 20, 50]
  }
})

// Estado interno
const currentPage = ref(1)
const sortField = ref(null)
const sortOrder = ref(1) // 1 = ASC, -1 = DESC
const rowsPerPage = ref(props.rows)

// Reset página cuando cambian los datos
watch(() => props.data, () => {
  currentPage.value = 1
})

/**
 * Datos ordenados según el campo y orden actual.
 */
const sortedData = computed(() => {
  if (!sortField.value || !props.data.length) return props.data
  
  return [...props.data].sort((a, b) => {
    const valA = a[sortField.value]
    const valB = b[sortField.value]
    
    // Handle nulls
    if (valA == null) return 1
    if (valB == null) return -1
    
    // Compare
    if (typeof valA === 'string') {
      return sortOrder.value * valA.localeCompare(valB)
    }
    return sortOrder.value * (valA - valB)
  })
})

/**
 * Datos paginados para la página actual.
 */
const paginatedData = computed(() => {
  if (!props.paginator) return sortedData.value
  if (rowsPerPage.value === -1) return sortedData.value // Mostrar todos
  
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end = start + rowsPerPage.value
  return sortedData.value.slice(start, end)
})

/** Total de páginas */
const totalPages = computed(() => {
  if (rowsPerPage.value === -1) return 1 // Si se muestran todos, solo 1 página
  return Math.ceil(props.data.length / rowsPerPage.value)
})

/** Rango de registros mostrados (ej: "1-10 de 50") */
const pageInfo = computed(() => {
  const total = props.data.length
  if (total === 0) return '0 de 0'
  if (rowsPerPage.value === -1) return `Todos (${total})`
  
  const start = (currentPage.value - 1) * rowsPerPage.value + 1
  const end = Math.min(currentPage.value * rowsPerPage.value, total)
  return `${start}-${end} de ${total}`
})

/** Páginas visibles en el paginador */
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  const pages = []
  
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i)
    }
  }
  
  // Insert ellipsis
  const withEllipsis = []
  let prev = 0
  for (const page of pages) {
    if (page - prev > 1) {
      withEllipsis.push('...')
    }
    withEllipsis.push(page)
    prev = page
  }
  
  return withEllipsis
})

/**
 * Cambia el ordenamiento de una columna.
 * @param {Column} column - Columna a ordenar
 */
const toggleSort = (column) => {
  if (!column.sortable) return
  
  if (sortField.value === column.field) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortField.value = column.field
    sortOrder.value = 1
  }
}

/**
 * Obtiene el icono de ordenamiento para una columna.
 * @param {Column} column
 */
const getSortIcon = (column) => {
  if (!column.sortable) return null
  if (sortField.value !== column.field) return ArrowUpDown
  return sortOrder.value === 1 ? ArrowUp : ArrowDown
}

/** Navegar a página específica */
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

/** Cambiar filas por página */
const changeRowsPerPage = (rows) => {
  rowsPerPage.value = rows
  currentPage.value = 1 // Reset a primera página
}

/** Opciones para el selector */
const rowsOptions = computed(() => {
  return [
    ...props.rowsPerPageOptions.map(opt => ({ label: String(opt), value: opt })),
    { label: 'Todos', value: -1 }
  ]
})
</script>

<template>
  <div class="data-table-wrapper">
    <!-- Rows per page selector (TOP) -->
    <div v-if="paginator && !loading && data.length > 0" class="data-table-rows-selector">
      <label class="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Mostrar:
      </label>
      <Select
        v-model="rowsPerPage"
        :options="rowsOptions"
        optionLabel="label"
        optionValue="value"
        @change="changeRowsPerPage(rowsPerPage)"
        class="!w-24 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white"
      />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="data-table">
        <!-- Header -->
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.field"
              :style="{ width: col.width }"
              :class="[
                'data-table-th',
                col.sortable ? 'cursor-pointer select-none hover:text-primary' : '',
                { 'text-left': col.align === 'left', 'text-right': col.align === 'right', 'text-center': !col.align || col.align === 'center' }
              ]"
              @click="toggleSort(col)"
            >
              <div class="flex items-center justify-center gap-1.5">
                <span>{{ col.header }}</span>
                <component 
                  v-if="col.sortable"
                  :is="getSortIcon(col)" 
                  :size="14" 
                  :class="[
                    'transition-colors',
                    sortField === col.field ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                  ]"
                />
              </div>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody>
          <!-- Loading State -->
          <template v-if="loading">
            <tr v-for="n in skeletonRows" :key="'skeleton-' + n" class="data-table-row">
              <td v-for="col in columns" :key="col.field" class="data-table-td">
                <slot :name="'skeleton-' + col.field">
                  <div class="skeleton h-4 w-3/4 mx-auto"></div>
                </slot>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <template v-else-if="!data.length">
            <tr>
              <td :colspan="columns.length" class="data-table-td">
                <slot name="empty">
                  <div class="flex flex-col items-center justify-center py-12 text-center">
                    <p class="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
                  </div>
                </slot>
              </td>
            </tr>
          </template>

          <!-- Data Rows -->
          <template v-else>
            <tr 
              v-for="(row, index) in paginatedData" 
              :key="row[rowKey] || index"
              class="data-table-row"
            >
              <td 
                v-for="col in columns" 
                :key="col.field"
                class="data-table-td"
                :class="{ 'text-left': col.align === 'left', 'text-right': col.align === 'right', 'text-center': !col.align || col.align === 'center' }"
              >
                <!-- Named slot for custom cell content -->
                <slot :name="col.field" :data="row" :value="row[col.field]">
                  {{ row[col.field] }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Paginator (BOTTOM) -->
    <div v-if="paginator && !loading && data.length > 0" class="data-table-paginator">
      <!-- Page info -->
      <span class="paginator-info">
        {{ pageInfo }}
      </span>

      <!-- Page navigation -->
      <div class="paginator-nav">
        <!-- First Page -->
        <button 
          class="paginator-btn"
          :disabled="currentPage === 1 || rowsPerPage === -1"
          @click="goToPage(1)"
          title="Primera página"
        >
          <ChevronsLeft :size="16" />
        </button>

        <!-- Previous Page -->
        <button 
          class="paginator-btn"
          :disabled="currentPage === 1 || rowsPerPage === -1"
          @click="goToPage(currentPage - 1)"
          title="Página anterior"
        >
          <ChevronLeft :size="16" />
        </button>

        <!-- Page Numbers -->
        <template v-if="rowsPerPage !== -1">
          <template v-for="page in visiblePages" :key="page">
            <span v-if="page === '...'" class="px-2 text-gray-400 dark:text-gray-500">...</span>
            <button 
              v-else
              class="paginator-btn paginator-btn-number"
              :class="{ 'paginator-btn-active': page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
        </template>

        <!-- Next Page -->
        <button 
          class="paginator-btn"
          :disabled="currentPage === totalPages || rowsPerPage === -1"
          @click="goToPage(currentPage + 1)"
          title="Página siguiente"
        >
          <ChevronRight :size="16" />
        </button>

        <!-- Last Page -->
        <button 
          class="paginator-btn"
          :disabled="currentPage === totalPages || rowsPerPage === -1"
          @click="goToPage(totalPages)"
          title="Última página"
        >
          <ChevronsRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Wrapper */
.data-table-wrapper {
  @apply w-full;
}

/* Table Base */
.data-table {
  @apply w-full border-collapse;
}

/* Header */
.data-table-th {
  @apply px-3 py-3;
  @apply text-[11px] font-bold uppercase tracking-wider;
  @apply text-gray-400 dark:text-gray-500;
  @apply border-b border-gray-200/50 dark:border-white/5;
  @apply bg-transparent;
  @apply transition-colors duration-200;
}

/* Rows */
.data-table-row {
  @apply transition-colors duration-200;
}

.data-table-row:hover {
  @apply bg-primary/5;
}

.data-table-row:not(:last-child) .data-table-td {
  @apply border-b border-gray-100 dark:border-white/5;
}

/* Cells */
.data-table-td {
  @apply px-3 py-4;
  @apply text-sm;
}

/* Rows per page selector (TOP) */
.data-table-rows-selector {
  @apply flex items-center gap-3 mb-4;
  @apply pb-3 border-b border-gray-200/50 dark:border-white/5;
}

/* Paginator (BOTTOM) */
.data-table-paginator {
  @apply flex flex-col sm:flex-row items-center justify-between gap-3;
  @apply mt-4 pt-4;
  @apply border-t border-gray-200/50 dark:border-white/5;
}

/* Page info */
.paginator-info {
  @apply text-sm text-gray-500 dark:text-gray-400 font-medium;
  @apply order-2 sm:order-1;
}

/* Page navigation */
.paginator-nav {
  @apply flex items-center gap-1;
  @apply order-1 sm:order-2;
}

.paginator-btn {
  @apply w-9 h-9 rounded-lg;
  @apply flex items-center justify-center;
  @apply text-sm font-medium;
  @apply text-gray-600 dark:text-gray-400;
  @apply bg-transparent;
  @apply hover:bg-gray-100 dark:hover:bg-white/5;
  @apply disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent;
  @apply transition-all duration-200;
}

/* Page number buttons get special styling */
.paginator-btn-number {
  @apply bg-gray-50 dark:bg-white/5;
  @apply border border-gray-200 dark:border-white/10;
  @apply hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200;
  @apply dark:hover:bg-teal-500/10 dark:hover:text-teal-400 dark:hover:border-teal-500/20;
}

.paginator-btn-active {
  @apply bg-teal-500 dark:bg-teal-500;
  @apply text-white dark:text-white;
  @apply border-teal-500 dark:border-teal-500;
  @apply shadow-sm shadow-teal-500/20;
}

.paginator-btn-active:hover {
  @apply bg-teal-600 dark:bg-teal-600;
  @apply border-teal-600 dark:border-teal-600;
}
</style>

