<script setup>
/**
 * @fileoverview Vista para restablecer contraseña.
 * Permite al usuario definir una nueva contraseña usando un token válido.
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthService from '../services/AuthService'
import { useToast } from 'primevue/usetoast'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { Layers } from 'lucide-vue-next'

const toast = useToast()
const router = useRouter()
const route = useRoute()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

onMounted(() => {
    // Obtener token de la URL
    token.value = route.params.token
    if (!token.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Token inválido', life: 3000 })
        router.push({ name: 'login' })
    }
})

const handleResetPassword = async () => {
  if (!password.value || !confirmPassword.value) {
     toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ambos campos son obligatorios', life: 3000 })
     return
  }

  if (password.value !== confirmPassword.value) {
     toast.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden', life: 3000 })
     return
  }

  loading.value = true
  try {
    const res = await AuthService.resetPassword(token.value, password.value)
    toast.add({ severity: 'success', summary: 'Éxito', detail: res.message, life: 5000 })
    
    setTimeout(() => {
        router.push({ name: 'login' })
    }, 2000)
  } catch (error) {
    console.error(error)
    const msg = error.response?.data?.message || 'Error al restablecer contraseña.'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dark min-h-screen bg-[#24292d] flex items-center justify-center p-4">
    <Toast />
    
    <div class="relative w-full max-w-[400px] bg-[#2f363e] rounded-lg shadow-2xl overflow-hidden p-8">
      
      <div class="flex flex-col items-center mb-6">
          <div class="mb-4">
             <Layers class="text-gray-400" :size="50" stroke-width="1.5" />
          </div>
          <h1 class="text-xl font-medium text-white text-center">Restablecer Contraseña</h1>
          <p class="text-gray-400 text-sm mt-2 text-center">Crea una nueva contraseña para tu cuenta.</p>
      </div>

      <form @submit.prevent="handleResetPassword" class="flex flex-col gap-5">
        
        <div class="flex flex-col gap-2">
          <label for="password" class="text-xs font-bold text-gray-300">Nueva Contraseña</label>
          <Password id="password" v-model="password" :feedback="true" toggleMask class="w-full" inputClass="w-full !rounded-md !py-2.5" placeholder="Mínimo 6 caracteres" :disabled="loading" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="confirm" class="text-xs font-bold text-gray-300">Confirmar Contraseña</label>
          <Password id="confirm" v-model="confirmPassword" :feedback="false" toggleMask class="w-full" inputClass="w-full !rounded-md !py-2.5" placeholder="Repite la contraseña" :disabled="loading" />
        </div>

        <Button type="submit" label="Cambiar Contraseña" :loading="loading" class="w-full !bg-[#1ea97c] !border-none hover:!bg-[#158763] !font-bold !py-2.5 !rounded-md !text-white !mt-2" />
      
      </form>
    
    </div>
  </div>
</template>

<style scoped>
/* Estilos para Password toggle */
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
}
:deep(.p-password-toggle-mask-icon:hover) {
  color: #13B497;
}
</style>
