<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EquiposService from '../services/EquiposService'

// Componentes PrimeVue
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const equipo = ref(null)
const loading = ref(true)

// Cargar datos del equipo
const loadEquipo = async () => {
  loading.value = true
  try {
    const id = route.params.id
    equipo.value = await EquiposService.getById(id)
  } catch (error) {
    console.error('Error al cargar equipo:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo cargar el equipo', 
      life: 3000 
    })
    router.push({ name: 'equipos' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEquipo()
})

// Helper para el color del estado
const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('DISPONIBLE')) return 'success'
  if (s.includes('ASIGNADO')) return 'warn'
  if (s.includes('MANTENIMIENTO')) return 'contrast'
  if (s.includes('BAJA') || s.includes('DAÑADO')) return 'danger'
  return 'secondary'
}

// Navegación
const goBack = () => {
  router.push({ name: 'equipos' })
}

const editEquipo = () => {
  router.push({ name: 'equipos-editar', params: { id: equipo.value.id } })
}

const confirmDeleteEquipo = () => {
  confirm.require({
    message: `¿Estás seguro de que deseas eliminar permanentemente ${equipo.value.nombre_equipo}? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar Equipo',
    rejectClass: 'p-button-secondary p-button-text',
    acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600 !px-6',
    accept: async () => {
      try {
        await EquiposService.delete(equipo.value.id)
        toast.add({ 
          severity: 'success', 
          summary: 'Eliminado', 
          detail: `Equipo ${equipo.value.nombre_equipo} eliminado correctamente`, 
          life: 3000 
        })
        router.push({ name: 'equipos' })
      } catch (error) {
        console.error('Error al eliminar equipo:', error)
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo eliminar el equipo', 
          life: 3000 
        })
      }
    }
  })
}

// Secciones de información
const infoSections = computed(() => {
  if (!equipo.value) return []
  
  return [
    {
      title: 'Información General',
      icon: 'pi-info-circle',
      color: 'text-blue-500',
      fields: [
        { label: 'ID', value: `#${equipo.value.id}`, mono: true },
        { label: 'Nombre del Equipo', value: equipo.value.nombre_equipo },
        { label: 'Número de Serie', value: equipo.value.numero_serie, mono: true },
        { label: 'Tipo de Equipo', value: equipo.value.nombre_tipo_equipo },
        { label: 'Estado', value: equipo.value.status_nombre, isTag: true }
      ]
    },
    {
      title: 'Especificaciones',
      icon: 'pi-cog',
      color: 'text-purple-500',
      fields: [
        { label: 'Marca', value: equipo.value.marca },
        { label: 'Modelo', value: equipo.value.modelo },
        { label: 'Procesador', value: equipo.value.procesador || 'N/A' },
        { label: 'RAM', value: equipo.value.ram || 'N/A' },
        { label: 'Almacenamiento', value: equipo.value.almacenamiento || 'N/A' }
      ]
    },
    {
      title: 'Ubicación',
      icon: 'pi-map-marker',
      color: 'text-green-500',
      fields: [
        { label: 'Empresa', value: equipo.value.nombre_empresa },
        { label: 'Sucursal', value: equipo.value.nombre_sucursal_actual },
        { label: 'Área', value: equipo.value.nombre_area || 'N/A' }
      ]
    },
    {
      title: 'Información Adicional',
      icon: 'pi-file',
      color: 'text-orange-500',
      fields: [
        { label: 'Observaciones', value: equipo.value.observaciones || 'Sin observaciones', fullWidth: true }
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
            <span v-else>{{ equipo?.nombre_equipo }}</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>Detalles del equipo</span>
          </p>
        </div>
      </div>

      <div v-if="!loading" class="flex gap-2">
        <Button 
          label="Editar" 
          icon="pi pi-pencil" 
          class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="editEquipo"
        />
        <Button 
          label="Eliminar" 
          icon="pi pi-trash" 
          severity="danger"
          class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="confirmDeleteEquipo"
        />
      </div>
    </div>

    <!-- Grid de secciones -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div 
        v-for="(section, index) in infoSections" 
        :key="index"
        class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300"
        :class="{ 'lg:col-span-2': section.fields.some(f => f.fullWidth) }"
      >
        <!-- Título de la sección -->
        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-dark-border">
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', section.color, 'bg-opacity-10 dark:bg-opacity-20']">
            <i :class="['pi', section.icon, section.color, 'text-lg']"></i>
          </div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ section.title }}</h2>
        </div>

        <!-- Campos -->
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex justify-between">
            <Skeleton width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <Skeleton width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
          </div>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="(field, fieldIndex) in section.fields" 
            :key="fieldIndex"
            :class="[
              'flex',
              field.fullWidth ? 'flex-col gap-2' : 'justify-between items-center',
              'py-2'
            ]"
          >
            <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {{ field.label }}
            </span>
            
            <!-- Tag para estado -->
            <Tag 
              v-if="field.isTag" 
              :value="field.value" 
              :severity="getSeverity(field.value)"
              class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide"
            />
            
            <!-- Texto normal -->
            <span 
              v-else
              :class="[
                'text-sm font-bold text-gray-900 dark:text-white',
                field.mono ? 'font-mono' : '',
                field.fullWidth ? 'bg-gray-50 dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-dark-border' : ''
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
