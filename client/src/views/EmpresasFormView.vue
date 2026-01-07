<script setup>
/**
 * @fileoverview Formulario de Empresa (Crear/Editar).
 * Permite la gestión de entidades corporativas del grupo.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import EmpresasService from '../services/EmpresasService'
import CatalogosService from '../services/CatalogosService'

import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const submitting = ref(false)
const isEditing = computed(() => !!route.params.id)
const statuses = ref([])

const form = ref({
    nombre: '',
    id_status: null
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar datos', life: 3000 })
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
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa actualizada', life: 3000 })
        } else {
            await EmpresasService.create(form.value)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa creada', life: 3000 })
        }
        router.push({ name: 'empresas' })
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al conectar o nombre duplicado', life: 3000 })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-lg mx-auto">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        
        <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{{ isEditing ? 'Editar Empresa' : 'Nueva Empresa' }}</h2>

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

            <div class="flex justify-end gap-3 pt-6 border-t font-semibold">
                <Button label="Cancelar" severity="secondary" text @click="router.back()" />
                <Button type="submit" label="Guardar" icon="pi pi-check" :loading="submitting" class="!bg-primary !border-none" />
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
