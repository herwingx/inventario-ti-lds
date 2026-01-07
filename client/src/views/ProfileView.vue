<script setup>
/**
 * @fileoverview Vista de perfil de usuario.
 * Permite visualizar información personal y editar el correo electrónico.
 * También gestiona el cambio de contraseña de forma segura.
 */
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import ProfileService from '../services/ProfileService'
// Componentes PrimeVue
import InputText from 'primevue/inputtext'
import { Check, X, Shield, Key, CreditCard, Pencil, Save } from 'lucide-vue-next'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'
import Password from 'primevue/password'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'

const toast = useToast()
const authStore = useAuthStore()

// Estados
const loading = ref(true)
const saving = ref(false)
const showPasswordDialog = ref(false)

// Datos del perfil
const profile = ref({
    id: null,
    username: '',
    email: '',
    nombre_empleado: null,
    apellido_empleado: null,
    puesto: null,
    nombre_rol: '',
    fecha_registro: null,
    fecha_ultimo_login: null
})

// Formulario de edición
const form = ref({
    email: ''
})

// Formulario de contraseña
const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// Computed
const fullName = computed(() => {
    if (profile.value.nombre_empleado && profile.value.apellido_empleado) {
        return `${profile.value.nombre_empleado} ${profile.value.apellido_empleado}`
    }
    return profile.value.username
})

const initials = computed(() => {
    if (profile.value.nombre_empleado && profile.value.apellido_empleado) {
        return `${profile.value.nombre_empleado.charAt(0)}${profile.value.apellido_empleado.charAt(0)}`.toUpperCase()
    }
    return profile.value.username?.substring(0, 2).toUpperCase() || 'U'
})

const memberSince = computed(() => {
    if (!profile.value.fecha_registro) return 'N/A'
    return new Date(profile.value.fecha_registro).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})

const lastLogin = computed(() => {
    if (!profile.value.fecha_ultimo_login) return 'N/A'
    return new Date(profile.value.fecha_ultimo_login).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
})

// Cargar perfil
onMounted(async () => {
    await loadProfile()
})

const loadProfile = async () => {
    loading.value = true
    try {
        const data = await ProfileService.getProfile()
        profile.value = data
        form.value.email = data.email || ''
    } catch (error) {
        console.error('Error cargando perfil:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el perfil',
            life: 3000
        })
    } finally {
        loading.value = false
    }
}

// Guardar cambios de email
const saveProfile = async () => {
    if (form.value.email === profile.value.email) {
        toast.add({
            severity: 'info',
            summary: 'Sin cambios',
            detail: 'No hay cambios que guardar',
            life: 3000
        })
        return
    }

    saving.value = true
    try {
        await ProfileService.updateProfile({ email: form.value.email })
        profile.value.email = form.value.email
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Perfil actualizado correctamente',
            life: 3000
        })
    } catch (error) {
        console.error('Error guardando perfil:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'No se pudo actualizar el perfil',
            life: 5000
        })
    } finally {
        saving.value = false
    }
}

// Cambiar contraseña
const changePassword = async () => {
    // Validaciones
    if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
        toast.add({
            severity: 'warn',
            summary: 'Campos requeridos',
            detail: 'Todos los campos son obligatorios',
            life: 3000
        })
        return
    }

    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Las contraseñas nuevas no coinciden',
            life: 3000
        })
        return
    }

    if (passwordForm.value.newPassword.length < 6) {
        toast.add({
            severity: 'warn',
            summary: 'Contraseña débil',
            detail: 'La contraseña debe tener al menos 6 caracteres',
            life: 3000
        })
        return
    }

    saving.value = true
    try {
        await ProfileService.updateProfile({
            currentPassword: passwordForm.value.currentPassword,
            newPassword: passwordForm.value.newPassword
        })
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Contraseña actualizada correctamente',
            life: 3000
        })
        
        showPasswordDialog.value = false
        passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    } catch (error) {
        console.error('Error cambiando contraseña:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'No se pudo cambiar la contraseña',
            life: 5000
        })
    } finally {
        saving.value = false
    }
}

const openPasswordDialog = () => {
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    showPasswordDialog.value = true
}
</script>

