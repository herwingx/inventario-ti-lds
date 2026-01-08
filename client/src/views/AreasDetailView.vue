<script setup>
/**
 * @fileoverview Vista de Detalle de Área.
 * Muestra la información completa de un área específica, incluyendo su relación con la empresa y su estado.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useSwal } from '../composables/useSwal'
import AreasService from '../services/AreasService'
import { getStatusSeverity } from '../utils/status'

// Componentes PrimeVue
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirmDelete } = useSwal()

const area = ref(null)
const loading = ref(true)

// Cargar datos del área
const loadArea = async () => {
  loading.value = true
  try {
    const id = route.params.id
    area.value = await AreasService.getById(id)
  } catch (error) {
    console.error('Error al cargar área:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo cargar el área', 
      life: 3000 
    })
    router.push({ name: 'areas' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArea()
})

// Helper para el color del estado
// Usando función centralizada getStatusSeverity desde utils/status.js
const getSeverity = getStatusSeverity

// Navegación
const goBack = () => {
  router.push({ name: 'areas' })
}

const editArea = () => {
  router.push({ name: 'areas-editar', params: { id: area.value.id } })
}

const confirmDeleteArea = async () => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: `¿Estás seguro de que deseas eliminar permanentemente el área "${area.value.nombre}"? Esta acción no se puede deshacer.`,
    confirmButtonText: 'Eliminar Área',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await AreasService.delete(area.value.id)
      toast.add({ 
        severity: 'success', 
        summary: 'Eliminado', 
        detail: `Área ${area.value.nombre} eliminada correctamente`, 
        life: 3000 
      })
      router.push({ name: 'areas' })
    } catch (error) {
      console.error('Error al eliminar área:', error)
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'No se pudo eliminar el área', 
        life: 3000 
      })
    }
  }
}

// Formatear fecha
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Secciones de información
const infoSections = computed(() => {
  if (!area.value) return []
  
  return [
    {
      title: 'Información General',
      icon: 'pi-building',
      color: 'text-blue-500',
      fields: [
        { label: 'ID', value: `#${area.value.id}`, mono: true },
        { label: 'Nombre del Área', value: area.value.nombre },
        { label: 'Empresa', value: area.value.nombre_empresa || 'N/A' },
        { label: 'Estado', value: area.value.status_nombre, isTag: true }
      ]
    },
    {
      title: 'Fechas de Registro',
      icon: 'pi-calendar',
      color: 'text-purple-500',
      fields: [
        { label: 'Fecha de Registro', value: formatDate(area.value.fecha_registro) },
        { label: 'Última Actualización', value: formatDate(area.value.fecha_actualizacion) }
      ]
    }
  ]
})
</script>

<template>
  <div class="animate-fade-in-up">
    <!-- Header con acciones -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <Button 
          icon="pi pi-arrow-left" 
          text 
          rounded 
          class="!text-gray-600 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-dark-border"
          @click="goBack"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            <Skeleton v-if="loading" width="15rem" height="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>{{ area?.nombre }}</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>{{ area?.nombre_empresa || 'Sin empresa asignada' }}</span>
          </p>
        </div>
      </div>

      <div v-if="!loading" class="flex gap-2">
        <Button 
          label="Editar" 
          icon="pi pi-pencil" 
          class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="editArea"
        />
        <Button 
          label="Eliminar" 
          icon="pi pi-trash" 
          severity="danger"
          class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="confirmDeleteArea"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div 
        v-for="(section, index) in infoSections" 
        :key="index"
        class="detail-card"
      >
        <!-- Título de la sección -->
        <div class="detail-section-header">
          <div :class="['detail-section-icon', section.color]">
            <i :class="['pi', section.icon, section.color, 'text-lg']"></i>
          </div>
          <h2 class="detail-section-title">{{ section.title }}</h2>
        </div>

        <!-- Campos -->
        <div v-if="loading" class="space-y-6">
          <div v-for="i in 3" :key="i" class="flex justify-between">
            <Skeleton width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <Skeleton width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
          </div>
        </div>

        <div v-else class="space-y-6">
          <div 
            v-for="(field, fieldIndex) in section.fields" 
            :key="fieldIndex"
            class="flex justify-between items-center"
          >
            <span class="detail-label">
              {{ field.label }}
            </span>
            
            <!-- Tag para estado -->
            <Tag 
              v-if="field.isTag" 
              :value="field.value" 
              :severity="getSeverity(field.value)"
              class="!text-[10px] !font-bold px-3 py-1.5 !rounded-md tracking-wide"
            />
            
            <!-- Texto normal -->
            <span 
              v-else
              :class="[
                field.mono ? 'detail-value-mono' : 'detail-value'
              ]"
            >
              {{ field.value }}
            </span>
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
