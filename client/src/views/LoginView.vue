<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Toast from 'primevue/toast'

const authStore = useAuthStore()
const toast = useToast()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)

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
  <div class="min-h-screen bg-[#24292d] flex items-center justify-center p-4">
    <Toast />
    
    <!-- Login Card -->
    <div class="relative w-full max-w-[400px] bg-[#2f363e] rounded-lg shadow-2xl overflow-hidden p-8">
      
      <!-- Logo/Header -->
      <div class="flex flex-col items-center mb-8">
          <!-- Logo Placeholder from image -->
          <div class="mb-4">
             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-400">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
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
:deep(.p-password-input) {
  width: 100%;
}

/* Custom styles to match the specific dark theme requested */
:deep(.p-inputtext) {
    background-color: #24292d !important;
    border-color: #3e454d !important;
    color: #e4e6eb !important;
}

:deep(.p-inputtext::placeholder) {
    color: #8b949e !important;
}

:deep(.p-inputtext:focus) {
    border-color: var(--p-primary-color) !important;
    box-shadow: 0 0 0 1px var(--p-primary-color) !important;
}

</style>
