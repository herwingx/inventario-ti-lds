<script setup>
/**
 * @fileoverview Formulario de Dirección IP (Crear/Editar).
 * Permite registrar o modificar una IP en el inventario, validando duplicidad y formato.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import DireccionesIpService from '../services/DireccionesIpService'
import CatalogosService from '../services/CatalogosService'

import { Check, X } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'

const route = useRoute()
const router = useRouter()
const { confirmWarning, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

const loading = ref(false)
const submitting = ref(false)
const isDirty = ref(false)
const isSaved = ref(false)

const sucursales = ref([])
const statuses = ref([])

const form = ref({
    direccion_ip: '',
    id_sucursal: null,
    comentario: '',
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
            text: 'Tienes cambios pendientes en la IP. ¿Estás seguro de que deseas salir?',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme'
        })
        if (!result.isConfirmed) return false
        toastInfo('Operación cancelada')
    }
})

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Dirección IP #${route.params.id}` : 'Registrar Nueva Dirección IP')

const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        const [sucursalesRes, statusRes] = await Promise.all([
            CatalogosService.getSucursales(),
            CatalogosService.getStatuses()
        ])
        
        sucursales.value = sucursalesRes
        statuses.value = statusRes

        if (isEditing.value) {
            const ipData = await DireccionesIpService.getById(route.params.id)
            populateForm(ipData)
        } else {
            const defaultStatus = statuses.value.find(s => s.nombre_status === 'DISPONIBLE')
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
    form.value.direccion_ip = data.direccion_ip
    form.value.id_sucursal = data.id_sucursal
    form.value.comentario = data.comentario
    form.value.id_status = data.id_status
}

// Validación de formato IP
const validateIpFormat = (ip) => {
    if (!ip) return false
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

const handleSubmit = async () => {
    errors.value = {}
    if (!form.value.direccion_ip) errors.value.direccion_ip = 'La dirección IP es obligatoria'
    else if (!validateIpFormat(form.value.direccion_ip)) errors.value.direccion_ip = 'Formato de IP inválido (IPv4 o IPv6)'
    if (!form.value.id_status) errors.value.id_status = 'El estado es obligatorio'

    if (Object.keys(errors.value).length > 0) {
        toastError('Por favor complete los campos obligatorios correctamente.')
        return
    }

    submitting.value = true
    try {
        const payload = { ...form.value }

        if (isEditing.value) {
            await DireccionesIpService.update(route.params.id, payload)
            toastSuccess('Dirección IP actualizada correctamente')
        } else {
            await DireccionesIpService.create(payload)
            toastSuccess('Dirección IP registrada correctamente')
        }

        isSaved.value = true
        setTimeout(() => router.replace({ name: 'direcciones-ip' }), 1000)
    } catch (error) {
        console.error('Error submit:', error)
        const msg = error.response?.data?.message || 'Error al guardar la dirección IP'
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
        router.push({ name: 'direcciones-ip' })
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-4xl mx-auto">
    
    <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        <div class="flex flex-col gap-6">
            <Skeleton width="10rem" height="2rem" />
            <div class="grid grid-cols-1 gap-6">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
            </div>
        </div>
    </div>

    <div v-else class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 dark:border-dark-border transition-colors duration-300">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure la dirección IP de red</p>
            </div>
            <button @click="goBack" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X :size="20" />
                <span>Cancelar</span>
            </button>
        </div>

        <form @submit.prevent="handleSubmit">
            <Fluid>
                 <div class="grid grid-cols-1 gap-6 gap-y-8">
                     
                     <div>
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección IP <span class="text-red-500">*</span></label>
                         <InputText v-model="form.direccion_ip" placeholder="Ej: 192.168.0.1" :invalid="!!errors.direccion_ip" class="!bg-gray-50 dark:!bg-dark-bg w-full font-mono" />
                         <small class="text-red-500" v-if="errors.direccion_ip">{{ errors.direccion_ip }}</small>
                         <small class="text-gray-500 text-xs mt-1 block">Formato IPv4 (192.168.0.1) o IPv6</small>
                     </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sucursal</label>
                        <Select v-model="form.id_sucursal" :options="sucursales" optionLabel="nombre" optionValue="id" placeholder="Seleccione sucursal" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" showClear />
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estado <span class="text-red-500">*</span></label>
                        <Select v-model="form.id_status" :options="statuses" optionLabel="nombre_status" optionValue="id" placeholder="Seleccione Estado" class="!bg-gray-50 dark:!bg-dark-bg w-full" :invalid="!!errors.id_status" />
                        <small class="text-red-500" v-if="errors.id_status">{{ errors.id_status }}</small>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Comentario</label>
                        <Textarea v-model="form.comentario" rows="4" placeholder="Descripción o notas sobre esta IP..." class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                    </div>

                 </div>

                 <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                     <button type="button" @click="goBack" class="btn-secondary">
                        <X :size="18" />
                        Cancelar
                     </button>
                     <button type="submit" class="btn-primary" :disabled="submitting">
                        <Check v-if="!submitting" :size="18" />
                        <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                        <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar IP' }}</span>
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
</style>
