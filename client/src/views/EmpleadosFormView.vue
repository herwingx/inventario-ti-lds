<script setup>
/**
 * @fileoverview Formulario de Empleado (Crear/Editar).
 * Gestiona el alta y modificación de empleados, vinculándolos a empresas y áreas.
 */
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import EmpleadosService from '../services/EmpleadosService'
import CatalogosService from '../services/CatalogosService'
import { getStatusSeverity } from '../utils/status'
import { Check, X, Info, Calendar as CalendarIcon } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'
import Tag from 'primevue/tag'
import CorreosService from '../services/CorreosService' // Import CorreosService

const route = useRoute()
const router = useRouter()
const { confirmWarning, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

// Estados de Carga
const loading = ref(false)
const submitting = ref(false)
const isDirty = ref(false)
const isSaved = ref(false)

// Datos de Catálogos
const empresas = ref([])
const allAreas = ref([]) // Todas las áreas
const areas = ref([]) // Áreas filtradas por empresa
const statuses = ref([])
const allCorreos = ref([]) // Todos los correos

// Modelo del Formulario
const form = ref({
    numero_empleado: '',
    nombres: '',
    apellidos: '',
    email_personal: '',
    telefono: '',
    puesto: '',
    fecha_nacimiento: null,
    fecha_ingreso: null,
    id_empresa: null,
    id_area: null,
    id_status: null,
    asignar_id_correo: null // Nuevo campo para asignación
})

// Monitorear cambios
watch(form, () => {
    if (!loading.value && !submitting.value && !isSaved.value) {
        isDirty.value = true
    }
}, { deep: true })

// Guardia de navegación
onBeforeRouteLeave(async (to, from) => {
    if (isDirty.value && !isSaved.value) {
        const result = await confirmWarning({
            title: 'Cambios no guardados',
            text: 'Tienes cambios pendientes en el formulario del empleado. ¿Deseas salir?',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme'
        })
        if (!result.isConfirmed) return false
        toastInfo('Operación cancelada')
    }
})

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Empleado #${route.params.id}` : 'Registrar Nuevo Empleado')

// Computed para filtrar correos disponibles
const availableEmails = computed(() => {
    return allCorreos.value.filter(correo => {
        // Mostrar si NO tiene asignado a nadie O si está asignado al empleado actual que estamos editando
        return !correo.id_empleado_asignado || (isEditing.value && correo.id_empleado_asignado == route.params.id)
    })
})

// Validaciones simples
const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        // Cargar catálogos en paralelo
        const [empresasRes, areasRes, statusRes, correosRes] = await Promise.all([
            CatalogosService.getEmpresas(),
            CatalogosService.getAreas(),
            CatalogosService.getStatuses(),
            CorreosService.getAll() // Obtener todos los correos
        ])
        
        empresas.value = empresasRes
        allAreas.value = areasRes // Guardar todas las áreas
        statuses.value = statusRes
        allCorreos.value = correosRes

        // Si es edición, cargar datos del empleado
        if (isEditing.value) {
            const empleadoData = await EmpleadosService.getById(route.params.id)
            populateForm(empleadoData)
            // Filtrar áreas según la empresa del empleado
            if (empleadoData.id_empresa) {
                areas.value = allAreas.value.filter(area => area.id_empresa === empleadoData.id_empresa)
            }
            
            // Buscar si este empleado ya tiene un correo asignado para preseleccionar
            const currentEmail = allCorreos.value.find(c => c.id_empleado_asignado == route.params.id)
            if (currentEmail) {
                form.value.asignar_id_correo = currentEmail.id
            }

        } else {
            // Predetectar estado ACTIVO si existe
            const defaultStatus = statuses.value.find(s => s.nombre_status === 'ACTIVO')
            if (defaultStatus) form.value.id_status = defaultStatus.id
        }
    } catch (error) {
        console.error('Error cargando datos:', error)
        toastError('No se pudieron cargar los datos necesarios.')
    } finally {
        loading.value = false
    }
})

