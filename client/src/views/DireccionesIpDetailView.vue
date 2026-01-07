<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DireccionesIpService from '../services/DireccionesIpService'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const direccionIp = ref(null)
const loading = ref(true)

const loadDireccionIp = async () => {
  loading.value = true
  try {
    const id = route.params.id
    direccionIp.value = await DireccionesIpService.getById(id)
  } catch (error) {
    console.error('Error al cargar dirección IP:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la dirección IP', life: 3000 })
    router.push({ name: 'direcciones-ip' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDireccionIp()
})

const getSeverity = (status) => {
  if (!status) return 'secondary'
  const s = status.toUpperCase()
  if (s.includes('DISPONIBLE')) return 'success'
  if (s.includes('ASIGNADO')) return 'warn'
  if (s.includes('RESERVADO')) return 'contrast'
  return 'secondary'
}

const goBack = () => router.push({ name: 'direcciones-ip' })
const editDireccionIp = () => router.push({ name: 'direcciones-ip-editar', params: { id: direccionIp.value.id } })

const confirmDeleteDireccionIp = () => {
  confirm.require({
    message: `¿Estás seguro de que deseas eliminar permanentemente la IP "${direccionIp.value.direccion_ip}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar IP',
    rejectClass: 'p-button-secondary p-button-text',
    acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600 !px-6',
    accept: async () => {
      try {
        await DireccionesIpService.delete(direccionIp.value.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: `IP ${direccionIp.value.direccion_ip} eliminada correctamente`, life: 3000 })
        router.push({ name: 'direcciones-ip' })
      } catch (error) {
        console.error('Error al eliminar IP:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la dirección IP', life: 3000 })
      }
    }
  })
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
}

const infoSections = computed(() => {
  if (!direccionIp.value) return []
  
  return [
    {
      title: 'Información de Red',
      icon: 'pi-server',
      color: 'text-blue-500',
      fields: [
        { label: 'ID', value: `#${direccionIp.value.id}`, mono: true },
        { label: 'Dirección IP', value: direccionIp.value.direccion_ip, mono: true },
        { label: 'Estado', value: direccionIp.value.status_nombre, isTag: true },
        { label: 'Asignación Activa', value: direccionIp.value.asignacion_activa ? 'Sí' : 'No' }
      ]
    },
    {
      title: 'Ubicación',
      icon: 'pi-building',
      color: 'text-green-500',
      fields: [
        { label: 'Sucursal', value: direccionIp.value.nombre_sucursal || 'N/A' },
        { label: 'Empresa', value: direccionIp.value.nombre_empresa || 'N/A' }
      ]
    },
    {
      title: 'Información Adicional',
      icon: 'pi-info-circle',
      color: 'text-purple-500',
      fields: [
        { label: 'Comentario', value: direccionIp.value.comentario || 'Sin comentarios' },
        { label: 'Fecha de Registro', value: formatDate(direccionIp.value.fecha_registro) },
        { label: 'Última Actualización', value: formatDate(direccionIp.value.fecha_actualizacion) }
      ]
    }
  ]
})
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" text rounded class="!text-gray-600 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-dark-border" @click="goBack" />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            <Skeleton v-if="loading" width="15rem" height="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else class="font-mono">{{ direccionIp?.direccion_ip }}</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>{{ direccionIp?.nombre_sucursal || 'Sin sucursal asignada' }}</span>
          </p>
        </div>
      </div>

      <div v-if="!loading" class="flex gap-2">
        <Button label="Editar" icon="pi pi-pencil" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg" @click="editDireccionIp" />
        <Button label="Eliminar" icon="pi pi-trash" severity="danger" class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg" @click="confirmDeleteDireccionIp" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="(section, index) in infoSections" :key="index" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-dark-border">
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', section.color, 'bg-opacity-10 dark:bg-opacity-20']">
            <i :class="['pi', section.icon, section.color, 'text-lg']"></i>
          </div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ section.title }}</h2>
        </div>

        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex justify-between">
            <Skeleton width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <Skeleton width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
          </div>
        </div>

        <div v-else class="space-y-4">
          <div v-for="(field, fieldIndex) in section.fields" :key="fieldIndex" class="flex justify-between items-center py-2">
            <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">{{ field.label }}</span>
            <Tag v-if="field.isTag" :value="field.value" :severity="getSeverity(field.value)" class="!text-xs !font-bold px-3 py-1.5 !rounded-md text-white tracking-wide" />
            <span v-else :class="['text-sm font-bold text-gray-900 dark:text-white', field.mono ? 'font-mono' : '']">{{ field.value }}</span>
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