<template>
    <div class="animate-fade-in-up max-w-6xl mx-auto">

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Left Skeleton -->
            <div class="md:col-span-1 space-y-6">
                <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-card p-6 border border-light-border dark:border-dark-border h-full flex flex-col items-center">
                    <Skeleton shape="circle" size="8rem" class="mb-4" />
                    <Skeleton width="60%" height="2rem" class="mb-2" />
                    <Skeleton width="40%" height="1.5rem" class="mb-6" />
                    <Skeleton width="80%" height="3rem" class="mt-auto" />
                </div>
            </div>
            <!-- Right Skeleton -->
            <div class="md:col-span-2">
                <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-card p-8 border border-light-border dark:border-dark-border h-full">
                     <div class="space-y-6">
                        <Skeleton height="3rem" width="100%" />
                        <Skeleton height="3rem" width="100%" />
                        <Skeleton height="3rem" width="100%" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenido Cargado -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Columna Izquierda: Perfil Resumido -->
            <div class="md:col-span-1 space-y-6">
                <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-card border border-light-border dark:border-dark-border overflow-hidden relative group">
                    
                    <!-- Fondo Decorativo -->
                    <div class="h-32 bg-gradient-to-r from-primary to-primary-hover/80 absolute w-full top-0 left-0"></div>
                    
                    <div class="pt-20 px-6 pb-6 relative flex flex-col items-center text-center">
                        <!-- Avatar con borde -->
                        <div class="p-1.5 bg-white dark:bg-dark-card rounded-full shadow-lg mb-4 cursor-default border border-light-border dark:border-dark-border">
                             <Avatar 
                                :label="initials" 
                                size="xlarge" 
                                shape="circle"
                                class="!w-28 !h-28 !text-4xl !bg-gray-50 !text-primary dark:!bg-dark-bg font-bold !rounded-full flex items-center justify-center"
                            />
                        </div>

                        <h1 class="text-xl font-bold text-light-text dark:text-gray-100 mt-2">
                            {{ fullName }}
                        </h1>
                        <p class="text-sm font-bold text-primary mt-1 uppercase tracking-tight">
                            @{{ profile.username }}
                        </p>

                        <div class="flex flex-wrap gap-2 justify-center mt-4">
                             <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                <Shield :size="12" /> {{ profile.nombre_rol }}
                            </div>
                        </div>

                        <!-- StatsDivider -->
                        <div class="w-full h-px bg-light-border dark:bg-dark-border my-6"></div>

                        <!-- Stats Grid -->
                        <div class="grid grid-cols-2 gap-4 w-full text-sm">
                            <div class="text-center p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                                <p class="detail-label mb-1">Miembro desde</p>
                                <p class="detail-value text-sm">{{ memberSince }}</p>
                            </div>
                            <div class="text-center p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                                <p class="detail-label mb-1">Último acceso</p>
                                <p class="detail-value text-sm">{{ lastLogin }}</p>
                            </div>
                        </div>

                        <!-- Action Button -->
                         <div class="w-full mt-6">
                            <button class="btn-secondary w-full" @click="openPasswordDialog">
                                <Key :size="16" />
                                <span>Cambiar Contraseña</span>
                            </button>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: Formulario Detallado -->
             <div class="md:col-span-2">
                <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-card border border-light-border dark:border-dark-border overflow-hidden h-full">
                    
                    <div class="px-8 py-6 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/20">
                         <h2 class="text-lg font-bold text-light-text dark:text-white flex items-center gap-2">
                            <CreditCard :size="20" class="text-primary" />
                            Información Personal
                        </h2>
                        <span class="detail-label !mb-0 italic normal-case font-medium">
                             * Campos de solo lectura
                        </span>
                    </div>

                    <form @submit.prevent="saveProfile" class="p-8">
                        <div class="grid grid-cols-1 gap-y-8 gap-x-8">
                            
                            <!-- Sección 1: Datos de Cuenta -->
                            <div class="space-y-6">
                                    <h3 class="detail-label border-b border-light-border dark:border-dark-border pb-2">
                                    Credenciales de Acceso
                                    </h3>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="flex flex-col gap-2">
                                        <label class="detail-label">Usuario</label>
                                            <InputText 
                                            :modelValue="profile.username" 
                                            disabled 
                                            class="w-full !bg-light-bg dark:!bg-dark-bg !text-light-muted dark:!text-dark-muted !border-light-border dark:!border-dark-border !opacity-100 font-bold"
                                        />
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label class="detail-label">Email Personal (Editable)</label>
                                        <div class="relative w-full">
                                            <InputText 
                                                v-model="form.email" 
                                                type="email"
                                                placeholder="tu@email.com"
                                                class="w-full !bg-white dark:!bg-dark-input-bg focus:!border-primary transition-colors pr-10 font-bold"
                                            />
                                            <Pencil :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted pointer-events-none" />
                                        </div>
                                    </div>
                                    </div>
                            </div>

                            <!-- Sección 2: Datos Profesionales -->
                            <div class="space-y-6">
                                    <h3 class="detail-label border-b border-light-border dark:border-dark-border pb-2">
                                    Ficha de Empleado
                                    </h3>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="flex flex-col gap-2">
                                        <label class="detail-label">Nombre Completo</label>
                                        <InputText 
                                            :modelValue="profile.nombre_empleado ? `${profile.nombre_empleado} ${profile.apellido_empleado}` : 'N/A'" 
                                            disabled 
                                                class="w-full !bg-light-bg dark:!bg-dark-bg !text-light-muted dark:!text-dark-muted !border-light-border dark:!border-dark-border !opacity-100 font-bold"
                                        />
                                    </div>
                                        <div class="flex flex-col gap-2">
                                        <label class="detail-label">Puesto / Cargo</label>
                                        <InputText 
                                            :modelValue="profile.puesto || 'No especificado'" 
                                            disabled 
                                                class="w-full !bg-light-bg dark:!bg-dark-bg !text-light-muted dark:!text-dark-muted !border-light-border dark:!border-dark-border !opacity-100 font-bold"
                                        />
                                    </div>
                                    </div>
                            </div>

                        </div>
                        
                        <!-- Botones -->
                        <div class="flex justify-end pt-8 mt-4 border-t border-light-border dark:border-dark-border">
                            <button type="submit" class="btn-primary" :disabled="saving">
                                <Save v-if="!saving" :size="18" />
                                <i v-else class="pi pi-spin pi-spinner text-lg"></i>
                                <span>Guardar Cambios</span>
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        </div>

        <Dialog 
            v-model:visible="showPasswordDialog" 
            modal 
            header="Seguridad: Cambiar Contraseña"
            :style="{ width: '90%', maxWidth: '450px' }"
        >
            <div class="pt-2">
                 <p class="text-sm text-light-muted dark:text-dark-muted mb-6 leading-relaxed">
                    Asegúrate de usar una contraseña segura de al menos <span class="text-primary font-bold">6 caracteres</span> para proteger tu cuenta.
                </p>

                <form @submit.prevent="changePassword" class="space-y-5">
                    <div class="flex flex-col gap-2">
                        <label class="detail-label">Contraseña Actual</label>
                        <Password 
                            v-model="passwordForm.currentPassword" 
                            :feedback="false"
                            toggleMask
                            class="w-full"
                            inputClass="!bg-light-bg dark:!bg-dark-bg !border-light-border dark:!border-dark-border !text-light-text dark:!text-dark-text focus:!border-primary !w-full !rounded-xl !py-3"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="detail-label">Nueva Contraseña</label>
                        <Password 
                            v-model="passwordForm.newPassword" 
                            toggleMask
                            class="w-full"
                            inputClass="!bg-light-bg dark:!bg-dark-bg !border-light-border dark:!border-dark-border !text-light-text dark:!text-dark-text focus:!border-primary !w-full !rounded-xl !py-3"
                        >
                            <template #header>
                                <h6 class="font-bold text-xs mb-2 text-primary uppercase tracking-tight">Sugerencias</h6>
                            </template>
                        </Password>
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="detail-label">Confirmar Contraseña</label>
                        <Password 
                            v-model="passwordForm.confirmPassword" 
                            :feedback="false"
                            toggleMask
                            class="w-full"
                            inputClass="!bg-light-bg dark:!bg-dark-bg !border-light-border dark:!border-dark-border !text-light-text dark:!text-dark-text focus:!border-primary !w-full !rounded-xl !py-3"
                        />
                    </div>

                    <div class="flex justify-end gap-3 pt-6 mt-4 border-t border-light-border dark:border-dark-border">
                        <button 
                            type="button" 
                            @click="showPasswordDialog = false"
                            class="btn-secondary !px-6"
                        >
                            <X :size="18" />
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary !px-6" :disabled="saving">
                            <Check v-if="!saving" :size="18" />
                            <i v-else class="pi pi-spinner pi-spin"></i>
                            <span>Actualizar Contraseña</span>
                        </button>
                    </div>
                </form>
            </div>
        </Dialog>

    </div>
</template>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(15px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Ajustes para Password component */
:deep(.p-password) {
    width: 100%;
}

:deep(.p-password-input) {
    width: 100%;
}
</style>
