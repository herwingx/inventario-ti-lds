<script setup>
/**
 * @fileoverview Vista de Detalle de Cuenta de Correo.
 * Visualiza la información de una cuenta de email corporativa y el empleado asignado.
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import CorreosService from '../services/CorreosService'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

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

const confirmDelete = () => {
    confirm.require({
        message: `¿Estás seguro de eliminar la cuenta ${correo.value.email}?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger !bg-red-500 !border-none',
        accept: async () => {
            try {
                await CorreosService.delete(correo.value.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Cuenta eliminada correctamente', life: 3000 })
                router.push({ name: 'correos' })
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 })
            }
        }
    })
}

// UI Helpers
const getSeverity = (status) => {
    if (!status) return 'secondary'
    const s = status.toUpperCase()
    if (s.includes('ACTIVO')) return 'success'
    if (s.includes('INACTIVO')) return 'warn'
    return 'secondary'
}

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
                 <Button label="Editar" icon="pi pi-pencil" @click="editCorreo" class="!bg-primary !border-none" />
                 <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDelete" class="!bg-red-500 !border-none" />
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton height="15rem" />
            <Skeleton height="15rem" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Info General -->
            <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-envelope text-primary"></i> Información de Cuenta
                </h3>
                <div class="space-y-4">
                    <div class="flex justify-between border-b pb-2 border-gray-100">
                        <span class="text-gray-500">Usuario</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ correo.usuario_email || 'N/A' }}</span>
                    </div>
                     <div class="flex justify-between border-b pb-2 border-gray-100">
                        <span class="text-gray-500">Contraseña</span>
                        <span class="font-mono text-gray-900 dark:text-white">{{ correo.password_data || '********' }}</span>
                    </div>
                    <div class="flex justify-between items-center border-b pb-2 border-gray-100">
                        <span class="text-gray-500">Estado</span>
                        <Tag :value="correo.status_nombre" :severity="getSeverity(correo.status_nombre)" />
                    </div>
                     <div class="pt-2">
                        <span class="text-gray-500 block mb-1">Observaciones</span>
                        <p class="text-gray-700 dark:text-gray-300 italic text-sm">{{ correo.observaciones || 'Sin observaciones' }}</p>
                    </div>
                </div>
            </div>

            <!-- Asignación & Fechas -->
            <div class="space-y-6">
                <!-- Asignado A -->
                <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <i class="pi pi-user text-blue-500"></i> Asignado A
                    </h3>
                    <div v-if="correo.id_empleado_asignado" class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <i class="pi pi-user text-lg"></i>
                        </div>
                        <div>
                            <span class="text-lg font-bold text-gray-900 dark:text-white block">
                                {{ correo.nombre_empleado }} {{ correo.apellido_empleado }}
                            </span>
                            <span class="text-sm text-gray-500">Empleado</span>
                        </div>
                    </div>
                    <div v-else class="text-center py-4 text-gray-500">
                        Esta cuenta no está asignada a ningún empleado.
                    </div>
                </div>

                <!-- Fechas -->
                <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <i class="pi pi-calendar text-purple-500"></i> Registro
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">Creado</span>
                            <span class="text-gray-900 dark:text-white font-medium">{{ formatDate(correo.fecha_creacion) }}</span>
                        </div>
                         <div class="flex justify-between">
                            <span class="text-gray-500">Última Actualización</span>
                            <span class="text-gray-900 dark:text-white font-medium">{{ formatDate(correo.fecha_actualizacion) }}</span>
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
