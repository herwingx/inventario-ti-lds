<script setup>
/**
 * @fileoverview Vista de Inicio de Sesión.
 * Componente principal para la autenticación de usuarios. Provee un formulario
 * de login con validación básica y manejo de estado de carga.
 */
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Toast from 'primevue/toast'
import { Layers } from 'lucide-vue-next'

const authStore = useAuthStore()
const toast = useToast()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)

/**
 * Maneja el envío del formulario de login.
 * 
 * Valida que los campos no estén vacíos, activa el estado de carga
 * y delega la lógica de autenticación al store. Muestra notificaciones
 * de éxito o error según el resultado.
 */
const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor ingrese usuario y contraseña', life: 3000 })
    return
  }

  loading.value = true
  
  const result = await authStore.login(username.value, password.value)
  
  loading.value = false
  
  if (!result.success) {
    toast.add({ severity: 'error', summary: 'Error', detail: result.message, life: 3000 })
  }
}
</script>

<template>
  <div class="dark min-h-screen bg-[#24292d] flex items-center justify-center p-4">
    <Toast />
    
    <!-- Login Card -->
    <div class="relative w-full max-w-[400px] bg-[#2f363e] rounded-lg shadow-2xl overflow-hidden p-8">
      
      <!-- Logo/Header -->
      <div class="flex flex-col items-center mb-8">
          <!-- Logo Placeholder from image -->
          <div class="mb-4">
             <Layers class="text-gray-400" :size="60" stroke-width="1.5" />
          </div>
          <h1 class="text-xl font-medium text-white">Inicio de sesión</h1>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
        
        <div class="flex flex-col gap-2">
          <label for="username" class="text-xs font-bold text-gray-300">Nombre de usuario</label>
          <InputText id="username" v-model="username" class="w-full !rounded-md !py-2.5" placeholder="Nombre de usuario" :disabled="loading" autofocus />
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="text-xs font-bold text-gray-300">Contraseña</label>
          <Password id="password" v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full !rounded-md !py-2.5" placeholder="Contraseña" :disabled="loading" />
        </div>

        <Button type="submit" label="Iniciar Sesión" :loading="loading" class="w-full !mt-2 !bg-[#1ea97c] !border-none hover:!bg-[#158763] !font-bold !py-2.5 !rounded-md !text-white" />
      
        <div class="text-center mt-2">
            <span class="text-sm text-gray-400">¿No tienes una cuenta? <a href="#" class="text-[#1ea97c] hover:underline">Regístrate</a></span>
        </div>
      </form>
    
    </div>
  </div>
</template>

<style scoped>
/* Ajustes para Password component */
:deep(.p-password) {
  position: relative;
  display: inline-flex;
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
  padding-right: 2.75rem !important;
}

:deep(.p-password-toggle-mask-icon) {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  z-index: 10;
  color: #9ca3af;
  transition: color 0.2s ease;
}

:deep(.p-password-toggle-mask-icon:hover) {
  color: #13B497;
}
</style>
