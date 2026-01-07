<script setup>
/**
 * @fileoverview Formulario de Nota (Crear/Editar).
 * Permite crear notas rápidas o bitácoras, asociándolas opcionalmente a equipos.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import NotasService from '../services/NotasService'
import EquiposService from '../services/EquiposService'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Nota #${route.params.id}` : 'Crear Nueva Nota')
const loading = ref(false)
const saving = ref(false)

const form = ref({
    titulo: '',
    contenido: '',
    id_equipo: null
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 })
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Nota no encontrada', life: 3000 })
        router.push({ name: 'notas' })
    }
}

const save = async () => {
    if (!form.value.titulo || !form.value.contenido) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Título y contenido son obligatorios', life: 3000 })
        return
    }

    saving.value = true
    try {
        // Simular ID usuario sistema (TODO: Tomar del auth store)
        const payload = { ...form.value, id_usuario_sistema: 1 }

        if (isEditing.value) {
            await NotasService.update(route.params.id, payload)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nota actualizada', life: 3000 })
        } else {
            await NotasService.create(payload)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nota creada', life: 3000 })
        }
        
        setTimeout(() => router.push({ name: 'notas' }), 1000)
    } catch (error) {
        console.error(error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar', life: 3000 })
    } finally {
        saving.value = false
    }
}

const goBack = () => {
    confirm.require({
        message: '¿Salir sin guardar?',
        header: 'Confirmar Salida',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Continuar',
        acceptLabel: 'Salir',
        acceptClass: 'p-button-warning !bg-orange-500 !border-none',
        accept: () => router.push({ name: 'notas' })
    })
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
            
            <div class="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-dark-border pb-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Registre información relevante en la bitácora.</p>
                </div>
                <Button icon="pi pi-times" text rounded severity="secondary" @click="goBack" class="!w-10 !h-10 hover:bg-gray-100 dark:hover:bg-gray-800" />
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

            <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="goBack" class="!px-6" />
                <Button label="Guardar Nota" icon="pi pi-save" :loading="saving" @click="save" class="!bg-primary !border-none hover:!bg-primary-hover !px-8 !py-3 !rounded-lg !font-bold" />
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
