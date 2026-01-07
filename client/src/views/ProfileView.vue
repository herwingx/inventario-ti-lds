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
    <div class="animate-fade-in-up max-w-4xl mx-auto">

        <!-- Loading State -->
        <div v-if="loading" class="space-y-6">
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 border border-gray-200 dark:border-dark-border">
                <div class="flex items-center gap-6">
                    <Skeleton shape="circle" size="6rem" />
                    <div class="flex-1 space-y-3">
                        <Skeleton width="60%" height="2rem" />
                        <Skeleton width="40%" height="1.5rem" />
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 border border-gray-200 dark:border-dark-border">
                <div class="space-y-6">
                    <Skeleton height="3rem" />
                    <Skeleton height="3rem" />
                </div>
            </div>
        </div>

        <!-- Contenido cargado -->
        <div v-else class="space-y-6">
            
            <!-- Header: Avatar y datos principales -->
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden">
                <div class="p-6 md:p-8">
                    <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
                        
                        <!-- Avatar -->
                        <div class="shrink-0">
                            <Avatar 
                                :label="initials" 
                                size="xlarge" 
                                class="!w-24 !h-24 !text-3xl !bg-primary !text-white shadow-lg"
                            />
                        </div>
                        
                        <!-- Info principal -->
                        <div class="flex-1 text-center md:text-left">
                            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                {{ fullName }}
                            </h1>
                            <p class="text-gray-500 dark:text-gray-400 mt-1 text-lg">
                                @{{ profile.username }}
                            </p>
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20">
                                    <i class="pi pi-shield text-xs"></i>
                                    {{ profile.nombre_rol }}
                                </span>
                                <span v-if="profile.puesto" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-dark-bg dark:text-gray-300">
                                    <i class="pi pi-briefcase text-xs"></i>
                                    {{ profile.puesto }}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Stats -->
                        <div class="flex md:flex-col gap-6 md:gap-3 text-center md:text-right">
                            <div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Miembro desde
                                </div>
                                <div class="font-semibold text-gray-900 dark:text-white text-sm">
                                    {{ memberSince }}
                                </div>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Último acceso
                                </div>
                                <div class="font-semibold text-gray-900 dark:text-white text-sm">
                                    {{ lastLogin }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formulario de edición -->
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden">
                
                <!-- Header del formulario -->
                <div class="px-6 md:px-8 py-4 border-b border-gray-100 dark:border-dark-border">
                    <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="pi pi-user-edit text-primary"></i>
                        Información de la Cuenta
                    </h2>
                </div>

                <form @submit.prevent="saveProfile" class="p-6 md:p-8">
                    <Fluid>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <!-- Username (solo lectura) -->
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Usuario
                                </label>
                                <InputText 
                                    :modelValue="profile.username" 
                                    disabled 
                                    class="!bg-gray-100 dark:!bg-dark-bg !cursor-not-allowed"
                                />
                            </div>

                            <!-- Email -->
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Correo Electrónico
                                </label>
                                <InputText 
                                    v-model="form.email" 
                                    type="email"
                                    placeholder="tu@email.com"
                                    class="!bg-gray-50 dark:!bg-dark-bg"
                                />
                            </div>

                            <!-- Rol (solo lectura) -->
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Rol
                                </label>
                                <InputText 
                                    :modelValue="profile.nombre_rol" 
                                    disabled 
                                    class="!bg-gray-100 dark:!bg-dark-bg !cursor-not-allowed"
                                />
                            </div>

                            <!-- Empleado asociado (solo lectura) -->
                            <div v-if="profile.nombre_empleado">
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Empleado Asociado
                                </label>
                                <InputText 
                                    :modelValue="`${profile.nombre_empleado} ${profile.apellido_empleado}`" 
                                    disabled 
                                    class="!bg-gray-100 dark:!bg-dark-bg !cursor-not-allowed"
                                />
                            </div>

                        </div>

                        <!-- Sección de contraseña -->
                        <div class="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <i class="pi pi-lock text-primary"></i>
                                        Seguridad
                                    </h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Actualiza tu contraseña regularmente
                                    </p>
                                </div>
                                <Button 
                                    label="Cambiar Contraseña" 
                                    icon="pi pi-key"
                                    severity="secondary"
                                    outlined
                                    @click="openPasswordDialog"
                                    class="shrink-0"
                                />
                            </div>
                        </div>

                        <!-- Botón guardar -->
                        <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                            <Button 
                                type="submit" 
                                label="Guardar Cambios" 
                                icon="pi pi-check" 
                                :loading="saving"
                                class="!bg-primary !border-none hover:!bg-primary-hover !px-8"
                            />
                        </div>
                    </Fluid>
                </form>
            </div>
        </div>

        <!-- Dialog de cambio de contraseña -->
        <Dialog 
            v-model:visible="showPasswordDialog" 
            modal 
            header="Cambiar Contraseña"
            :style="{ width: '28rem' }"
            :pt="{
                root: { class: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden' },
                header: { class: 'bg-gray-50 dark:bg-dark-bg/50 border-b border-gray-100 dark:border-dark-border px-6 py-4' },
                content: { class: 'p-6' },
                headerTitle: { class: 'text-lg font-bold text-gray-900 dark:text-white' }
            }"
        >
            <form @submit.prevent="changePassword" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Contraseña Actual
                    </label>
                    <Password 
                        v-model="passwordForm.currentPassword" 
                        :feedback="false"
                        toggleMask
                        class="w-full"
                        inputClass="!bg-gray-50 dark:!bg-dark-bg w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Nueva Contraseña
                    </label>
                    <Password 
                        v-model="passwordForm.newPassword" 
                        toggleMask
                        class="w-full"
                        inputClass="!bg-gray-50 dark:!bg-dark-bg w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar Nueva Contraseña
                    </label>
                    <Password 
                        v-model="passwordForm.confirmPassword" 
                        :feedback="false"
                        toggleMask
                        class="w-full"
                        inputClass="!bg-gray-50 dark:!bg-dark-bg w-full"
                    />
                </div>

                <div class="flex justify-end gap-3 pt-4">
                    <Button 
                        type="button" 
                        label="Cancelar" 
                        severity="secondary" 
                        text
                        @click="showPasswordDialog = false"
                    />
                    <Button 
                        type="submit" 
                        label="Actualizar Contraseña" 
                        icon="pi pi-check"
                        :loading="saving"
                        class="!bg-primary !border-none hover:!bg-primary-hover"
                    />
                </div>
            </form>
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
