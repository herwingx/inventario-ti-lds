<script setup>
/**
 * @fileoverview Formulario de Mantenimiento (Crear/Editar).
 * Permite registrar actividades de mantenimiento preventivo o correctivo para un equipo.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import MantenimientosService from '../services/MantenimientosService'
import EquiposService from '../services/EquiposService'
import CatalogosService from '../services/CatalogosService'

import { Check, X, Save, Info, List } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'

const router = useRouter()
const route = useRoute()
const { confirmWarning, success: toastSuccess, error: toastError, warning: toastWarning } = useSwal()

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Servicio #${route.params.id}` : 'Registrar Nuevo Servicio')
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
             const enProceso = statusList.value.find(s => s.nombre_status.toLowerCase().includes('proceso'))
             if (enProceso) mantenimiento.value.id_status = enProceso.id
        }
    } catch (error) {
        console.error(error)
        toastError('Error al cargar datos iniciales')
    } finally {
        loading.value = false
    }
})

const loadEquipos = async () => {
    try {
        const data = await EquiposService.getAll()
        // Mapear para dropdown
        equipos.value = data.map(e => ({
            label: `${e.nombre_tipo_equipo} - ${e.nombre_equipo} ${e.modelo ? '(' + e.modelo + ')' : ''} [SN: ${e.numero_serie}]`,
            value: e.id,
            ...e 
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
        statusList.value = [
            { id: 1, nombre_status: 'Activo' },
            { id: 2, nombre_status: 'Inactivo' }, 
        ]
    }
}

const loadMantenimiento = async (id) => {
    try {
        const data = await MantenimientosService.getById(id)
        mantenimiento.value = {
            ...data,
            fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
            fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null
        }
    } catch (error) {
        toastError('No se pudo cargar el mantenimiento')
        router.push({ name: 'mantenimientos' })
    }
}

const save = async () => {
    // Validaciones básicas manuales (puedes usar vuelidate si lo prefieres como en Equipos)
    if (!mantenimiento.value.id_equipo) {
        toastWarning('Debe seleccionar un equipo')
        return
    }
    if (!mantenimiento.value.fecha_inicio) {
        toastWarning('La fecha de inicio es obligatoria')
        return
    }
    
    if (mantenimiento.value.fecha_fin && mantenimiento.value.fecha_inicio > mantenimiento.value.fecha_fin) {
         toastError('La fecha de fin no puede ser anterior al inicio')
         return
    }

    saving.value = true
    try {
        const payload = {
            ...mantenimiento.value,
            fecha_inicio: formatDateForBackend(mantenimiento.value.fecha_inicio),
            fecha_fin: formatDateForBackend(mantenimiento.value.fecha_fin)
        }

        if (isEditing.value) {
            await MantenimientosService.update(route.params.id, payload)
            toastSuccess('Mantenimiento actualizado')
        } else {
            await MantenimientosService.create(payload)
            toastSuccess('Mantenimiento registrado')
        }
        
        // Delay para feedback visual
        setTimeout(() => {
             router.push({ name: 'mantenimientos' })
        }, 1000)

    } catch (error) {
        console.error(error)
        toastError('Falló el guardado')
    } finally {
        saving.value = false
    }
}

const formatDateForBackend = (date) => {
    if (!date) return null
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset*60*1000))
    return localDate.toISOString().split('T')[0]
}

const goBack = async () => {
    const result = await confirmWarning({
        title: 'Confirmar Salida',
        text: '¿Está seguro de que desea salir? Los cambios no guardados se perderán.',
        confirmButtonText: 'Salir sin Guardar',
        cancelButtonText: 'Continuar Editando'
    })
    
    if (result.isConfirmed) {
        router.push({ name: 'mantenimientos' })
    }
}
</script>

<template>
    <div class="animate-fade-in-up max-w-7xl mx-auto">
        
        <!-- Loading -->
        <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
            <div class="flex flex-col gap-6">
                <Skeleton width="10rem" height="2rem" />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Registre los detalles del servicio técnico o mantenimiento</p>
                </div>
                <button @click="goBack" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                    <X :size="20" />
                    <span>Cancelar</span>
                </button>
            </div>

            <!-- Form Body -->
            <Fluid>
                <form @submit.prevent="save" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <!-- Section: General -->
                    <div class="col-span-1 md:col-span-2">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Info :size="20" class="text-primary" /> Información General
                        </h3>
                    </div>

                    <div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col gap-2">
                            <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Equipo *</label>
                            <Select 
                                v-model="mantenimiento.id_equipo" 
                                :options="equipos" 
                                optionLabel="label" 
                                optionValue="value" 
                                filter 
                                placeholder="Seleccione equipo..." 
                                class="!w-full !bg-gray-50 dark:!bg-dark-bg"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                             <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Estado del Servicio *</label>
                             <Select 
                                v-model="mantenimiento.id_status" 
                                :options="statusList" 
                                optionLabel="nombre_status" 
                                optionValue="id" 
                                placeholder="Estado actual" 
                                class="!w-full !bg-gray-50 dark:!bg-dark-bg"
                            />
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Fecha Inicio *</label>
                        <DatePicker v-model="mantenimiento.fecha_inicio" dateFormat="yy-mm-dd" showIcon iconDisplay="input" class="!w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg'" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Fecha Fin</label>
                        <DatePicker v-model="mantenimiento.fecha_fin" dateFormat="yy-mm-dd" showIcon iconDisplay="input" placeholder="En proceso" class="!w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg'" />
                    </div>

                    <!-- Divider -->
                    <div class="col-span-1 md:col-span-2 border-t border-gray-100 dark:border-gray-700 my-2"></div>

                    <!-- Section: Detalles -->
                    <div class="col-span-1 md:col-span-2">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <List :size="20" class="text-primary" /> Detalles Técnicos
                        </h3>
                    </div>

                    <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Diagnóstico / Falla Reportada</label>
                        <Textarea v-model="mantenimiento.diagnostico" rows="3" class="!w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Describa el problema o motivo del servicio..." />
                    </div>

                     <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Solución / Trabajo Realizado</label>
                        <Textarea v-model="mantenimiento.solucion" rows="3" class="!w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Describa la solución aplicada..." />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Costo ($)</label>
                        <InputNumber v-model="mantenimiento.costo" mode="currency" currency="MXN" locale="es-MX" class="!w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg'" placeholder="$0.00" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Proveedor</label>
                        <InputText v-model="mantenimiento.proveedor" class="!w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Ej. Interno, HP Support..." />
                    </div>

                </form>
            </Fluid>

            <!-- Footer Actions -->
            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                <button type="button" @click="goBack" class="btn-secondary">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="button" @click="save" class="btn-primary" :disabled="saving">
                    <Check v-if="!saving" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Servicio' }}</span>
                </button>
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
