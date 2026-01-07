<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AsignacionesService from '../services/AsignacionesService'
import EquiposService from '../services/EquiposService'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const asignacion = ref(null)
const componentes = ref([])
const loading = ref(true)

// Variables para gestión de componentes
const showComponentesDialog = ref(false)
const savingComponentes = ref(false)
const availableEquipos = ref([])
const selectedComponentesIds = ref([])

const loadAsignacion = async () => {
    loading.value = true
    try {
        const id = route.params.id
        // Cargar asignación
        asignacion.value = await AsignacionesService.getById(id)
        
        await loadComponentes(id)

    } catch (error) {
        console.error('Error al cargar asignación:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la asignación', life: 3000 })
        router.push({ name: 'asignaciones' })
    } finally {
        loading.value = false
    }
}

const loadComponentes = async (id) => {
    try {
        componentes.value = await AsignacionesService.getComponentes(id)
    } catch (e) {
        console.log('No components found or error', e)
        componentes.value = []
    }
}

onMounted(() => {
    loadAsignacion()
})

const goBack = () => router.push({ name: 'asignaciones' })

const finalizarAsignacion = () => {
    confirm.require({
        message: '¿Está seguro de finalizar esta asignación? El equipo principal, la IP y todos los componentes asignados quedarán disponibles.',
        header: 'Confirmar Finalización',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-warning !bg-orange-500 !border-none',
        accept: async () => {
            try {
                await AsignacionesService.finalizar(asignacion.value.id)
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación finalizada', life: 3000 })
                loadAsignacion() 
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo finalizar', life: 3000 })
            }
        }
    })
}

