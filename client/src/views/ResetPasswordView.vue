<script setup>
/**
 * @fileoverview Vista para restablecer contraseña.
 * Permite al usuario definir una nueva contraseña usando un token válido.
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthService from '../services/AuthService'
import { useSwal } from '../composables/useSwal'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { ShieldCheck, KeyRound, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-vue-next'

const { success: toastSuccess, error: toastError, warning: toastWarning } = useSwal()
const router = useRouter()
const route = useRoute()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

onMounted(() => {
  token.value = route.params.token
  if (!token.value) {
    toastError('Token inválido')
    router.push({ name: 'login' })
  }
})

const handleResetPassword = async () => {
  if (!password.value || !confirmPassword.value) {
    toastWarning('Ambos campos son obligatorios')
    return
  }

  if (password.value !== confirmPassword.value) {
    toastError('Las contraseñas no coinciden')
    return
  }

  loading.value = true
  try {
    const res = await AuthService.resetPassword(token.value, password.value)
    toastSuccess(res.message)

    setTimeout(() => {
      router.push({ name: 'login' })
    }, 2000)
  } catch (error) {
    console.error(error)
    const msg = error.response?.data?.message || 'Error al restablecer contraseña.'
    toastError(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen bg-light-bg dark:bg-dark-bg font-sans overflow-hidden">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/12 blur-3xl"></div>
      <div class="absolute top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl"></div>
    </div>

    <div class="relative z-10 min-h-screen flex items-stretch lg:items-center justify-center p-0 sm:p-6 lg:p-8">
      <div class="w-full max-w-6xl grid lg:grid-cols-[0.95fr_1.05fr] overflow-hidden lg:rounded-[2.75rem] shadow-2xl border border-light-border dark:border-dark-border bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl">
        <aside class="relative bg-dark-bg text-white p-8 sm:p-10 lg:p-12 overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(19,180,151,0.2),transparent_40%)]"></div>
          <div class="relative z-10 flex items-center justify-between mb-12">
            <img src="/icono2.png" alt="Linea Digital" class="h-14 w-14 object-contain rounded-2xl bg-white/5 p-2 border border-white/10 shadow-lg" />
            <div class="hidden sm:flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
              <ShieldCheck :size="12" />
              Verificación segura
            </div>
          </div>

          <div class="relative z-10 max-w-xl">
            <div class="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-5 text-gray-300">
              <Sparkles :size="12" />
              Nuevo acceso
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black font-title tracking-tight leading-tight uppercase">Restablece tu contraseña</h1>
            <p class="mt-4 text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Define una nueva contraseña segura para continuar con tu acceso al sistema.
            </p>

            <div class="mt-8 space-y-3">
              <div class="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-start gap-3">
                <KeyRound :size="18" class="mt-0.5 text-primary shrink-0" />
                <div>
                  <p class="text-sm font-black uppercase tracking-[0.2em] mb-1">Nueva clave</p>
                  <p class="text-sm text-gray-300 leading-relaxed">Usa una combinación que no hayas reutilizado antes.</p>
                </div>
              </div>
              <div class="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-start gap-3">
                <CheckCircle2 :size="18" class="mt-0.5 text-primary shrink-0" />
                <div>
                  <p class="text-sm font-black uppercase tracking-[0.2em] mb-1">Confirmación</p>
                  <p class="text-sm text-gray-300 leading-relaxed">Se valida que ambos campos coincidan antes de guardar.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main class="p-6 sm:p-10 lg:p-12 flex items-center justify-center">
          <div class="w-full max-w-md">
            <div class="mb-8 text-center lg:text-left">
              <div class="mx-auto lg:mx-0 mb-5 h-14 w-14 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                <KeyRound class="text-primary" :size="26" />
              </div>
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">Paso final</p>
              <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">Restablecer contraseña</h2>
              <p class="text-light-muted dark:text-dark-muted mt-3 text-base leading-relaxed">
                Escribe tu nueva contraseña y confirma para completar el cambio.
              </p>
            </div>

            <div class="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[2rem] p-5 sm:p-6 shadow-lg">
              <form @submit.prevent="handleResetPassword" class="flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                  <label for="password" class="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Nueva contraseña</label>
                  <Password id="password" v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full !rounded-2xl !py-3.5 !border-2 !border-light-border dark:!border-dark-border !bg-slate-50 dark:!bg-dark-bg !text-light-text dark:!text-dark-text focus:!border-primary" placeholder="Mínimo 6 caracteres" :disabled="loading" />
                </div>

                <div class="flex flex-col gap-2">
                  <label for="confirm" class="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Confirmar contraseña</label>
                  <Password id="confirm" v-model="confirmPassword" :feedback="false" toggleMask class="w-full" inputClass="w-full !rounded-2xl !py-3.5 !border-2 !border-light-border dark:!border-dark-border !bg-slate-50 dark:!bg-dark-bg !text-light-text dark:!text-dark-text focus:!border-primary" placeholder="Repite la contraseña" :disabled="loading" />
                </div>

                <div class="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-sm text-light-muted dark:text-dark-muted leading-relaxed">
                  La contraseña debe ser fácil de recordar para ti y difícil de adivinar para otros.
                </div>

                <Button type="submit" label="Cambiar contraseña" :loading="loading" class="w-full !bg-primary !border-none hover:!bg-primary-hover !font-black !py-3.5 !rounded-2xl !text-white uppercase tracking-widest" />

                <button type="button" @click="router.push({ name: 'login' })" class="inline-flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-light-muted dark:text-dark-muted hover:text-primary transition-colors">
                  <ArrowLeft :size="16" />
                  Volver al inicio de sesión
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
