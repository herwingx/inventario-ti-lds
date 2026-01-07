<script setup>
/**
 * @fileoverview Vista de Detalle de Empleado.
 * Muestra el perfil completo de un empleado, incluyendo historial de equipos asignados y datos de contacto.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EmpleadosService from '../services/EmpleadosService'

// Componentes PrimeVue
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const empleado = ref(null)
const loading = ref(true)

// Cargar datos del empleado
const loadEmpleado = async () => {
  loading.value = true
  try {
    const id = route.params.id
    empleado.value = await EmpleadosService.getById(id)
  } catch (error) {
    console.error('Error al cargar empleado:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo cargar el empleado', 
      life: 3000 
    })
    router.push({ name: 'empleados' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEmpleado()
})

// Helper para el color del estado
const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('ACTIVO')) return 'success'
  if (s.includes('INACTIVO')) return 'warn'
  if (s.includes('SUSPENDIDO')) return 'contrast'
  if (s.includes('BAJA')) return 'danger'
  return 'secondary'
}

// Navegación
const goBack = () => {
  router.push({ name: 'empleados' })
}

const editEmpleado = () => {
  router.push({ name: 'empleados-editar', params: { id: empleado.value.id } })
}

const confirmDeleteEmpleado = () => {
  const nombreCompleto = `${empleado.value.nombres} ${empleado.value.apellidos}`
  confirm.require({
    message: `¿Estás seguro de que deseas eliminar permanentemente a ${nombreCompleto}? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar Empleado',
    rejectClass: 'p-button-secondary p-button-text',
    acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600 !px-6',
    accept: async () => {
      try {
        await EmpleadosService.delete(empleado.value.id)
        toast.add({ 
          severity: 'success', 
          summary: 'Eliminado', 
          detail: `Empleado ${nombreCompleto} eliminado correctamente`, 
          life: 3000 
        })
        router.push({ name: 'empleados' })
      } catch (error) {
        console.error('Error al eliminar empleado:', error)
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo eliminar el empleado', 
          life: 3000 
        })
      }
    }
  })
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
  if (!empleado.value) return []
  
  return [
    {
      title: 'Información Personal',
      icon: 'pi-user',
      color: 'text-blue-500',
      fields: [
        { label: 'ID', value: `#${empleado.value.id}`, mono: true },
        { label: 'No. Empleado', value: empleado.value.numero_empleado || 'N/A', mono: true },
        { label: 'Nombres', value: empleado.value.nombres },
        { label: 'Apellidos', value: empleado.value.apellidos },
        { label: 'Estado', value: empleado.value.status_nombre, isTag: true }
      ]
    },
    {
      title: 'Contacto',
      icon: 'pi-phone',
      color: 'text-green-500',
      fields: [
        { label: 'Email Personal', value: empleado.value.email_personal || 'N/A' },
        { label: 'Teléfono', value: empleado.value.telefono || 'N/A' }
      ]
    },
    {
      title: 'Información Laboral',
      icon: 'pi-briefcase',
      color: 'text-purple-500',
      fields: [
        { label: 'Puesto', value: empleado.value.puesto || 'N/A' },
        { label: 'Empresa', value: empleado.value.nombre_empresa || 'N/A' },
        { label: 'Área', value: empleado.value.nombre_area || 'N/A' },
        { label: 'Fecha de Ingreso', value: formatDate(empleado.value.fecha_ingreso) }
      ]
    },
    {
      title: 'Fechas Importantes',
      icon: 'pi-calendar',
      color: 'text-orange-500',
      fields: [
        { label: 'Fecha de Nacimiento', value: formatDate(empleado.value.fecha_nacimiento) },
        { label: 'Fecha de Registro', value: formatDate(empleado.value.fecha_registro) },
        { label: 'Última Actualización', value: formatDate(empleado.value.fecha_actualizacion) }
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
            <span v-else>{{ empleado?.nombres }} {{ empleado?.apellidos }}</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>{{ empleado?.puesto || 'Sin puesto asignado' }}</span>
          </p>
        </div>
      </div>

      <div v-if="!loading" class="flex gap-2">
        <Button 
          label="Editar" 
          icon="pi pi-pencil" 
          class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="editEmpleado"
        />
        <Button 
          label="Eliminar" 
          icon="pi pi-trash" 
          severity="danger"
          class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="confirmDeleteEmpleado"
        />
      </div>
    </div>

    <!-- Grid de secciones -->
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
                'detail-value',
                field.mono ? 'detail-value-mono' : ''
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
