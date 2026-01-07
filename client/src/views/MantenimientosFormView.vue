<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import MantenimientosService from '../services/MantenimientosService'
import EquiposService from '../services/EquiposService'
import CatalogosService from '../services/CatalogosService'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Skeleton from 'primevue/skeleton'
import Card from 'primevue/card'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isEditing = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)

const mantenimiento = ref({
    id_equipo: null,
    fecha_inicio: null,
    fecha_fin: null,
    diagnostico: '',
    solucion: '',
    costo: null,
    proveedor: '',
    id_status: null
})

const equipos = ref([])
const statusList = ref([])

onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            loadEquipos(),
            loadStatus()
        ])

        if (isEditing.value) {
            await loadMantenimiento(route.params.id)
        } else {
            // Predeterminar fecha inicio hoy
            mantenimiento.value.fecha_inicio = new Date()
            // Predeterminar estado "En Proceso" si existe, o el primero
            // Asumiremos IDs estándar o buscaremos por nombre
             const enProceso = statusList.value.find(s => s.nombre_status.toLowerCase().includes('proceso'))
             if (enProceso) mantenimiento.value.id_status = enProceso.id
        }
    } catch (error) {
        console.error(error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos iniciales', life: 3000 })
    } finally {
        loading.value = false
    }
})

const loadEquipos = async () => {
    try {
        const data = await EquiposService.getAll()
        // Mapear para dropdown
        equipos.value = data.map(e => ({
            label: `${e.nombre_equipo} - ${e.numero_serie}`,
            value: e.id,
            ...e // Guardar todo por si acaso
        }))
    } catch (error) {
        console.error('Error loading equipos', error)
    }
}

const loadStatus = async () => {
    try {
        statusList.value = await CatalogosService.getStatuses()
    } catch (error) {
        console.error('Error loading status', error)
        // Fallback básico si falla API status
        statusList.value = [
            { id: 1, nombre_status: 'Activo' },
            { id: 2, nombre_status: 'Inactivo' }, 
        ]
    }
}

const loadMantenimiento = async (id) => {
    try {
        const data = await MantenimientosService.getById(id)
        // Convertir fechas string a Date object para el Calendar
        mantenimiento.value = {
            ...data,
            fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
            fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el mantenimiento', life: 3000 })
        router.push({ name: 'mantenimientos' })
    }
}

const save = async () => {
    // Validaciones básicas
    if (!mantenimiento.value.id_equipo) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un equipo', life: 3000 })
        return
    }
    if (!mantenimiento.value.fecha_inicio) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'La fecha de inicio es obligatoria', life: 3000 })
        return
    }
    
    // Validar orden fechas
    if (mantenimiento.value.fecha_fin && mantenimiento.value.fecha_inicio > mantenimiento.value.fecha_fin) {
         toast.add({ severity: 'error', summary: 'Error', detail: 'La fecha de fin no puede ser anterior al inicio', life: 3000 })
         return
    }

    saving.value = true
    try {
        // Formatear fechas a YYYY-MM-DD para el backend
        const payload = {
            ...mantenimiento.value,
            fecha_inicio: formatDateForBackend(mantenimiento.value.fecha_inicio),
            fecha_fin: formatDateForBackend(mantenimiento.value.fecha_fin)
        }

        if (isEditing.value) {
            await MantenimientosService.update(route.params.id, payload)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Mantenimiento actualizado', life: 3000 })
        } else {
            await MantenimientosService.create(payload)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Mantenimiento registrado', life: 3000 })
        }
        router.push({ name: 'mantenimientos' })
    } catch (error) {
        console.error(error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Falló el guardado', life: 3000 })
    } finally {
        saving.value = false
    }
}

const formatDateForBackend = (date) => {
    if (!date) return null
    // Ajustar a YYYY-MM-DD local
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset*60*1000))
    return localDate.toISOString().split('T')[0]
}

const goBack = () => {
    router.back()
}
</script>

<template>
    <div class="max-w-4xl mx-auto animate-fade-in-up">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
            <Button icon="pi pi-arrow-left" text rounded class="!text-gray-600 dark:!text-gray-400" @click="goBack" />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ isEditing ? 'Editar Servicio' : 'Nuevo Servicio' }}
            </h1>
        </div>

        <div v-if="loading" class="space-y-4">
            <Skeleton height="30rem" class="rounded-xl" />
        </div>

        <Card v-else class="!rounded-xl shadow-lg border border-gray-100 dark:border-dark-border overflow-hidden">
            <template #content>
                <form @submit.prevent="save" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                    
                    <!-- Equipo -->
                    <div class="col-span-1 md:col-span-2">
                         <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipo *</label>
                         <Dropdown 
                            v-model="mantenimiento.id_equipo" 
                            :options="equipos" 
                            optionLabel="label" 
                            optionValue="value" 
                            filter 
                            placeholder="Seleccione un equipo" 
                            class="w-full" 
                            :class="{ 'p-invalid': !mantenimiento.id_equipo && saving }"
                         />
                    </div>

                    <!-- Fechas -->
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio *</label>
                        <Calendar v-model="mantenimiento.fecha_inicio" dateFormat="yy-mm-dd" showIcon class="w-full" :class="{ 'p-invalid': !mantenimiento.fecha_inicio && saving }" />
                    </div>
                    <div class="col-span-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
                        <Calendar v-model="mantenimiento.fecha_fin" dateFormat="yy-mm-dd" showIcon class="w-full" placeholder="En proceso..." />
                    </div>

                    <!-- Detalles -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnóstico</label>
                        <Textarea v-model="mantenimiento.diagnostico" rows="4" class="w-full" placeholder="Descripción del problema..." />
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solución / Trabajo realizado</label>
                        <Textarea v-model="mantenimiento.solucion" rows="4" class="w-full" placeholder="Descripción de la solución..." />
                    </div>

                    <!-- Costo y Proveedor -->
                    <div>
                         <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo ($)</label>
                         <InputNumber v-model="mantenimiento.costo" mode="currency" currency="MXN" locale="es-MX" class="w-full" placeholder="$0.00" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                        <InputText v-model="mantenimiento.proveedor" class="w-full" placeholder="Ej. HP Enterprise, Interno..." />
                    </div>

                    <!-- Estado -->
                    <div class="col-span-1 md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado del Servicio *</label>
                         <Dropdown 
                            v-model="mantenimiento.id_status" 
                            :options="statusList" 
                            optionLabel="nombre_status" 
                            optionValue="id" 
                            placeholder="Seleccione estado actual" 
                            class="w-full" 
                        />
                    </div>
                </form>
            </template>
            <template #footer>
                <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="goBack" />
                    <Button label="Guardar Registro" icon="pi pi-save" :loading="saving" @click="save" />
                </div>
            </template>
        </Card>
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
