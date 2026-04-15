<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '../services/AuthService'
import { useSwal } from '../composables/useSwal'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const router = useRouter()
const { error: toastError, success: toastSuccess, warning: toastWarning, Swal } = useSwal()

const email = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (!email.value) {
    toastWarning('Ingresa tu correo corporativo')
    return
  }

  loading.value = true

  try {
    const response = await AuthService.register({
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
          <img
            src="/icono2.png"
            alt="Linea Digital"
            class="w-16 h-16 object-contain"
            loading="eager"
          />
        </div>
        <h1 class="text-xl font-medium text-white">Crear cuenta</h1>
        <p class="text-sm text-gray-400 mt-2 text-center">Regístrate con tu correo corporativo para recibir tus credenciales.</p>
      </div>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <label for="email" class="text-xs font-bold text-gray-300">Correo corporativo</label>
          <InputText id="email" v-model="email" type="email" class="w-full !rounded-md !py-2.5" placeholder="nombre@empresa.com" :disabled="loading" autofocus />
          <p class="text-xs text-gray-400">
            Solo se permiten correos corporativos activos ya vinculados a un empleado.
          </p>
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
