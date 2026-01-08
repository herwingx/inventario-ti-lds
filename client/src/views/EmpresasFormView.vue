<script setup>
/**
 * @fileoverview Formulario de Empresa (Crear/Editar).
 * Permite la gestión de entidades corporativas del grupo.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import EmpresasService from '../services/EmpresasService'
import CatalogosService from '../services/CatalogosService'

import { Check, X } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const { confirmWarning, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

const loading = ref(false)
const submitting = ref(false)
const isEditing = computed(() => !!route.params.id)
const statuses = ref([])
const isDirty = ref(false)
const isSaved = ref(false)

const form = ref({
    nombre: '',
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
            text: '¿Deseas salir? Tienes cambios pendientes en la empresa.',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme'
        })
        if (!result.isConfirmed) return false
        toastInfo('Operación cancelada')
    }
})

const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        const statusRes = await CatalogosService.getStatuses()
        statuses.value = statusRes
        
        if (isEditing.value) {
            const data = await EmpresasService.getById(route.params.id)
            form.value = { 
                nombre: data.nombre,
                id_status: data.id_status
            }
        }
    } catch (error) {
        toastError('Fallo al cargar datos')
    } finally {
        loading.value = false
    }
})

const handleSubmit = async () => {
    errors.value = {}
    if (!form.value.nombre) errors.value.nombre = 'Nombre requerido'

    if (Object.keys(errors.value).length > 0) return

    submitting.value = true
    try {
        if (isEditing.value) {
            await EmpresasService.update(route.params.id, form.value)
            toastSuccess('Empresa actualizada')
        } else {
            await EmpresasService.create(form.value)
            toastSuccess('Empresa creada')
        }
        isSaved.value = true
        router.replace({ name: 'empresas' })
    } catch (error) {
        toastError('Error al conectar o nombre duplicado')
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
        router.push({ name: 'empresas' })
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-lg mx-auto">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ isEditing ? 'Editar Empresa' : 'Nueva Empresa' }}</h2>
            <button @click="goBack" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X :size="20" />
                <span>Cancelar</span>
            </button>
        </div>

        <div v-if="loading" class="space-y-4">
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            
            <div>
                 <label class="block text-sm font-bold mb-2 dark:text-gray-300">Nombre de Empresa <span class="text-red-500">*</span></label>
                 <InputText v-model="form.nombre" class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.nombre" />
                 <small class="text-red-500">{{ errors.nombre }}</small>
            </div>

            <div>
                 <label class="block text-sm font-bold mb-2 dark:text-gray-300">Estado</label>
                 <Select v-model="form.id_status" :options="statuses" optionLabel="nombre_status" optionValue="id" class="w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Seleccionar (Opcional)" />
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border">
                <button type="button" @click="goBack" class="btn-secondary">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting">
                    <Check v-if="!submitting" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Empresa' }}</span>
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
