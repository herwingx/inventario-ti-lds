<script setup>
/**
 * @fileoverview Vista de Detalle de Sucursal.
 * Muestra la información de una sucursal, su ubicación y empresa matriz.
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import SucursalesService from '../services/SucursalesService'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError } = useSwal()

const sucursal = ref(null)
const loading = ref(true)

const load = async () => {
    loading.value = true
    try {
        sucursal.value = await SucursalesService.getById(route.params.id)
    } catch (error) {
        toastError('No se pudo cargar la sucursal')
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

const remove = async () => {
    const result = await confirmDelete({
        title: 'Confirmar Eliminación',
        text: `¿Eliminar sucursal ${sucursal.value.nombre}?`,
        confirmButtonText: 'Eliminar Sucursal',
        cancelButtonText: 'Cancelar'
    })
    
    if (result.isConfirmed) {
        try {
            await SucursalesService.delete(sucursal.value.id)
            toastSuccess('Sucursal eliminada')
            router.push({ name: 'sucursales' })
        } catch (error) {
            toastError('No se pudo eliminar (probablemente tenga dependencias)')
        }
    }
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
             <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                    <Skeleton v-if="loading" width="10rem" />
                    <span v-else>{{ sucursal?.nombre }}</span>
                </h1>
                <p v-if="!loading" class="detail-label normal-case font-medium text-gray-500 mt-1">
                    {{ sucursal?.nombre_empresa }}
                </p>
             </div>
        </div>
        <div v-if="!loading" class="flex gap-2">
             <Button label="Editar" icon="pi pi-pencil" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg" @click="edit" />
             <Button label="Eliminar" icon="pi pi-trash" severity="danger" class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg" @click="remove" />
        </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton height="10rem" />
        <Skeleton height="10rem" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <!-- Info General -->
         <div class="detail-card">
            <div class="detail-section-header">
                <div class="detail-section-icon text-primary">
                    <i class="pi pi-building text-lg"></i>
                </div>
                <h2 class="detail-section-title">Información General</h2>
            </div>
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <span class="detail-label !mb-0">Empresa</span>
                    <span class="detail-value">{{ sucursal.nombre_empresa }}</span>
                </div>
                 <div class="flex justify-between items-center">
                    <span class="detail-label !mb-0">Tipo</span>
                    <span class="detail-value">{{ sucursal.nombre_tipo_sucursal }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="detail-label !mb-0">Estado</span>
                    <Tag 
                        :value="sucursal.status_nombre" 
                        severity="success" 
                        class="!text-[10px] !font-bold px-3 py-1.5 !rounded-md tracking-wide"
                    />
                </div>
            </div>
         </div>

         <!-- Contacto -->
         <div class="detail-card">
            <div class="detail-section-header">
                <div class="detail-section-icon text-red-500">
                    <i class="pi pi-map-marker text-lg"></i>
                </div>
                <h2 class="detail-section-title">Ubicación y Contacto</h2>
            </div>
            <div class="space-y-6">
                <div class="flex flex-col gap-2">
                    <span class="detail-label">Dirección</span>
                    <p class="detail-content-box">{{ sucursal.direccion || 'No registrada en el sistema' }}</p>
                </div>
                <div class="flex justify-between items-center">
                    <span class="detail-label !mb-0">Teléfono</span>
                    <span class="detail-value">{{ sucursal.numero_telefono || 'No registrado' }}</span>
                </div>
                 <div class="flex justify-between items-center pt-2">
                    <span class="detail-label !mb-0">Fecha Registro</span>
                    <span class="detail-value text-sm text-light-muted dark:text-dark-muted font-normal">{{ formatDate(sucursal.fecha_registro) }}</span>
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
