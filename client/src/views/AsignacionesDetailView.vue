<script setup>
/**
 * @fileoverview Vista de Detalle de Asignación.
 * Muestra los detalles de una asignación de equipo (empleado responsable, fecha, ubicación) y sus componentes asociados.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import { getStatusSeverity } from '../utils/status'
import AsignacionesService from '../services/AsignacionesService'
import EquiposService from '../services/EquiposService'

import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'
import { ArrowLeft, CheckSquare } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { confirmWarning, success: toastSuccess, error: toastError } = useSwal()

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
        toastError('No se pudo cargar la asignación')
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

const finalizarAsignacion = async () => {
    const result = await confirmWarning({
        title: 'Confirmar Finalización',
        text: '¿Está seguro de finalizar esta asignación? El equipo principal, la IP y todos los componentes asignados quedarán disponibles.',
        confirmButtonText: 'Finalizar',
        cancelButtonText: 'Cancelar'
    })
    
    if (result.isConfirmed) {
        try {
            await AsignacionesService.finalizar(asignacion.value.id)
            toastSuccess('Asignación finalizada')
            loadAsignacion() 
        } catch (error) {
            toastError('No se pudo finalizar')
        }
    } else {
        toastInfo('Operación cancelada')
    }
}

// Lógica para editar componentes
const openManageComponentes = async () => {
    try {
        // 1. Obtener equipos "realmente" disponibles
        const responseDisponibles = await EquiposService.getDisponiblesComponentes() // o getDisponibles() y filtrar
        
        // 2. Mapear disponibles a formato del select
        const options = responseDisponibles.map(e => ({
            label: `[${e.nombre_tipo_equipo || 'Equipo'}] ${e.nombre_equipo} (${e.numero_serie})`,
            value: e.id,
            status: 'available'
        }))

        // 3. Agregar los componentes que YA tiene asignados
        const currentOptions = componentes.value.map(c => ({
            label: `[${c.tipo_equipo_nombre || 'Equipo'}] ${c.equipo_nombre} (${c.equipo_numero_serie})`,
            value: c.id_equipo,
            status: 'current'
        }))

        // Fusionar listas
        availableEquipos.value = [...currentOptions, ...options]
        
        // Pre-seleccionar los actuales
        selectedComponentesIds.value = componentes.value.map(c => c.id_equipo)
        
        showComponentesDialog.value = true
    } catch (error) {
        console.error('Error loading options', error)
        toastError('No se pudieron cargar los equipos disponibles')
    }
}

const cancelManageComponentes = () => {
    showComponentesDialog.value = false
    toastInfo('Operación cancelada')
}

const saveComponentes = async () => {
    savingComponentes.value = true
    try {
        await AsignacionesService.updateComponentes(asignacion.value.id, selectedComponentesIds.value)
        toastSuccess('Componentes actualizados correctamente')
        showComponentesDialog.value = false
        // Recargar lista de componentes
        await loadComponentes(asignacion.value.id)
    } catch (error) {
        console.error('Error saving componentes', error)
        toastError('Falló la actualización de componentes')
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
                <button class="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-all" @click="goBack" title="Volver">
                    <ArrowLeft :size="18" />
                </button>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Skeleton v-if="loading" width="15rem" />
                        <span v-else>Asignación #{{ asignacion?.id }}</span>
                        <Tag v-if="!loading" :value="isActive ? 'ACTIVA' : 'FINALIZADA'" :severity="getStatusSeverity(isActive ? 'ACTIVA' : 'FINALIZADA')" />
                    </h1>
                </div>
            </div>
            
            <div v-if="!loading && isActive" class="flex gap-2">
                <button class="btn-warning" @click="finalizarAsignacion">
                    <CheckSquare :size="18" />
                    <span>Finalizar Asignación</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton height="15rem" />
            <Skeleton height="15rem" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Equipo Info -->
            <div class="detail-card">
                <div class="detail-section-header">
                    <div class="detail-section-icon text-primary">
                        <i class="pi pi-desktop text-lg"></i>
                    </div>
                    <h2 class="detail-section-title">Equipo Asignado</h2>
                </div>
                <div class="space-y-8">
                    <div class="flex flex-col">
                        <span class="detail-label">Equipo</span>
                        <span class="detail-value">{{ asignacion.equipo_nombre }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="detail-label">Serie</span>
                        <span class="detail-value-mono">{{ asignacion.equipo_numero_serie }}</span>
                    </div>
                     <div class="flex flex-col">
                        <span class="detail-label">Tipo</span>
                        <span class="detail-value">{{ asignacion.equipo_tipo_nombre }}</span>
                    </div>
                </div>
            </div>

            <!-- Asignado A Info -->
            <div class="detail-card">
                <div class="detail-section-header">
                    <div class="detail-section-icon text-blue-500">
                        <i class="pi pi-user text-lg"></i>
                    </div>
                    <h2 class="detail-section-title">Asignado A</h2>
                </div>
                <div class="space-y-8">
                    <div v-if="asignacion.id_empleado" class="flex flex-col">
                        <span class="detail-label">Empleado</span>
                        <span class="detail-value text-lg">{{ asignacion.empleado_nombres }} {{ asignacion.empleado_apellidos }}</span>
                        <div v-if="asignacion.empleado_emails_corporativos" class="mt-3 flex items-center gap-2 text-sm text-primary font-bold bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-xl w-fit border border-primary/10">
                            <i class="pi pi-envelope"></i>
                            <span>{{ asignacion.empleado_emails_corporativos }}</span>
                        </div>
                    </div>
                    <div v-if="asignacion.id_sucursal_asignado" class="flex flex-col">
                        <span class="detail-label">Sucursal</span>
                        <span class="detail-value">{{ asignacion.sucursal_asignada_nombre }}</span>
                    </div>
                    <div v-if="asignacion.id_area_asignado" class="flex flex-col">
                        <span class="detail-label">Área</span>
                        <span class="detail-value">{{ asignacion.area_asignada_nombre }}</span>
                    </div>
                     <div class="flex flex-col">
                        <span class="detail-label">Red (IP)</span>
                        <span class="detail-value-mono">{{ asignacion.ip_direccion || 'No asignada' }}</span>
                    </div>
                </div>
            </div>

            <!-- Detalles Asignación -->
            <div class="detail-card">
                <div class="detail-section-header">
                    <div class="detail-section-icon text-purple-500">
                        <i class="pi pi-calendar text-lg"></i>
                    </div>
                    <h2 class="detail-section-title">Detalles</h2>
                </div>
                <div class="space-y-8">
                    <div class="flex flex-col">
                        <span class="detail-label">Fecha Inicio</span>
                        <span class="detail-value">{{ formatDate(asignacion.fecha_asignacion) }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="detail-label">Fecha Fin</span>
                         <span :class="[asignacion.fecha_fin_asignacion ? 'detail-value' : 'detail-value text-emerald-500 dark:text-emerald-400']">
                            {{ asignacion.fecha_fin_asignacion ? formatDate(asignacion.fecha_fin_asignacion) : 'En curso' }}
                         </span>
                    </div>
                    <div class="flex flex-col">
                        <span class="detail-label">Observaciones</span>
                        <p class="detail-content-box mt-1">{{ asignacion.observacion || 'Ninguna' }}</p>
                    </div>
                </div>
            </div>

            <!-- Componentes List (Full Width) -->
            <div class="lg:col-span-3 detail-card !p-0 overflow-hidden">
                 <div class="px-8 py-6 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/20">
                     <h3 class="detail-section-title flex items-center gap-3">
                        <div class="detail-section-icon text-orange-500 bg-orange-500/10">
                            <i class="pi pi-box text-lg"></i>
                        </div>
                        Componentes Adicionales
                     </h3>
                     <button 
                        v-if="isActive" 
                        class="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        @click="openManageComponentes"
                    >
                        <i class="pi pi-plus-circle"></i>
                        <span>Gestionar o Añadir Componentes</span>
                    </button>
                 </div>
                 
                 <div class="p-4">
                    <div v-if="componentes.length === 0" class="text-center py-10">
                        <div class="w-16 h-16 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="pi pi-box text-2xl text-gray-300"></i>
                        </div>
                        <p class="text-light-muted dark:text-dark-muted font-medium">No hay componentes adicionales asignados.</p>
                    </div>

                    <!-- Tabla HTML Nativa de Componentes -->
                    <table v-else class="w-full">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-white/10">
                                <th class="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-3 px-2">Equipo</th>
                                <th class="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-3 px-2">Serie</th>
                                <th class="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-3 px-2">Tipo</th>
                                <th class="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-3 px-2">Marca</th>
                                <th class="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-3 px-2">Modelo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="comp in componentes" :key="comp.id" class="border-b border-gray-100 dark:border-white/5 hover:bg-primary/5 transition-colors">
                                <td class="py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">{{ comp.equipo_nombre }}</td>
                                <td class="py-3 px-2"><span class="font-mono text-primary font-bold text-sm">{{ comp.equipo_numero_serie }}</span></td>
                                <td class="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{{ comp.tipo_equipo_nombre }}</td>
                                <td class="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{{ comp.marca }}</td>
                                <td class="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{{ comp.modelo }}</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
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
                        :maxSelectedLabels="0"
                        selectedItemsLabel="{0} Componentes Seleccionados"
                        :showSelectAll="false"
                        :selectAll="false"
                        class="w-full custom-select"
                    />
                </div>
            </div>
            <template #footer>
                <button class="btn-secondary" @click="cancelManageComponentes">Cancelar</button>
                <button class="btn-primary" :disabled="savingComponentes" @click="saveComponentes">
                    <i v-if="savingComponentes" class="pi pi-spinner pi-spin"></i>
                    <span>Guardar Cambios</span>
                </button>
            </template>
        </Dialog>
    </div>
</template>

<!-- Estilos Globales para afectar al Overlay que se renderiza en el body -->
<style>
/* Ocultar checkbox "Select All" en el encabezado del MultiSelect */
[data-pc-name="multiselect"] [data-pc-section="headercheckboxcontainer"],
[data-pc-name="multiselect"] [data-pc-section="headercheckbox"],
[data-pc-name="multiselect"] [data-pc-section="pcheadercheckbox"],
[data-pc-name="multiselect"] [data-pc-name="pcheadercheckbox"],
.p-multiselect-header .p-checkbox,
.p-multiselect-header > .p-checkbox-box,
[data-pc-section="header"] > [data-pc-name="checkbox"] {
    display: none !important;
}
</style>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Force hide the header checkbox in MultiSelect using PrimeVue internal attributes */
:deep([data-pc-section="headercheckboxcontainer"]),
:deep([data-pc-name="pcheadercheckbox"]) {
    display: none !important;
}
</style>