const populateForm = (data) => {
    form.value.numero_empleado = data.numero_empleado
    form.value.nombres = data.nombres
    form.value.apellidos = data.apellidos
    form.value.email_personal = data.email_personal
    form.value.telefono = data.telefono
    form.value.puesto = data.puesto
    form.value.fecha_nacimiento = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null
    form.value.fecha_ingreso = data.fecha_ingreso ? new Date(data.fecha_ingreso) : null
    form.value.id_empresa = data.id_empresa
    form.value.id_area = data.id_area
    form.value.id_status = data.id_status
}

// Helpers Texto
const toUpperCase = (field) => {
    if (form.value[field]) {
        form.value[field] = form.value[field].toUpperCase()
    }
}

const capitalize = (field) => {
    if (form.value[field]) {
        form.value[field] = form.value[field]
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }
}

// Helper Severidad Estado
const getSeverity = getStatusSeverity

// Watcher para filtrar áreas cuando cambia la empresa
watch(() => form.value.id_empresa, (newEmpresa) => {
    if (newEmpresa) {
        // Filtrar áreas por empresa
        areas.value = allAreas.value.filter(area => area.id_empresa === newEmpresa)
        // Limpiar área seleccionada si ya no pertenece a la nueva empresa
        if (form.value.id_area) {
            const areaExists = areas.value.find(area => area.id === form.value.id_area)
            if (!areaExists) {
                form.value.id_area = null
            }
        }
    } else {
        // Si no hay empresa, mostrar todas las áreas
        areas.value = allAreas.value
    }
})

