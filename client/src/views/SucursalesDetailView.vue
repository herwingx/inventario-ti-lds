<script setup>
/**
 * @fileoverview Vista de Detalle de Sucursal.
 * Muestra la información de una sucursal, su ubicación y empresa matriz.
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import SucursalesService from '../services/SucursalesService'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const sucursal = ref(null)
const loading = ref(true)

const load = async () => {
    loading.value = true
    try {
        sucursal.value = await SucursalesService.getById(route.params.id)
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la sucursal', life: 3000 })
        router.push({ name: 'sucursales' })
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    load()
})

const goBack = () => router.push({ name: 'sucursales' })
const edit = () => router.push({ name: 'sucursales-editar', params: { id: sucursal.value.id } })

const remove = () => {
    confirm.require({
        message: `¿Eliminar sucursal ${sucursal.value.nombre}?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger !bg-red-500 !border-none',
        accept: async () => {
             try {
                await SucursalesService.delete(sucursal.value.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Sucursal eliminada', life: 3000 })
                router.push({ name: 'sucursales' })
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar (probablemente tenga dependencias)', life: 3000 })
            }
        }
    })
}

const formatDate = (d) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString()
}
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div class="flex items-center gap-3">
             <Button icon="pi pi-arrow-left" text rounded class="!text-gray-600 dark:!text-gray-400" @click="goBack" />
             <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                <Skeleton v-if="loading" width="10rem" />
                <span v-else>{{ sucursal?.nombre }}</span>
             </h1>
        </div>
        <div v-if="!loading" class="flex gap-2">
             <Button label="Editar" icon="pi pi-pencil" class="!bg-primary !border-none" @click="edit" />
             <Button label="Eliminar" icon="pi pi-trash" severity="danger" class="!bg-red-500 !border-none" @click="remove" />
        </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton height="10rem" />
        <Skeleton height="10rem" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <!-- Info General -->
         <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="pi pi-building text-primary"></i> Información General
            </h3>
            <div class="space-y-4">
                <div class="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-700">
                    <span class="text-gray-500">Empresa</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ sucursal.nombre_empresa }}</span>
                </div>
                 <div class="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-700">
                    <span class="text-gray-500">Tipo</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ sucursal.nombre_tipo_sucursal }}</span>
                </div>
                <div class="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-700">
                    <span class="text-gray-500">Estado</span>
                    <Tag :value="sucursal.status_nombre" severity="success" />
                </div>
            </div>
         </div>

         <!-- Contacto -->
         <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="pi pi-map-marker text-red-500"></i> Ubicación y Contacto
            </h3>
            <div class="space-y-4">
                <div class="flex flex-col border-b pb-2 border-gray-100 dark:border-gray-700">
                    <span class="text-gray-500 text-sm">Dirección</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ sucursal.direccion || 'No registrada' }}</span>
                </div>
                <div class="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-700">
                    <span class="text-gray-500">Teléfono</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ sucursal.numero_telefono || 'No registrado' }}</span>
                </div>
                 <div class="flex justify-between pt-2">
                    <span class="text-gray-500">Fecha Registro</span>
                    <span class="text-gray-900 dark:text-white">{{ formatDate(sucursal.fecha_registro) }}</span>
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
