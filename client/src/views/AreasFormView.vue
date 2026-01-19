<script setup>
/**
 * @fileoverview Formulario de Área (Crear/Editar).
 * Permite registrar una nueva área o modificar una existente, validando campos obbligatorios.
 */
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import AreasService from '../services/AreasService'
import CatalogosService from '../services/CatalogosService'
import { getStatusSeverity } from '../utils/status'

import { Check, X } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'
import Tag from 'primevue/tag'

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
const allSucursales = ref([])
const sucursales = ref([]) // Sucursales filtradas por empresa
const statuses = ref([])

// Modelo del Formulario
const form = ref({
    nombre: '',
    id_sucursal: null, // Backend requiere sucursal corporativa
    id_status: null
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
            text: '¿Estás seguro de que deseas salir? Se perderán las modificaciones del área.',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme'
        })
        if (!result.isConfirmed) return false
        toastInfo('Operación cancelada')
    }
})
const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Área #${route.params.id}` : 'Registrar Nueva Área')

// Validaciones simples
const errors = ref({})

// Empresa seleccionada (para filtrar sucursales)
const selectedEmpresa = ref(null)

onMounted(async () => {
    loading.value = true
    try {
        // Cargar catálogos en paralelo
        const [empresasRes, sucursalesRes, statusRes] = await Promise.all([
            CatalogosService.getEmpresas(),
            CatalogosService.getSucursales(),
            CatalogosService.getStatuses()
        ])
        
        empresas.value = empresasRes
        allSucursales.value = sucursalesRes
        statuses.value = statusRes

        // Si es edición, cargar datos del área
        if (isEditing.value) {
            const areaData = await AreasService.getById(route.params.id)
            populateForm(areaData)
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
    form.value.nombre = data.nombre
    form.value.id_sucursal = data.id_sucursal
    form.value.id_status = data.id_status
    
    // Si hay id_empresa, seleccionarla para filtrar sucursales
    if (data.id_empresa) {
        selectedEmpresa.value = data.id_empresa
        sucursales.value = allSucursales.value.filter(s => s.id_empresa === data.id_empresa)
    }
}

// Helpers Texto
const toUpperCase = (field) => {
    if (form.value[field]) {
        form.value[field] = form.value[field].toUpperCase()
    }
}

// Helper Severidad Estado
const getSeverity = getStatusSeverity

// Watcher para filtrar sucursales cuando cambia la empresa
watch(selectedEmpresa, (newEmpresa) => {
    if (newEmpresa) {
        // Filtrar sucursales por empresa
        sucursales.value = allSucursales.value.filter(s => s.id_empresa === newEmpresa)
        // Limpiar sucursal seleccionada si ya no pertenece a la nueva empresa
        if (form.value.id_sucursal) {
            const sucursalExists = sucursales.value.find(s => s.id === form.value.id_sucursal)
            if (!sucursalExists) {
                form.value.id_sucursal = null
            }
        }
    } else {
        // Si no hay empresa, mostrar todas las sucursales
        sucursales.value = allSucursales.value
    }
})

// Submit
const handleSubmit = async () => {
    // Validaciones
    errors.value = {}
    if (!form.value.nombre) errors.value.nombre = 'El nombre es obligatorio'
    if (!form.value.id_sucursal) errors.value.id_sucursal = 'La sucursal es obligatoria'
    if (!form.value.id_status) errors.value.id_status = 'El estado es obligatorio'

    if (Object.keys(errors.value).length > 0) {
        toastError('Por favor complete los campos obligatorios.')
        return
    }

    submitting.value = true
    try {
        const payload = { ...form.value }

        if (isEditing.value) {
            await AreasService.update(route.params.id, payload)
            toastSuccess('Área actualizada correctamente')
        } else {
            await AreasService.create(payload)
            toastSuccess('Área registrada correctamente')
        }

        isSaved.value = true
        // Navegar de vuelta tras un breve delay
        setTimeout(() => {
            router.replace({ name: 'areas' })
        }, 1000)

    } catch (error) {
        console.error('Error submit:', error)
        const msg = error.response?.data?.message || 'Error al guardar el área'
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
        router.push({ name: 'areas' })
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-4xl mx-auto">
    
    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        <div class="flex flex-col gap-6">
            <Skeleton width="10rem" height="2rem" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Complete la información del área organizacional</p>
            </div>
            <button @click="goBack" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X :size="20" />
                <span>Cancelar</span>
            </button>
        </div>

        <form @submit.prevent="handleSubmit">
            <Fluid>
                 <div class="grid grid-cols-1 gap-6 gap-y-8">
                     
                     <!-- NOMBRE -->
                     <div>
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre del Área <span class="text-red-500">*</span></label>
                         <InputText v-model="form.nombre" @input="toUpperCase('nombre')" placeholder="Ej: RECURSOS HUMANOS" :invalid="!!errors.nombre" class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                         <small class="text-red-500" v-if="errors.nombre">{{ errors.nombre }}</small>
                     </div>

                    <!-- EMPRESA (para filtrar sucursales) -->
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Empresa <span class="text-gray-400 text-xs">(para filtrar sucursales)</span></label>
                        <Select v-model="selectedEmpresa" :options="empresas" optionLabel="nombre" optionValue="id" placeholder="Seleccione empresa" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" showClear />
                        <small class="text-gray-500 text-xs mt-1 block">Seleccione una empresa para ver solo sus sucursales corporativas</small>
                    </div>

                    <!-- SUCURSAL CORPORATIVA -->
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sucursal Corporativa <span class="text-red-500">*</span></label>
                        <Select v-model="form.id_sucursal" :options="sucursales" optionLabel="nombre" optionValue="id" placeholder="Seleccione sucursal" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" :invalid="!!errors.id_sucursal" />
                        <small class="text-red-500" v-if="errors.id_sucursal">{{ errors.id_sucursal }}</small>
                        <small class="text-gray-500 text-xs mt-1 block">Las áreas solo pueden crearse para sucursales de tipo Corporativo</small>
                    </div>

                    <!-- STATUS -->
                    <div>
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
                     <button type="button" @click="goBack" class="btn-secondary">
                        <X :size="18" />
                        Cancelar
                     </button>
                     <button type="submit" class="btn-primary" :disabled="submitting">
                        <Check v-if="!submitting" :size="18" />
                        <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                        <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Área' }}</span>
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
