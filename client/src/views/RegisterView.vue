<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '../services/AuthService'
import { useSwal } from '../composables/useSwal'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { Layers } from 'lucide-vue-next'

const router = useRouter()
const { error: toastError, success: toastSuccess, warning: toastWarning, Swal } = useSwal()

const nombres = ref('')
const apellidos = ref('')
const email = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (!nombres.value || !apellidos.value || !email.value) {
    toastWarning('Completa nombre, apellidos y correo')
    return
  }

  loading.value = true

  try {
    const response = await AuthService.register({
      nombres: nombres.value,
      apellidos: apellidos.value,
      email: email.value
    })

    if (response?.data?.emailDelivered === false && response?.data?.tempPassword) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cuenta creada sin envío de correo',
        html: `
          <p class="mb-3">El sistema no pudo enviar el correo SMTP, pero tu cuenta ya quedó creada.</p>
          <div class="text-left rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40">
            <p class="text-xs uppercase tracking-wide text-gray-500 mb-1">Usuario</p>
            <p class="font-semibold mb-3">${response.data.username}</p>
            <p class="text-xs uppercase tracking-wide text-gray-500 mb-1">Contraseña temporal</p>
            <p class="font-mono text-sm break-all">${response.data.tempPassword}</p>
          </div>
          <p class="mt-3 text-sm">Guárdala ahora e inicia sesión con esos datos.</p>
        `,
        confirmButtonText: 'Ir a iniciar sesión'
      })
      router.replace({ name: 'login' })
      return
    }

    toastSuccess('Cuenta creada. Revisa tu correo con tus credenciales.')
    router.replace({ name: 'login' })
  } catch (error) {
    toastError(error.response?.data?.message || 'No se pudo crear la cuenta')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dark min-h-screen bg-[#24292d] flex items-center justify-center p-4">
    <div class="relative w-full max-w-[460px] bg-[#2f363e] rounded-lg shadow-2xl overflow-hidden p-8">
      <div class="flex flex-col items-center mb-8">
        <div class="mb-4">
          <Layers class="text-gray-400" :size="60" stroke-width="1.5" />
        </div>
        <h1 class="text-xl font-medium text-white">Crear cuenta</h1>
        <p class="text-sm text-gray-400 mt-2 text-center">Ingresa tus datos para recibir tus credenciales por correo.</p>
      </div>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="nombres" class="text-xs font-bold text-gray-300">Nombre(s)</label>
            <InputText id="nombres" v-model="nombres" class="w-full !rounded-md !py-2.5" placeholder="Juan" :disabled="loading" autofocus />
          </div>

          <div class="flex flex-col gap-2">
            <label for="apellidos" class="text-xs font-bold text-gray-300">Apellidos</label>
            <InputText id="apellidos" v-model="apellidos" class="w-full !rounded-md !py-2.5" placeholder="Pérez" :disabled="loading" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="email" class="text-xs font-bold text-gray-300">Correo electrónico</label>
          <InputText id="email" v-model="email" type="email" class="w-full !rounded-md !py-2.5" placeholder="nombre@empresa.com" :disabled="loading" />
        </div>

        <Button type="submit" label="Crear cuenta" :loading="loading" class="w-full !mt-2 !bg-[#1ea97c] !border-none hover:!bg-[#158763] !font-bold !py-2.5 !rounded-md !text-white" />

        <div class="text-center mt-2">
          <span class="text-sm text-gray-400">¿Ya tienes acceso? <router-link :to="{ name: 'login' }" class="text-[#1ea97c] hover:underline">Inicia sesión</router-link></span>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Mantener consistencia visual con login */
:deep(.p-inputtext) {
  background: #ffffff !important;
}
</style>