// Submit
const handleSubmit = async () => {
    // Validaciones
    errors.value = {}
    if (!form.value.nombres) errors.value.nombres = 'El nombre es obligatorio'
    if (!form.value.apellidos) errors.value.apellidos = 'Los apellidos son obligatorios'
    if (!form.value.id_status) errors.value.id_status = 'El estado es obligatorio'

    if (Object.keys(errors.value).length > 0) {
        toastError('Por favor complete los campos obligatorios.')
        return
    }

    submitting.value = true
    try {
        // Construir payload
        const payload = { ...form.value }
        
        // Formato fechas (YYYY-MM-DD) para enviar backend
        if (payload.fecha_nacimiento) {
            payload.fecha_nacimiento = payload.fecha_nacimiento.toISOString().split('T')[0]
        }
        if (payload.fecha_ingreso) {
            payload.fecha_ingreso = payload.fecha_ingreso.toISOString().split('T')[0]
        }

        if (isEditing.value) {
            await EmpleadosService.update(route.params.id, payload)
            toastSuccess('Empleado actualizado correctamente')
        } else {
            await EmpleadosService.create(payload)
            toastSuccess('Empleado registrado correctamente')
        }

        isSaved.value = true
        // Navegar de vuelta tras un breve delay
        setTimeout(() => {
            router.replace({ name: 'empleados' })
        }, 1000)

    } catch (error) {
        console.error('Error submit:', error)
        const msg = error.response?.data?.message || 'Error al guardar el empleado'
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
        router.push({ name: 'empleados' })
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-7xl mx-auto">
    
    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        <div class="flex flex-col gap-6">
            <Skeleton width="10rem" height="2rem" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
            </div>
        </div>
    </div>

    <!-- Form Container -->
    <div v-else class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 dark:border-dark-border transition-colors duration-300">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Complete la información del empleado</p>
            </div>
        </div>

        <form @submit.prevent="handleSubmit">
            <Fluid>
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-8">
                     
                     <!-- NOMBRES & APELLIDOS -->
                     <div class="md:col-span-1">
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombres <span class="text-red-500">*</span></label>
                         <InputText v-model="form.nombres" @blur="capitalize('nombres')" placeholder="Ej: Juan Carlos" :invalid="!!errors.nombres" class="!bg-gray-50 dark:!bg-dark-bg" />
                         <small class="text-red-500" v-if="errors.nombres">{{ errors.nombres }}</small>
                     </div>
                     <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Apellidos <span class="text-red-500">*</span></label>
                        <InputText v-model="form.apellidos" @blur="capitalize('apellidos')" placeholder="Ej: García López" :invalid="!!errors.apellidos" class="!bg-gray-50 dark:!bg-dark-bg" />
                        <small class="text-red-500" v-if="errors.apellidos">{{ errors.apellidos }}</small>
                    </div>

                    <!-- NUMERO EMPLEADO & EMAIL -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">No. Empleado</label>
                        <InputText v-model="form.numero_empleado" @input="toUpperCase('numero_empleado')" placeholder="Ej: EMP001" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Personal</label>
                        <InputText v-model="form.email_personal" type="email" placeholder="ejemplo@correo.com" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>

                    <!-- ASIGNACIÓN DE CORREO CORPORATIVO -->
                    <div class="md:col-span-2 border-t border-gray-100 dark:border-dark-border pt-6 mt-2">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            <div class="flex items-center gap-2">
                                <Info :size="16" class="text-blue-500" />
                                Asignar Correo Corporativo
                            </div>
                        </label>
                        <Select 
                            v-model="form.asignar_id_correo" 
                            :options="availableEmails" 
                            optionLabel="email" 
                            optionValue="id" 
                            placeholder="Seleccione un correo disponible (Opcional)" 
                            filter 
                            showClear
                            class="!bg-gray-50 dark:!bg-dark-bg w-full" 
                        >
                            <template #option="slotProps">
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ slotProps.option.email }}</span>
                                    <span v-if="slotProps.option.usuario_email" class="text-xs text-gray-500">Usuario: {{ slotProps.option.usuario_email }}</span>
                                </div>
                            </template>
                        </Select>
                         <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                            Seleccione una cuenta de correo corporativo existente para vincularla a este empleado.
                        </small>
                    </div>

                    <!-- TELEFONO & PUESTO -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
                        <InputText v-model="form.telefono" placeholder="Ej: 5551234567" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Puesto</label>
                        <InputText v-model="form.puesto" @input="toUpperCase('puesto')" placeholder="Ej: ANALISTA DE SISTEMAS" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>

                    <!-- EMPRESA & AREA -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Empresa</label>
                        <Select v-model="form.id_empresa" :options="empresas" optionLabel="nombre" optionValue="id" placeholder="Seleccione empresa" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Área</label>
                        <Select v-model="form.id_area" :options="areas" optionLabel="nombre" optionValue="id" placeholder="Seleccione área" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                    </div>

                    <!-- FECHAS -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fecha de Nacimiento</label>
                        <div class="relative">
                            <CalendarIcon class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                            <DatePicker v-model="form.fecha_nacimiento" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD" class="w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg !pr-10 w-full'" />
                        </div>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fecha de Ingreso</label>
                        <div class="relative">
                            <CalendarIcon class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                            <DatePicker v-model="form.fecha_ingreso" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD" class="w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg !pr-10 w-full'" />
                        </div>
                    </div>

                    <!-- STATUS -->
                    <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estado <span class="text-red-500">*</span></label>
                        <Select v-model="form.id_status" :options="statuses" optionLabel="nombre_status" optionValue="id" placeholder="Seleccione Estado" class="!bg-gray-50 dark:!bg-dark-bg w-full" :invalid="!!errors.id_status">
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="flex items-center">
                                    <Tag :value="statuses.find(s => s.id === slotProps.value)?.nombre_status || 'Estado'" :severity="getSeverity(statuses.find(s => s.id === slotProps.value)?.nombre_status)" class="!text-xs !font-bold px-2 py-0.5" />
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex items-center">
                                    <Tag :value="slotProps.option.nombre_status" :severity="getSeverity(slotProps.option.nombre_status)" class="!text-xs !font-bold px-2 py-0.5" />
                                </div>
                            </template>
                        </Select>
                        <small class="text-red-500" v-if="errors.id_status">{{ errors.id_status }}</small>
                    </div>

                 </div>

                 <!-- Footer Actions -->
                 <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                     <button @click="goBack" class="btn-secondary" type="button">
                        <X :size="18" />
                        Cancelar
                    </button>
                    <button type="submit" class="btn-primary" :disabled="submitting">
                        <Check v-if="!submitting" :size="18" />
                        <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                        <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Empleado' }}</span>
                    </button>
                 </div>
            </Fluid>
        </form>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom primevue inputs overrides if needed */
:deep(.p-inputtext), :deep(.p-select) {
    transition: all 0.2s;
}
</style>
