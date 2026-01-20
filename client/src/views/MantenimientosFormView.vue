<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MaintenanceService from '../services/MaintenanceService'
import { useSwal } from '../composables/useSwal'
import { ArrowLeft, Save, Calendar as CalendarIcon, Check, X } from 'lucide-vue-next'

// Componentes PrimeVue
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Fluid from 'primevue/fluid'

const router = useRouter()
const route = useRoute()
const { success, error, confirmWarning } = useSwal()

const isEditMode = ref(false)
const loading = ref(false)
const form = ref({
  titulo: '',
  id_equipo: '',
  fecha_programada: new Date(),
  tipo: 'PREVENTIVO',
  descripcion: '',
  id_tecnico_asignado: ''
})

const typeOptions = [
  { label: 'Preventivo', value: 'PREVENTIVO' },
  { label: 'Correctivo', value: 'CORRECTIVO' }
]
const selectedType = ref({ label: 'Preventivo', value: 'PREVENTIVO' })

onMounted(async () => {
  if (route.params.id) {
    isEditMode.value = true
    await loadData(route.params.id)
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

const goBack = async () => {
  if (form.value.titulo) { // Validación simple de dirty
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
  <div class="animate-fade-in-up max-w-4xl mx-auto">
    
    <!-- Card Formulario -->
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
