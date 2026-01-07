<script setup>
/**
 * @fileoverview Formulario de Cuenta de Correo (Crear/Editar).
 * Permite registrar cuentas de correo y asignarlas a empleados activos.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import CorreosService from '../services/CorreosService'
import EmpleadosService from '../services/EmpleadosService'
import CatalogosService from '../services/CatalogosService'

import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import { Check, X, Mail } from 'lucide-vue-next'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const submitting = ref(false)
const isEditing = computed(() => !!route.params.id)

const empleados = ref([])
const statuses = ref([])

const form = ref({
    email: '',
    usuario_email: '',
    password_data: '',
    id_empleado_asignado: null,
    id_status: null,
    observaciones: ''
})

const errors = ref({})

onMounted(async () => {
    loading.value = true
    try {
        const [empRes, statusRes] = await Promise.all([
            EmpleadosService.getAll(),
            CatalogosService.getStatuses()
        ])
        
        empleados.value = empRes.map(e => ({ label: `${e.nombres} ${e.apellidos}`, value: e.id }))
        statuses.value = statusRes

        if (isEditing.value) {
            const data = await CorreosService.getById(route.params.id)
            form.value = {
                email: data.email,
                usuario_email: data.usuario_email,
                password_data: data.password_data,
                id_empleado_asignado: data.id_empleado_asignado,
                id_status: data.id_status,
                observaciones: data.observaciones
            }
        } else {
            // Default status Activo
            const activeStatus = statuses.value.find(s => s.nombre_status.toUpperCase().includes('ACTIVO'))
            if (activeStatus) form.value.id_status = activeStatus.id
        }

    } catch (error) {
        console.error('Error cargando datos:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 })
    } finally {
        loading.value = false
    }
})

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

const handleSubmit = async () => {
    errors.value = {}
    
    if (!form.value.email) errors.value.email = 'El email es obligatorio'
    else if (!validateEmail(form.value.email)) errors.value.email = 'Email inválido'

    if (!form.value.id_status) errors.value.id_status = 'El estado es obligatorio'

    if (Object.keys(errors.value).length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Corrija los errores', life: 3000 })
        return
    }

    submitting.value = true
    try {
        if (isEditing.value) {
            await CorreosService.update(route.params.id, form.value)
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Cuenta actualizada correctamente', life: 3000 })
        } else {
            await CorreosService.create(form.value)
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Cuenta creada correctamente', life: 3000 })
        }
        router.push({ name: 'correos' })
    } catch (error) {
        console.error('Error submit:', error)
        const msg = error.response?.data?.message || 'Error al guardar'
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="animate-fade-in-up max-w-2xl mx-auto">
    <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 dark:border-dark-border pb-4 gap-4">
            <div>
                 <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ isEditing ? 'Editar Cuenta' : 'Nueva Cuenta de Correo' }}</h2>
                 <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestión de cuentas corporativas para empleados</p>
            </div>
            <button @click="router.back()" class="btn-ghost text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <X :size="20" />
                <span>Cancelar</span>
            </button>
        </div>

        <div v-if="loading" class="space-y-4">
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            
            <!-- Email -->
            <div>
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Corporativo <span class="text-red-500">*</span></label>
                 <InputText v-model="form.email" placeholder="ejemplo@empresa.com" class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.email" />
                 <small class="text-red-500">{{ errors.email }}</small>
            </div>

            <!-- Usuario y Password -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Usuario</label>
                     <InputText v-model="form.usuario_email" placeholder="Usuario del sistema" class="w-full !bg-gray-50 dark:!bg-dark-bg" />
                </div>
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
                     <!-- Usamos InputText porque el backend lo trata como texto plano visible, si fuera secreto usaríamos Password -->
                     <InputText v-model="form.password_data" placeholder="Contraseña de acceso" class="w-full !bg-gray-50 dark:!bg-dark-bg font-mono" />
                </div>
            </div>

            <!-- Asignación -->
            <div>
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Empleado Asignado</label>
                 <Select v-model="form.id_empleado_asignado" :options="empleados" optionLabel="label" optionValue="value" filter showClear placeholder="Seleccione Empleado" class="w-full !bg-gray-50 dark:!bg-dark-bg" />
            </div>

            <!-- Estado -->
            <div>
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estado <span class="text-red-500">*</span></label>
                 <Select v-model="form.id_status" :options="statuses" optionLabel="nombre_status" optionValue="id" placeholder="Seleccione Estado" class="w-full !bg-gray-50 dark:!bg-dark-bg" :invalid="!!errors.id_status" />
                 <small class="text-red-500">{{ errors.id_status }}</small>
            </div>

            <!-- Observaciones -->
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                <Textarea v-model="form.observaciones" rows="3" class="w-full !bg-gray-50 dark:!bg-dark-bg" />
            </div>

            <!-- Botones -->
            <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border">
                <button type="button" @click="router.back()" class="btn-secondary">
                    <X :size="18" />
                    Cancelar
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting">
                    <Check v-if="!submitting" :size="18" />
                    <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                    <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Cuenta' }}</span>
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
