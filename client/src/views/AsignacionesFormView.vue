<script setup>
/**
 * @fileoverview Formulario de Asignación (Crear/Editar).
 * Gestiona la asignación de equipos a empleados, áreas o sucursales, incluyendo validaciones de equipos disponibles.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import AsignacionesService from '../services/AsignacionesService'
import EquiposService from '../services/EquiposService'
import DireccionesIpService from '../services/DireccionesIpService'
import EmpleadosService from '../services/EmpleadosService'
import CatalogosService from '../services/CatalogosService'
import AreasService from '../services/AreasService'
import { Check, X, Calendar as CalendarIcon } from 'lucide-vue-next'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import MultiSelect from 'primevue/multiselect'
import Skeleton from 'primevue/skeleton'

const router = useRouter()
const route = useRoute()
const { confirmWarning, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Asignación #${route.params.id}` : 'Nueva Asignación')

const loading = ref(false)
const submitting = ref(false)
const isDirty = ref(false)
const isSaved = ref(false)

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

// Data Sources
const equiposDisponibles = ref([])
const ipsDisponibles = ref([])
const empleados = ref([])
const sucursales = ref([])
const areas = ref([])
const componentesDisponibles = ref([])

// Agrupar IPs por segmento (ej: 192.168.1.x)
const groupedIps = computed(() => {
    if (!ipsDisponibles.value || ipsDisponibles.value.length === 0) return []
    
    const groups = {}
    
    // Añadimos una IP "ninguna" opcional si se desea, o manejamos el array
    ipsDisponibles.value.forEach(ip => {
        if (!ip) return
        const parts = (ip.direccion_ip || '').split('.')
        let segment = 'Otros Segmentos'
        
        if (parts.length === 4) {
            segment = `${parts[0]}.${parts[1]}.${parts[2]}.x`
        }
        
        if (!groups[segment]) {
            groups[segment] = { label: segment, items: [] }
        }
        groups[segment].items.push(ip)
    })
    
    // Convertir a array y ordenar
    const sortedGroups = Object.keys(groups).sort((a, b) => {
        if (a === 'Otros Segmentos') return 1
        if (b === 'Otros Segmentos') return -1
        return a.localeCompare(b, undefined, { numeric: true })
    }).map(key => groups[key])

    return sortedGroups
})

// Función para limpiar campos al cambiar tipo de asignación no necesaria si usamos watch
// const handleTipoChange = () => { ... }

// Watch para tipo_asignacion (limpiar selecciones previas al cambiar de tipo)
watch(() => form.value.tipo_asignacion, (newVal) => {
    if (!loading.value) {
        form.value.id_empleado = null
        form.value.id_sucursal_asignado = null
        form.value.id_area_asignado = null
    }
})

// Dirty detection
watch(form, () => {
    if (!loading.value && !submitting.value && !isSaved.value) {
        isDirty.value = true
    }
}, { deep: true })

// Route guard
onBeforeRouteLeave(async (to, from) => {
    if (isDirty.value && !isSaved.value) {
        const result = await confirmWarning({
            title: 'Cambios no guardados',
            text: '¿Deseas salir? Perderás los datos de la nueva asignación.',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme'
        })
        if (!result.isConfirmed) return false
        toastInfo('Operación cancelada')
    }
})

// Validation Errors
const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        // Preparamos todas las promesas necesarias
        const queries = [
            EquiposService.getDisponibles(),
            DireccionesIpService.getDisponibles(),
            EmpleadosService.getAll(),
            CatalogosService.getSucursales(),
            AreasService.getAll()
        ]

        // Si es edición, añadimos las consultas de la asignación y sus componentes
        if (isEditing.value) {
            queries.push(AsignacionesService.getById(route.params.id))
            queries.push(AsignacionesService.getComponentes(route.params.id))
        }

        // Ejecutamos TODO en paralelo (un solo tiempo de espera)
        const results = await Promise.all(queries)
        
        const [eqRes, ipRes, empRes, sucRes, areasRes] = results
        
        // Mapear Equipos Principales
        const tiposPrincipales = ['LAPTOP', 'COMPUTADORA', 'SERVIDOR', 'TODO EN UNO', 'DESKTOP']
        equiposDisponibles.value = (eqRes || [])
            .filter(e => tiposPrincipales.includes((e.nombre_tipo_equipo || '').toUpperCase()))
            .map(e => ({
                label: `${e.nombre_tipo_equipo || e.tipo_equipo || 'Equipo'} - ${e.nombre_equipo} ${e.modelo ? '(' + e.modelo + ')' : ''} [SN: ${e.numero_serie}]`,
                value: e.id,
                tipo: e.tipo_equipo
            }))

        ipsDisponibles.value = ipRes || []
        empleados.value = Array.isArray(empRes) ? empRes.map(e => ({ label: `${e.nombres} ${e.apellidos}`, value: e.id })) : []
        sucursales.value = Array.isArray(sucRes) ? sucRes : []
        areas.value = Array.isArray(areasRes) ? areasRes : []

        // Componentes disponibles
        componentesDisponibles.value = (eqRes || []).map(e => ({
            label: `[${e.nombre_tipo_equipo || 'Equipo'}] ${e.nombre_equipo} (${e.numero_serie})`,
            value: e.id
        }))

        // Si es edición, poblar formulario con los resultados ya cargados
        if (isEditing.value) {
            const assignmentData = results[5]
            const componentsData = results[6]
            await populateFormOptimized(assignmentData, componentsData)
        }

    } catch (error) {
        console.error('Error cargando datos:', error)
        toastError('Error al cargar la información del formulario')
    } finally {
        loading.value = false
    }
})

const populateFormOptimized = async (data, comps) => {
    // Asegurar equipo actual en lista
    if (!equiposDisponibles.value.find(e => e.value === data.id_equipo)) {
        equiposDisponibles.value.unshift({
            label: `${data.equipo_tipo_nombre || 'Equipo'} - ${data.equipo_nombre} [SN: ${data.equipo_numero_serie}] (Actual)`,
            value: data.id_equipo
        })
    }

    // Asegurar IP actual en lista
    if (data.id_ip && !ipsDisponibles.value.find(ip => ip.id === data.id_ip)) {
        ipsDisponibles.value.unshift({
            id: data.id_ip,
            direccion_ip: data.ip_direccion || data.direccion_ip || 'IP Actual'
        })
    }

    form.value = {
        fecha_asignacion: data.fecha_asignacion ? new Date(data.fecha_asignacion) : new Date(),
        id_equipo: data.id_equipo,
        tipo_asignacion: (data.id_empleado || data.empleado_nombres) ? 'empleado' : (data.id_sucursal_asignado ? 'sucursal' : 'area'),
        id_empleado: data.id_empleado,
        id_sucursal_asignado: data.id_sucursal_asignado,
        id_area_asignado: data.id_area_asignado,
        id_ip: data.id_ip,
        observacion: data.observacion || '',
        componentes: comps ? comps.map(c => c.id_equipo || c.id_equipo_hijo) : []
    }

    // Registrar componentes en la lista de opciones
    if (comps) {
        comps.forEach(c => {
            const cId = c.id_equipo || c.id_equipo_hijo
            if (!componentesDisponibles.value.find(opt => opt.value === cId)) {
                componentesDisponibles.value.push({
                    label: `[${c.tipo_equipo_nombre || 'Equipo'}] ${c.equipo_nombre || c.equipo_hijo_nombre} [SN: ${c.equipo_numero_serie || c.equipo_hijo_serie || 'N/A'}]`,
                    value: cId
                })
            }
        })
    }
}

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
        toastError('Complete los campos obligatorios')
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

        if (isEditing.value) {
            await AsignacionesService.update(route.params.id, payload) // Pass the constructed payload
            // Assuming updateComponentes expects the assignment ID and an array of component IDs
            if (form.value.componentes.length >= 0) { // Check if components array exists, even if empty, to allow clearing
                 await AsignacionesService.updateComponentes(route.params.id, form.value.componentes)
            }
            toastSuccess('Asignación actualizada correctamente')
        } else {
            if (form.value.componentes.length > 0) {
                await AsignacionesService.createWithComponents(payload) // Pass the constructed payload
            } else {
                await AsignacionesService.create(payload) // Pass the constructed payload
            }
            toastSuccess('Asignación creada correctamente')
        }
        isSaved.value = true
        router.replace({ name: 'asignaciones' })

    } catch (error) {
        console.error('Submit error:', error)
        const msg = error.response?.data?.message || 'Error al guardar asignación'
        toastError(msg)
    } finally {
        submitting.value = false
    }
}

const goBack = async () => {
    const result = await confirmWarning({
        title: 'Confirmar Salida',
        text: '¿Está seguro de que desea salir? Los cambios no guardados se perderán.',
        confirmButtonText: 'Salir sin Guardar',
        cancelButtonText: 'Continuar Editando'
    })
    
    if (result.isConfirmed) {
        isDirty.value = false
        toastInfo('Operación cancelada')
        router.push({ name: 'asignaciones' })
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-4xl mx-auto">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Asigne equipos a empleados, sucursales o áreas</p>
            </div>
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
                     <div class="relative">
                         <CalendarIcon class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                         <DatePicker v-model="form.fecha_asignacion" showTime hourFormat="24" placeholder="YYYY-MM-DD HH:mm" class="w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg !pr-10 w-full'" :invalid="!!errors.fecha_asignacion" />
                     </div>
                     <small class="text-red-500">{{ errors.fecha_asignacion }}</small>
                </div>
            </div>

            <!-- Tipo de Asignación -->
            <div class="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Asignar a:</label>
                <div class="flex flex-wrap gap-4 md:gap-8 mb-4">
                    <div 
                        class="flex items-center px-4 py-2 rounded-xl border border-transparent hover:bg-white dark:hover:bg-dark-card hover:shadow-sm cursor-pointer transition-all duration-200"
                        @click="form.tipo_asignacion = 'empleado'"
                    >
                        <RadioButton v-model="form.tipo_asignacion" inputId="tipo_empleado" value="empleado" />
                        <label for="tipo_empleado" class="ml-2 cursor-pointer font-bold text-gray-700 dark:text-gray-200">Empleado</label>
                    </div>
                    
                    <div 
                        class="flex items-center px-4 py-2 rounded-xl border border-transparent hover:bg-white dark:hover:bg-dark-card hover:shadow-sm cursor-pointer transition-all duration-200"
                        @click="form.tipo_asignacion = 'sucursal'"
                    >
                        <RadioButton v-model="form.tipo_asignacion" inputId="tipo_sucursal" value="sucursal" />
                        <label for="tipo_sucursal" class="ml-2 cursor-pointer font-bold text-gray-700 dark:text-gray-200">Sucursal</label>
                    </div>
                    
                    <div 
                        class="flex items-center px-4 py-2 rounded-xl border border-transparent hover:bg-white dark:hover:bg-dark-card hover:shadow-sm cursor-pointer transition-all duration-200"
                        @click="form.tipo_asignacion = 'area'"
                    >
                        <RadioButton v-model="form.tipo_asignacion" inputId="tipo_area" value="area" />
                        <label for="tipo_area" class="ml-2 cursor-pointer font-bold text-gray-700 dark:text-gray-200">Área</label>
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
                  <Select 
                    v-model="form.id_ip" 
                    :options="groupedIps" 
                    optionLabel="direccion_ip" 
                    optionValue="id" 
                    optionGroupLabel="label" 
                    optionGroupChildren="items"
                    filter 
                    showClear 
                    placeholder="Seleccione una IP disponible" 
                    class="w-full !bg-gray-50 dark:!bg-dark-bg" 
                    :virtualScrollerOptions="{ itemSize: 38 }"
                  />
                 <small class="text-gray-500">Solo se muestran IPs disponibles.</small>
            </div>

            <!-- Componentes (Opcional) -->
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Componentes Adicionales (Opcional)</label>
                <MultiSelect 
                    v-model="form.componentes" 
                    :options="componentesDisponibles" 
                    optionLabel="label" 
                    optionValue="value" 
                    filter 
                    placeholder="Seleccione componentes" 
                    :maxSelectedLabels="0"
                    selectedItemsLabel="{0} componentes seleccionados"
                    class="w-full !bg-gray-50 dark:!bg-dark-bg" 
                />
                <small class="text-gray-500">Mouses, teclados, monitores u otros equipos que dependen de este equipo.</small>
            </div>

             <!-- Observaciones -->
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                <Textarea v-model="form.observacion" rows="3" class="w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Detalles adicionales..." />
            </div>

            <!-- Botones -->
            <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border transition-colors duration-300">
                <button @click="goBack" class="btn-secondary" type="button">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting">
                    <Check v-if="!submitting" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>{{ isEditing ? 'Actualizar Asignación' : 'Registrar Asignación' }}</span>
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