// Lógica para editar componentes
const openManageComponentes = async () => {
    try {
        // 1. Obtener equipos "realmente" disponibles
        const responseDisponibles = await EquiposService.getDisponiblesComponentes() // o getDisponibles() y filtrar
        
        // 2. Mapear disponibles a formato del select
        const options = responseDisponibles.map(e => ({
            label: `${e.nombre_equipo} (${e.numero_serie}) - ${e.tipo_equipo}`,
            value: e.id,
            status: 'available'
        }))

        // 3. Agregar los componentes que YA tiene asignados (que no saldrán en disponibles porque están asignados a ESTA asignación)
        // Necesitamos mapearlos igual
        const currentOptions = componentes.value.map(c => ({
            label: `${c.equipo_nombre} (${c.equipo_numero_serie}) - ${c.tipo_equipo_nombre}`,
            value: c.id_equipo, // Ojo: en endpoint getComponentes devuelve id_equipo
            status: 'current'
        }))

        // Fusionar listas
        availableEquipos.value = [...currentOptions, ...options]
        
        // Pre-seleccionar los actuales
        selectedComponentesIds.value = componentes.value.map(c => c.id_equipo)
        
        showComponentesDialog.value = true
    } catch (error) {
        console.error('Error loading options', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los equipos disponibles', life: 3000 })
    }
}

const saveComponentes = async () => {
    savingComponentes.value = true
    try {
        await AsignacionesService.updateComponentes(asignacion.value.id, selectedComponentesIds.value)
        toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Componentes actualizados correctamente', life: 3000 })
        showComponentesDialog.value = false
        // Recargar lista de componentes
        await loadComponentes(asignacion.value.id)
    } catch (error) {
        console.error('Error saving componentes', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Falló la actualización de componentes', life: 3000 })
    } finally {
        savingComponentes.value = false
    }
}

// UI Helpers
const isActive = computed(() => asignacion.value && !asignacion.value.fecha_fin_asignacion)

const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
                        <span v-else>Asignación #{{ asignacion?.id }}</span>
                        <Tag v-if="!loading" :value="isActive ? 'ACTIVA' : 'FINALIZADA'" :severity="isActive ? 'success' : 'secondary'" />
                    </h1>
                </div>
            </div>
            
            <div v-if="!loading && isActive" class="flex gap-2">
                 <Button label="Finalizar Asignación" icon="pi pi-check-square" severity="warning" @click="finalizarAsignacion" class="!bg-orange-500 !border-none" />
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton height="15rem" />
            <Skeleton height="15rem" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Equipo Info -->
            <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-desktop text-primary"></i> Equipo Asignado
                </h3>
                <div class="space-y-3">
                    <div>
                        <span class="text-sm text-gray-500 block">Equipo</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ asignacion.equipo_nombre }}</span>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500 block">Serie</span>
                        <span class="font-mono text-gray-900 dark:text-white">{{ asignacion.equipo_numero_serie }}</span>
                    </div>
                     <div>
                        <span class="text-sm text-gray-500 block">Tipo</span>
                        <span class="text-gray-900 dark:text-white">{{ asignacion.equipo_tipo_nombre }}</span>
                    </div>
                </div>
            </div>

            <!-- Asignado A Info -->
            <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-user text-blue-500"></i> Asignado A
                </h3>
                <div class="space-y-3">
                    <div v-if="asignacion.id_empleado">
                        <span class="text-sm text-gray-500 block">Empleado</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ asignacion.empleado_nombres }} {{ asignacion.empleado_apellidos }}</span>
                    </div>
                    <div v-if="asignacion.id_sucursal_asignado">
                        <span class="text-sm text-gray-500 block">Sucursal</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ asignacion.sucursal_asignada_nombre }}</span>
                    </div>
                    <div v-if="asignacion.id_area_asignado">
                        <span class="text-sm text-gray-500 block">Área</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ asignacion.area_asignada_nombre }}</span>
                    </div>
                     <div>
                        <span class="text-sm text-gray-500 block">Red (IP)</span>
                        <span class="font-mono text-gray-900 dark:text-white">{{ asignacion.ip_direccion || 'No asignada' }}</span>
                    </div>
                </div>
            </div>

            <!-- Detalles Asignación -->
            <div class="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-calendar text-purple-500"></i> Detalles
                </h3>
                <div class="space-y-3">
                    <div>
                        <span class="text-sm text-gray-500 block">Fecha Inicio</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(asignacion.fecha_asignacion) }}</span>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500 block">Fecha Fin</span>
                         <span :class="['font-medium', asignacion.fecha_fin_asignacion ? 'text-gray-900 dark:text-white' : 'text-green-500']">
                            {{ asignacion.fecha_fin_asignacion ? formatDate(asignacion.fecha_fin_asignacion) : 'En curso' }}
                         </span>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500 block">Observaciones</span>
                        <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">{{ asignacion.observacion || 'Ninguna' }}</p>
                    </div>
                </div>
            </div>

            <!-- Componentes List (Full Width) -->
            <div class="lg:col-span-3 bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border">
                 <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg font-bold flex items-center gap-2">
                        <i class="pi pi-box text-orange-500"></i> Componentes Adicionales
                     </h3>
                     <Button v-if="isActive" label="Gestionar Componentes" icon="pi pi-cog" size="small" outlined @click="openManageComponentes" />
                 </div>
                 
                 <div v-if="componentes.length === 0" class="text-center py-6 text-gray-500">
                     No hay componentes adicionales asignados.
                 </div>

                <DataTable v-else :value="componentes" size="small" class="text-sm">
                    <Column field="equipo_nombre" header="Equipo"></Column>
                    <Column field="equipo_numero_serie" header="Serie"></Column>
                    <Column field="tipo_equipo_nombre" header="Tipo"></Column>
                    <Column field="marca" header="Marca"></Column>
                    <Column field="modelo" header="Modelo"></Column>
                </DataTable>
            </div>
        </div>

        <!-- Dialog Gestión Componentes -->
        <Dialog v-model:visible="showComponentesDialog" header="Gestionar Componentes" modal class="w-full max-w-2xl">
            <div class="flex flex-col gap-4">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    Seleccione los equipos que funcionarán como componentes (periféricos) de esta asignación. 
                    <br>
                    <span class="text-xs text-orange-500"><i class="pi pi-info-circle"></i> Los equipos deseleccionados serán liberados (quedarán en stock).</span>
                </p>

                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm">Componentes Asignados</label>
                    <MultiSelect 
                        v-model="selectedComponentesIds" 
                        :options="availableEquipos" 
                        optionLabel="label" 
                        optionValue="value" 
                        filter 
                        placeholder="Buscar y seleccionar componentes..." 
                        display="chip" 
                        class="w-full"
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" text severity="secondary" @click="showComponentesDialog = false" />
                <Button label="Guardar Cambios" icon="pi pi-check" :loading="savingComponentes" @click="saveComponentes" />
            </template>
        </Dialog>
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
