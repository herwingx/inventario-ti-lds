<script setup>
/**
 * @fileoverview Formulario de Sucursal (Crear/Editar).
 * Gestiona el registro y ubicación física de las sucursales operativa.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import SucursalesService from '../services/SucursalesService'
import CatalogosService from '../services/CatalogosService'

import { Check, X } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const { success: toastSuccess, error: toastError } = useSwal()

const loading = ref(false)
const submitting = ref(false)
const isEditing = computed(() => !!route.params.id)

const empresas = ref([])
const tipos = ref([])

const form = ref({
    nombre: '',
    id_empresa: null,
    id_tipo_sucursal: null,
    direccion: '',
    numero_telefono: '',
    id_status: null
})

const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        const [empRes, tiposRes] = await Promise.all([
            CatalogosService.getEmpresas(),
            SucursalesService.getTiposSucursal()
        ])
        
        empresas.value = empRes
        tipos.value = tiposRes

        if (isEditing.value) {
            const data = await SucursalesService.getById(route.params.id)
            form.value = { ...data } // Asumiendo que los campos coinciden
        }
    } catch (error) {
        console.error('Error cargando datos:', error)
        toastError('Fallo al cargar datos')
    } finally {
        loading.value = false
    }
})

const handleSubmit = async () => {
    errors.value = {}
    if (!form.value.nombre) errors.value.nombre = 'Nombre requerido'
    if (!form.value.id_empresa) errors.value.id_empresa = 'Empresa requerida'
    if (!form.value.id_tipo_sucursal) errors.value.id_tipo_sucursal = 'Tipo requerido'

    if (Object.keys(errors.value).length > 0) return

    submitting.value = true
    try {
        if (isEditing.value) {
            await SucursalesService.update(route.params.id, form.value)
            toastSuccess('Sucursal actualizada')
        } else {
            await SucursalesService.create(form.value)
            toastSuccess('Sucursal creada')
        }
        router.push({ name: 'sucursales' })
    } catch (error) {
        toastError('Error al guardar')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-2xl mx-auto">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h2>
            <button @click="router.back()" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X :size="20" />
                <span>Cancelar</span>
            </button>
        </div>

        <div v-if="loading" class="space-y-4">
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2">
                     <label class="block text-sm font-bold mb-2 dark:text-gray-300">Nombre <span class="text-red-500">*</span></label>
                     <InputText v-model="form.nombre" class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.nombre" />
                     <small class="text-red-500">{{ errors.nombre }}</small>
                </div>

                <div>
                     <label class="block text-sm font-bold mb-2 dark:text-gray-300">Empresa <span class="text-red-500">*</span></label>
                     <Select v-model="form.id_empresa" :options="empresas" optionLabel="nombre" optionValue="id" class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.id_empresa" />
                     <small class="text-red-500">{{ errors.id_empresa }}</small>
                </div>

                <div>
                     <label class="block text-sm font-bold mb-2 dark:text-gray-300">Tipo <span class="text-red-500">*</span></label>
                     <Select v-model="form.id_tipo_sucursal" :options="tipos" optionLabel="nombre_tipo" optionValue="id" class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.id_tipo_sucursal" />
                     <small class="text-red-500">{{ errors.id_tipo_sucursal }}</small>
                </div>

                <div class="col-span-2">
                     <label class="block text-sm font-bold mb-2 dark:text-gray-300">Dirección Completa</label>
                     <InputText v-model="form.direccion" class="w-full !bg-gray-50 dark:!bg-dark-bg" placeholder="Calle, Número, Colonia, Ciudad, Estado" />
                </div>

                <div>
                     <label class="block text-sm font-bold mb-2 dark:text-gray-300">Teléfono</label>
                     <InputText v-model="form.numero_telefono" class="w-full !bg-gray-50 dark:!bg-dark-bg" />
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border">
                <button type="button" @click="router.back()" class="btn-secondary">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting">
                    <Check v-if="!submitting" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Sucursal' }}</span>
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
