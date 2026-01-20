<script setup>
/**
 * @fileoverview Formulario de Nota (Crear/Editar).
 * Permite crear notas rápidas o bitácoras, asociándolas opcionalmente a equipos.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import NotasService from '../services/NotasService'
import EquiposService from '../services/EquiposService'

import { Check, X, Bookmark, Info } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'

const router = useRouter()
const route = useRoute()
const { confirmWarning, success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useSwal()

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Nota #${route.params.id}` : 'Crear Nueva Nota')
const loading = ref(false)
const saving = ref(false)
const isDirty = ref(false)
const isSaved = ref(false)

const form = ref({
    titulo: '',
    contenido: '',
    id_equipo: null
})

// Dirty detection
watch(form, () => {
    if (!loading.value && !saving.value && !isSaved.value) {
        isDirty.value = true
    }
}, { deep: true })

// Route guard
onBeforeRouteLeave(async (to, from) => {
    if (isDirty.value && !isSaved.value) {
        const result = await confirmWarning({
            title: 'Cambios no guardados',
            text: '¿Deseas salir? Tienes una nota con cambios pendientes.',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme'
        })
        if (!result.isConfirmed) return false
        toastInfo('Operación cancelada')
    }
})

const equipos = ref([])

onMounted(async () => {
    loading.value = true
    try {
        const equiposData = await EquiposService.getAll()
        equipos.value = equiposData.map(e => ({
            label: `${e.nombre_tipo_equipo || 'Equipo'} - ${e.nombre_equipo} ${e.modelo ? '(' + e.modelo + ')' : ''} [SN: ${e.numero_serie}]`,
            value: e.id
        }))

        if (isEditing.value) {
            await loadNota(route.params.id)
        }
    } catch (error) {
        toastError('Error al cargar datos')
    } finally {
        loading.value = false
    }
})

const loadNota = async (id) => {
    try {
        const data = await NotasService.getById(id)
        form.value = {
            titulo: data.titulo,
            contenido: data.contenido,
            id_equipo: data.id_equipo
        }
    } catch (error) {
        toastError('Nota no encontrada')
        router.push({ name: 'notas' })
    }
}

const save = async () => {
    if (!form.value.titulo || !form.value.contenido) {
        toastWarning('Título y contenido son obligatorios')
        return
    }

    saving.value = true
    try {
        // Simular ID usuario sistema (TODO: Tomar del auth store)
        const payload = { ...form.value, id_usuario_sistema: 1 }

        if (isEditing.value) {
            await NotasService.update(route.params.id, payload)
            toastSuccess('Nota actualizada')
        } else {
            await NotasService.create(payload)
            toastSuccess('Nota creada')
        }
        
        isSaved.value = true
        setTimeout(() => router.replace({ name: 'notas' }), 1000)
    } catch (error) {
        console.error(error)
        toastError('Error al guardar')
    } finally {
        saving.value = false
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
        router.push({ name: 'notas' })
    }
}
</script>

<template>
    <div class="animate-fade-in-up max-w-3xl mx-auto">
        
        <!-- Loading -->
        <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
            <Skeleton width="10rem" height="2rem" class="mb-4" />
            <Skeleton height="10rem" />
        </div>

        <!-- Form -->
        <div v-else class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 dark:border-dark-border">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Registre información relevante en la bitácora</p>
                </div>
            </div>

            <Fluid>
                <form @submit.prevent="save" class="grid grid-cols-1 gap-6">
                    
                    <div>
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Título *</label>
                        <InputText v-model="form.titulo" class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1 !text-lg !font-semibold" placeholder="Asunto de la nota..." autofocus />
                    </div>

                    <div>
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Equipo Relacionado (Opcional)</label>
                        <Select v-model="form.id_equipo" :options="equipos" optionLabel="label" optionValue="value" placeholder="Seleccionar equipo..." filter showClear class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1" />
                    </div>

                    <div>
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Contenido *</label>
                        <Textarea v-model="form.contenido" rows="8" class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1" placeholder="Escriba aquí los detalles..." />
                    </div>

                </form>
            </Fluid>

            <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                <button type="button" @click="goBack" class="btn-secondary">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="submit" @click="save" class="btn-primary" :disabled="saving">
                    <Check v-if="!saving" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Nota' }}</span>
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
