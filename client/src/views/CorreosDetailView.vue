<script setup>
/**
 * @fileoverview Vista de Detalle de Cuenta de Correo.
 * Visualiza la información de una cuenta de email corporativa y el empleado asignado.
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useSwal } from '../composables/useSwal'
import CorreosService from '../services/CorreosService'
import { getStatusSeverity } from '../utils/status'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirmDelete: swalConfirmDelete } = useSwal()

const correo = ref(null)
const loading = ref(true)

const loadCorreo = async () => {
    loading.value = true
    try {
        const id = route.params.id
        correo.value = await CorreosService.getById(id)
    } catch (error) {
        console.error('Error al cargar correo:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la cuenta de correo', life: 3000 })
        router.push({ name: 'correos' })
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadCorreo()
})

const goBack = () => router.push({ name: 'correos' })

const editCorreo = () => router.push({ name: 'correos-editar', params: { id: correo.value.id } })

const confirmDelete = async () => {
    const result = await swalConfirmDelete({
        title: 'Confirmar Eliminación',
        text: `¿Estás seguro de eliminar la cuenta ${correo.value.email}?`,
        confirmButtonText: 'Eliminar Cuenta',
        cancelButtonText: 'Cancelar'
    })
    
    if (result.isConfirmed) {
        try {
            await CorreosService.delete(correo.value.id)
            toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Cuenta eliminada correctamente', life: 3000 })
            router.push({ name: 'correos' })
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 })
        }
    }
}

// UI Helpers
// Usando función centralizada getStatusSeverity desde utils/status.js
const getSeverity = getStatusSeverity

const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
    <div class="animate-fade-in-up">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div class="flex items-center gap-3">
                <Button icon="pi pi-arrow-left" text rounded class="!text-gray-600 dark:!text-gray-400" @click="goBack" />
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Skeleton v-if="loading" width="15rem" />
                        <span v-else>{{ correo?.email }}</span>
                    </h1>
                </div>
            </div>
            
            <div v-if="!loading" class="flex gap-2">
                 <Button label="Editar" icon="pi pi-pencil" @click="editCorreo" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg" />
                 <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDelete" class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg" />
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton height="15rem" />
            <Skeleton height="15rem" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Info General -->
            <div class="detail-card">
                <div class="detail-section-header">
                    <div class="detail-section-icon text-primary">
                        <i class="pi pi-envelope text-lg"></i>
                    </div>
                    <h2 class="detail-section-title">Información de Cuenta</h2>
                </div>
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <span class="detail-label !mb-0">Usuario</span>
                        <span class="detail-value">{{ correo.usuario_email || 'N/A' }}</span>
                    </div>
                     <div class="flex justify-between items-center">
                        <span class="detail-label !mb-0">Contraseña</span>
                        <span class="detail-value-mono">{{ correo.password_data || '********' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="detail-label !mb-0">Estado</span>
                        <Tag 
                            :value="correo.status_nombre" 
                            :severity="getSeverity(correo.status_nombre)"
                            class="!text-[10px] !font-bold px-3 py-1.5 !rounded-md tracking-wide"
                        />
                    </div>
                     <div class="flex flex-col gap-2">
                        <span class="detail-label">Observaciones</span>
                        <p class="detail-content-box">{{ correo.observaciones || 'Sin observaciones' }}</p>
                    </div>
                </div>
            </div>

            <!-- Asignación & Fechas -->
            <div class="space-y-6">
                <!-- Asignado A -->
                <div class="detail-card">
                    <div class="detail-section-header">
                        <div class="detail-section-icon text-blue-500">
                            <i class="pi pi-user text-lg"></i>
                        </div>
                        <h2 class="detail-section-title">Asignado A</h2>
                    </div>
                    <div v-if="correo.id_empleado_asignado" class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm border border-blue-500/20">
                            <i class="pi pi-user text-xl"></i>
                        </div>
                        <div>
                            <span class="detail-value block text-lg">
                                {{ correo.nombre_empleado }} {{ correo.apellido_empleado }}
                            </span>
                            <span class="detail-label">Empleado responsable</span>
                        </div>
                    </div>
                    <div v-else class="text-center py-6 bg-gray-50/50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-gray-200 dark:border-dark-border">
                        <i class="pi pi-info-circle text-gray-300 dark:text-gray-600 mb-2 text-xl"></i>
                        <p class="text-light-muted dark:text-dark-muted font-medium text-sm">Esta cuenta no está asignada.</p>
                    </div>
                </div>

                <!-- Fechas -->
                <div class="detail-card">
                    <div class="detail-section-header">
                        <div class="detail-section-icon text-purple-500">
                            <i class="pi pi-calendar text-lg"></i>
                        </div>
                        <h2 class="detail-section-title">Registro</h2>
                    </div>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="detail-label !mb-0">Creado</span>
                            <span class="detail-value font-medium">{{ formatDate(correo.fecha_creacion) }}</span>
                        </div>
                         <div class="flex justify-between items-center">
                            <span class="detail-label !mb-0">Actualización</span>
                            <span class="detail-value font-medium">{{ formatDate(correo.fecha_actualizacion) }}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
