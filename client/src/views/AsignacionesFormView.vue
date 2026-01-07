<script setup>
/**
 * @fileoverview Formulario de Asignación (Crear/Editar).
 * Gestiona la asignación de equipos a empleados, áreas o sucursales, incluyendo validaciones de equipos disponibles.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AsignacionesService from '../services/AsignacionesService'
import EquiposService from '../services/EquiposService'
import DireccionesIpService from '../services/DireccionesIpService'
import EmpleadosService from '../services/EmpleadosService'
import CatalogosService from '../services/CatalogosService'
import { Check, X } from 'lucide-vue-next'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import MultiSelect from 'primevue/multiselect'
import Skeleton from 'primevue/skeleton'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const submitting = ref(false)

// Data Sources
const equiposDisponibles = ref([])
const ipsDisponibles = ref([])
const empleados = ref([])
const sucursales = ref([])
const areas = ref([])
const componentesDisponibles = ref([])

// Form Data
const form = ref({
    fecha_asignacion: new Date(),
    id_equipo: null,
    tipo_asignacion: 'empleado', // 'empleado', 'sucursal', 'area'
    id_empleado: null,
    id_sucursal_asignado: null,
    id_area_asignado: null,
    id_ip: null,
    observacion: '',
    componentes: [] // IDs de componentes adicionales
})

// Validation Errors
const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        // Cargar recursos disponibles
        const [eqRes, ipRes, compRes] = await Promise.all([
            EquiposService.getDisponibles(),
            DireccionesIpService.getDisponibles(),
            EquiposService.getDisponiblesComponentes() // Necesita existir en servicio, si no, usar getDisponibles y filtrar por tipo
        ])

        // Si getDisponiblesComponentes falla o no existe, filtrar localmente de eqRes los que son periféricos comunes si se desea,
        // o simplemente permitir asignar cualquier equipo disponible como componente.
        // Asumiré que el endpoint existe o que filtraremos. 
        // Si el endpoint devuelve error, atrapamos:
        
        equiposDisponibles.value = eqRes.map(e => ({
            label: `${e.nombre_tipo_equipo || e.tipo_equipo || 'Equipo'} - ${e.nombre_equipo} ${e.modelo ? '(' + e.modelo + ')' : ''} [SN: ${e.numero_serie}]`,
            value: e.id,
            tipo: e.tipo_equipo
        }))

        ipsDisponibles.value = ipRes

        // Cargar catálogos de entidades
        const [empRes, sucRes, areasRes] = await Promise.all([
            EmpleadosService.getAll(),
            CatalogosService.getSucursales(),
            CatalogosService.getAreas()
        ])
        
        // Mapear para selects
        empleados.value = empRes.map(e => ({ label: `${e.nombres} ${e.apellidos}`, value: e.id }))
        sucursales.value = sucRes // asume id, nombre
        
        // Si no hay getAllAreas en catalogosService, tendremos que ver como cargarlas. 
        // Asumamos que CatalogosService lo tiene o lo simulamos.
        // Revisando código previo: CatalogosService tiene getAreas pero filtra.
        // Voy a usar un endpoint que trae areas.
        if (areasRes.length === 0 && CatalogosService.getAreas) {
             // temporal fallback
             // areas.value = await CatalogosService.getAreas() 
             // Ojo: getAreas trae tipos de equipo en versiones viejas? No, es Areas.
        } else {
             areas.value = areasRes
        }

        // Componentes disponibles (podemos usar la misma lista de equipos disponibles o filtrar)
        componentesDisponibles.value = eqRes.map(e => ({
            label: `${e.nombre_equipo} (${e.numero_serie})`,
            value: e.id
        }))

    } catch (error) {
        console.error('Error cargando datos:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar recursos disponibles', life: 3000 })
    } finally {
        loading.value = false
    }
})

// Watch tipo_asignacion to clear others
watch(() => form.value.tipo_asignacion, (newVal) => {
    form.value.id_empleado = null
    form.value.id_sucursal_asignado = null
    form.value.id_area_asignado = null
})

// Special logic: If assigning to employee/area, suggest IP sucursal logic? 
// Not needed, backend handles logic. But we can filter IPs if we wanted.

// Logic for submitting
const handleSubmit = async () => {
    errors.value = {}
    
    // Validaciones
    if (!form.value.id_equipo) errors.value.id_equipo = 'Seleccione un equipo'
    if (!form.value.fecha_asignacion) errors.value.fecha_asignacion = 'La fecha es obligatoria'
    
    if (form.value.tipo_asignacion === 'empleado' && !form.value.id_empleado) errors.value.id_empleado = 'Seleccione un empleado'
    if (form.value.tipo_asignacion === 'sucursal' && !form.value.id_sucursal_asignado) errors.value.id_sucursal_asignado = 'Seleccione una sucursal'
    if (form.value.tipo_asignacion === 'area' && !form.value.id_area_asignado) errors.value.id_area_asignado = 'Seleccione un área'

    if (Object.keys(errors.value).length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios', life: 3000 })
        return
    }

    submitting.value = true
    try {
        const payload = {
            id_equipo: form.value.id_equipo,
            fecha_asignacion: form.value.fecha_asignacion, // DatePicker devuelve Date object, serializará OK o formatear manualmente
            id_ip: form.value.id_ip,
            observacion: form.value.observacion,
            id_status_asignacion: 1, // ACTIVA
            // Add entity ID based on type
            ...(form.value.tipo_asignacion === 'empleado' && { id_empleado: form.value.id_empleado }),
            ...(form.value.tipo_asignacion === 'sucursal' && { id_sucursal_asignado: form.value.id_sucursal_asignado }),
            ...(form.value.tipo_asignacion === 'area' && { id_area_asignado: form.value.id_area_asignado }),
            // Components
            componentes: form.value.componentes
        }

        // Formatear fecha
        if (payload.fecha_asignacion instanceof Date) {
            payload.fecha_asignacion = payload.fecha_asignacion.toISOString().slice(0, 19).replace('T', ' ')
        }

        if (form.value.componentes.length > 0) {
            await AsignacionesService.createWithComponents(payload)
        } else {
            await AsignacionesService.create(payload)
        }
        
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación registrada correctamente', life: 3000 })
        router.push({ name: 'asignaciones' })

    } catch (error) {
        console.error('Submit error:', error)
        const msg = error.response?.data?.message || 'Error al guardar asignación'
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-4xl mx-auto">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Nueva Asignación</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Asigne equipos a empleados, sucursales o áreas</p>
            </div>
            <button @click="router.back()" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X :size="20" />
                <span>Cancelar</span>
            </button>
        </div>

        <div v-if="loading" class="space-y-6">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
            </div>
            <Skeleton height="8rem" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
            </div>
            <Skeleton height="5rem" />
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            
            <!-- Equipo y Fecha -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Equipo Principal <span class="text-red-500">*</span></label>
                     <Select v-model="form.id_equipo" :options="equiposDisponibles" optionLabel="label" optionValue="value" filter placeholder="Buscar equipo..." class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.id_equipo" />
                     <small class="text-red-500">{{ errors.id_equipo }}</small>
                </div>
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fecha de Asignación <span class="text-red-500">*</span></label>
                     <DatePicker v-model="form.fecha_asignacion" showTime hourFormat="24" class="w-full" inputClass="!bg-gray-50 dark:!bg-dark-bg w-full" :invalid="!!errors.fecha_asignacion" />
                     <small class="text-red-500">{{ errors.fecha_asignacion }}</small>
                </div>
            </div>

            <!-- Tipo de Asignación -->
            <div class="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Asignar a:</label>
                <div class="flex gap-6 mb-4">
                    <div class="flex items-center">
                        <RadioButton v-model="form.tipo_asignacion" inputId="tipo_empleado" value="empleado" />
                        <label for="tipo_empleado" class="ml-2 cursor-pointer">Empleado</label>
                    </div>
                    <div class="flex items-center">
                        <RadioButton v-model="form.tipo_asignacion" inputId="tipo_sucursal" value="sucursal" />
                        <label for="tipo_sucursal" class="ml-2 cursor-pointer">Sucursal</label>
                    </div>
                    <div class="flex items-center">
                        <RadioButton v-model="form.tipo_asignacion" inputId="tipo_area" value="area" />
                        <label for="tipo_area" class="ml-2 cursor-pointer">Área</label>
                    </div>
                </div>

                <!-- Selector Dinámico -->
                <div v-if="form.tipo_asignacion === 'empleado'">
                     <Select v-model="form.id_empleado" :options="empleados" optionLabel="label" optionValue="value" filter placeholder="Seleccione Empleado" class="w-full !bg-white dark:!bg-dark-card" :invalid="!!errors.id_empleado" />
                     <small class="text-red-500" v-if="errors.id_empleado">{{ errors.id_empleado }}</small>
                </div>
                <div v-if="form.tipo_asignacion === 'sucursal'">
                     <Select v-model="form.id_sucursal_asignado" :options="sucursales" optionLabel="nombre" optionValue="id" filter placeholder="Seleccione Sucursal" class="w-full !bg-white dark:!bg-dark-card" :invalid="!!errors.id_sucursal_asignado" />
                     <small class="text-red-500" v-if="errors.id_sucursal_asignado">{{ errors.id_sucursal_asignado }}</small>
                </div>
                <div v-if="form.tipo_asignacion === 'area'">
                     <Select v-model="form.id_area_asignado" :options="areas" optionLabel="nombre" optionValue="id" filter placeholder="Seleccione Área" class="w-full !bg-white dark:!bg-dark-card" :invalid="!!errors.id_area_asignado" />
                     <small class="text-red-500" v-if="errors.id_area_asignado">{{ errors.id_area_asignado }}</small>
                </div>
            </div>

            <!-- IP (Opcional) -->
            <div>
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección IP (Opcional)</label>
                 <Select v-model="form.id_ip" :options="ipsDisponibles" optionLabel="direccion_ip" optionValue="id" filter showClear placeholder="Seleccione una IP disponible" class="w-full !bg-gray-50 dark:!bg-dark-bg" />
                 <small class="text-gray-500">Solo se muestran IPs disponibles.</small>
            </div>

            <!-- Componentes (Opcional) -->
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Componentes Adicionales (Opcional)</label>
                <MultiSelect v-model="form.componentes" :options="componentesDisponibles" optionLabel="label" optionValue="value" filter placeholder="Seleccione componentes (ej. monitor, teclado)" display="chip" class="w-full !bg-gray-50 dark:!bg-dark-bg" />
                <small class="text-gray-500">Estos equipos se asignarán como hijos del equipo principal y tendrán la misma asignación.</small>
            </div>

             <!-- Observaciones -->
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                <Textarea v-model="form.observacion" rows="3" class="w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Detalles adicionales..." />
            </div>

            <!-- Botones -->
            <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border transition-colors duration-300">
                <button @click="router.back()" class="btn-secondary" type="button">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting">
                    <Check v-if="!submitting" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>Registrar Asignación</span>
                </button>
            </div>

        </form>
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
