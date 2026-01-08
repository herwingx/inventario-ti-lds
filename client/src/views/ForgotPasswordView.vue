<script setup>
/**
 * @fileoverview Vista para recuperar contraseña.
 * Permite al usuario solicitar un enlace de restablecimiento de contraseña vía email.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '../services/AuthService'
import { useSwal } from '../composables/useSwal'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { Layers, ArrowLeft } from 'lucide-vue-next'

const { success: toastSuccess, error: toastError, warning: toastWarning } = useSwal()
const router = useRouter()

const email = ref('')
const loading = ref(false)

const handleForgotPassword = async () => {
  if (!email.value) {
    toastWarning('Ingresa tu correo electrónico')
    return
  }

  loading.value = true
  try {
    const res = await AuthService.forgotPassword(email.value)
    toastSuccess(res.message)
    
    // Regresar al login después de unos segundos
    setTimeout(() => {
        router.push({ name: 'login' })
    }, 4000)
  } catch (error) {
    console.error(error)
    toastError('No se pudo procesar la solicitud.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dark min-h-screen bg-[#24292d] flex items-center justify-center p-4">
    
    <div class="relative w-full max-w-[400px] bg-[#2f363e] rounded-lg shadow-2xl overflow-hidden p-8">
      
      <div class="flex flex-col items-center mb-6">
          <div class="mb-4">
             <Layers class="text-gray-400" :size="50" stroke-width="1.5" />
          </div>
          <h1 class="text-xl font-medium text-white text-center">Recuperación de Contraseña</h1>
          <p class="text-gray-400 text-sm mt-2 text-center">Ingresa tu correo para recibir instrucciones de restablecimiento.</p>
      </div>

      <form @submit.prevent="handleForgotPassword" class="flex flex-col gap-6">
        
        <div class="flex flex-col gap-2">
          <label for="email" class="text-xs font-bold text-gray-300">Correo Electrónico</label>
          <InputText id="email" v-model="email" class="w-full !rounded-md !py-2.5" placeholder="ejemplo@empresa.com" :disabled="loading" autofocus />
        </div>

        <Button type="submit" label="Enviar Enlace" :loading="loading" class="w-full !bg-[#1ea97c] !border-none hover:!bg-[#158763] !font-bold !py-2.5 !rounded-md !text-white" />
      
        <div class="text-center mt-2">
            <button type="button" @click="router.push({ name: 'login' })" class="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors">
                <ArrowLeft :size="16" />
                Volver al inicio de sesión
            </button>
        </div>
      </form>
    
    </div>
  </div>
</template>
