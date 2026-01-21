<script setup>
/**
 * @fileoverview Formulario de Mantenimientos (Fase 2B).
 * Incluye sección de evidencias con subida de archivos.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MaintenanceService from '../services/MaintenanceService'
import { useSwal } from '../composables/useSwal'
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  FileText,
  Eye
} from 'lucide-vue-next'

// Componentes PrimeVue
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Fluid from 'primevue/fluid'
import FileUpload from 'primevue/fileupload'

const router = useRouter()
const route = useRoute()
const { success, error, confirmWarning, confirmDanger } = useSwal()

const isEditMode = ref(false)
const loading = ref(false)
const loadingEvidencias = ref(false)
const uploadingEvidencia = ref(false)

const form = ref({
  titulo: '',
  id_equipo: '',
  fecha_programada: new Date(),
  tipo: 'PREVENTIVO',
  descripcion: '',
  id_tecnico_asignado: ''
})

// Estado para evidencias
const evidencias = ref([])
const selectedTipoEvidencia = ref({ label: 'Diagnóstico', value: 'DIAGNOSTICO' })

const typeOptions = [
  { label: 'Preventivo', value: 'PREVENTIVO' },
  { label: 'Correctivo', value: 'CORRECTIVO' }
]
const selectedType = ref({ label: 'Preventivo', value: 'PREVENTIVO' })

const tipoEvidenciaOptions = [
  { label: 'Antes', value: 'ANTES' },
  { label: 'Después', value: 'DESPUES' },
  { label: 'Diagnóstico', value: 'DIAGNOSTICO' }
]

// Computed para URL base de archivos
const baseUrl = computed(() => import.meta.env.VITE_API_URL || 'http://localhost:3000')

onMounted(async () => {
  if (route.params.id) {
    isEditMode.value = true
    await loadData(route.params.id)
    await loadEvidencias(route.params.id)
  }
})

const loadData = async (id) => {
  try {
    const data = await MaintenanceService.getById(id)
    form.value = {
      ...data,
      fecha_programada: new Date(data.fecha_programada)
    }
    selectedType.value = typeOptions.find(t => t.value === data.tipo) || typeOptions[0]
  } catch (err) {
    error('Error al cargar datos')
    router.push({ name: 'mantenimientos' })
  }
}

const loadEvidencias = async (id) => {
  loadingEvidencias.value = true
  try {
    evidencias.value = await MaintenanceService.getEvidencias(id)
  } catch (err) {
    console.warn('No se pudieron cargar evidencias:', err)
    evidencias.value = []
  } finally {
    loadingEvidencias.value = false
  }
}

const save = async () => {
  loading.value = true
  try {
    const payload = {
      ...form.value,
      tipo: selectedType.value.value
    }

    if (isEditMode.value) {
      await MaintenanceService.update(route.params.id, payload)
      success('Mantenimiento actualizado correctamente')
    } else {
      await MaintenanceService.create(payload)
      success('Mantenimiento programado correctamente')
    }
    router.push({ name: 'mantenimientos' })
  } catch (err) {
    console.error(err)
    error('Error al guardar mantenimiento')
  } finally {
    loading.value = false
  }
}

// Funciones de evidencias
const onUploadEvidencia = async (event) => {
  if (!route.params.id) return
  
  uploadingEvidencia.value = true
  try {
    const file = event.files[0]
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tipo', selectedTipoEvidencia.value.value)
    formData.append('descripcion', '')

    await MaintenanceService.uploadEvidencia(route.params.id, formData)
    success('Evidencia subida correctamente')
    await loadEvidencias(route.params.id)
  } catch (err) {
    console.error(err)
    error('Error al subir evidencia')
  } finally {
    uploadingEvidencia.value = false
  }
}

const deleteEvidencia = async (evidencia) => {
  const result = await confirmDanger({
    title: 'Eliminar Evidencia',
    text: '¿Estás seguro de eliminar esta evidencia? Esta acción no se puede deshacer.',
    confirmButtonText: 'Eliminar'
  })
  
  if (!result.isConfirmed) return
  
  try {
    await MaintenanceService.deleteEvidencia(route.params.id, evidencia.id)
    success('Evidencia eliminada')
    await loadEvidencias(route.params.id)
  } catch (err) {
    error('Error al eliminar evidencia')
  }
}

const getEvidenciaUrl = (evidencia) => {
  return `${baseUrl.value}${evidencia.url_archivo}`
}

const isImage = (evidencia) => {
  return evidencia.mime_type?.startsWith('image/')
}

const getTipoLabel = (tipo) => {
  const labels = {
    'ANTES': 'Antes',
    'DESPUES': 'Después',
    'DIAGNOSTICO': 'Diagnóstico'
  }
  return labels[tipo] || tipo
}

const getTipoBadgeClass = (tipo) => {
  const classes = {
    'ANTES': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'DESPUES': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'DIAGNOSTICO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[tipo] || 'bg-gray-100 text-gray-800'
}

const goBack = async () => {
  if (form.value.titulo) {
     const result = await confirmWarning({
        title: 'Confirmar Salida',
        text: '¿Está seguro de que desea salir? Los cambios no guardados se perderán.',
        confirmButtonText: 'Salir sin Guardar',
        cancelButtonText: 'Continuar Editando'
    })
    if (!result.isConfirmed) return
  }
  router.push({ name: 'mantenimientos' })
}
</script>

<template>
  <div class="animate-fade-in-up max-w-4xl mx-auto space-y-6">
    
    <!-- Card Formulario Principal -->
    <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border p-8 transition-colors duration-300">
      
      <!-- Header Interno -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
          <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ isEditMode ? 'Editar Mantenimiento' : 'Programar Mantenimiento' }}</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Información detallada del servicio</p>
          </div>
      </div>

      <form @submit.prevent="save">
        <Fluid>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-8">
            
            <!-- Título -->
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Título del Mantenimiento <span class="text-red-500">*</span></label>
              <InputText v-model="form.titulo" class="!bg-gray-50 dark:!bg-dark-bg" placeholder="Ej: Mantenimiento Preventivo Trimestral" required />
            </div>

            <!-- Tipo -->
            <div class="md:col-span-1">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Servicio <span class="text-red-500">*</span></label>
              <Select v-model="selectedType" :options="typeOptions" optionLabel="label" class="!bg-gray-50 dark:!bg-dark-bg w-full" />
            </div>

            <!-- Fecha -->
            <div class="md:col-span-1">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fecha Programada <span class="text-red-500">*</span></label>
              <div class="relative">
                 <CalendarIcon class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                 <DatePicker v-model="form.fecha_programada" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD" class="w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg !pr-10 w-full'" />
              </div>
            </div>

            <!-- Equipo ID -->
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ID del Equipo <span class="text-red-500">*</span></label>
              <InputText v-model="form.id_equipo" type="number" class="!bg-gray-50 dark:!bg-dark-bg font-mono" placeholder="ID numérico del equipo" required />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa el ID del equipo manualmente (Fase 1).</p>
            </div>

            <!-- Descripción -->
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción Detallada</label>
              <Textarea v-model="form.descripcion" rows="5" class="!bg-gray-50 dark:!bg-dark-bg w-full" placeholder="Describe las tareas a realizar..." autoResize />
            </div>

          </div>

          <!-- Botones -->
           <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
              <button type="button" @click="goBack" class="btn-secondary">
                  <X :size="18" />
                  Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="loading">
                  <Check v-if="!loading" :size="18" />
                  <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                  <span>{{ isEditMode ? 'Actualizar' : 'Guardar' }}</span>
              </button>
          </div>
        </Fluid>
      </form>
    </div>

    <!-- Card Evidencias (Solo en modo edición) -->
    <div v-if="isEditMode" class="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border p-8 transition-colors duration-300">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon :size="22" class="text-primary-500" />
            Evidencias Fotográficas
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Adjunta fotos del estado antes, después o diagnósticos del mantenimiento
          </p>
        </div>
      </div>

      <!-- Zona de subida -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-border">
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Evidencia</label>
            <Select 
              v-model="selectedTipoEvidencia" 
              :options="tipoEvidenciaOptions" 
              optionLabel="label" 
              class="w-full md:w-48" 
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subir Archivo</label>
            <FileUpload 
              mode="basic" 
              name="archivo"
              accept="image/*,application/pdf"
              :maxFileSize="5000000"
              :auto="true"
              chooseLabel="Seleccionar Archivo"
              :disabled="uploadingEvidencia"
              @select="onUploadEvidencia"
              class="w-full"
            />
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
          📎 Formatos permitidos: JPG, PNG, WEBP, PDF. Tamaño máximo: 5MB
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loadingEvidencias" class="flex justify-center py-8">
        <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
      </div>

      <!-- Lista de evidencias vacía -->
      <div v-else-if="evidencias.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
        <ImageIcon :size="48" class="mx-auto mb-3 opacity-30" />
        <p>No hay evidencias adjuntas aún</p>
        <p class="text-sm">Sube fotos del estado del equipo</p>
      </div>

      <!-- Grid de evidencias -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="ev in evidencias" 
          :key="ev.id"
          class="relative group bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border"
        >
          <!-- Preview de imagen -->
          <div v-if="isImage(ev)" class="aspect-video bg-gray-200 dark:bg-gray-700">
            <img 
              :src="getEvidenciaUrl(ev)" 
              :alt="ev.descripcion || 'Evidencia'"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- Preview de PDF -->
          <div v-else class="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <FileText :size="48" class="text-gray-400" />
          </div>

          <!-- Info overlay -->
          <div class="p-3">
            <span :class="['text-xs font-medium px-2 py-1 rounded-full', getTipoBadgeClass(ev.tipo)]">
              {{ getTipoLabel(ev.tipo) }}
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate" :title="ev.nombre_original">
              {{ ev.nombre_original }}
            </p>
          </div>

          <!-- Acciones hover -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <a 
              :href="getEvidenciaUrl(ev)" 
              target="_blank"
              class="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="Ver archivo"
            >
              <Eye :size="18" />
            </a>
            <button 
              @click="deleteEvidencia(ev)"
              class="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 :size="18" />
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
