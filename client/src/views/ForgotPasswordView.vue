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
import { ArrowLeft, MailCheck, ShieldCheck, Sparkles, ArrowRight } from 'lucide-vue-next'

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
  <div class="relative min-h-screen bg-light-bg dark:bg-dark-bg font-sans overflow-hidden">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/12 blur-3xl"></div>
      <div class="absolute top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl"></div>
    </div>

    <div class="relative z-10 min-h-screen flex items-stretch lg:items-center justify-center p-0 sm:p-6 lg:p-8">
      <div class="w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden lg:rounded-[2.75rem] shadow-2xl border border-light-border dark:border-dark-border bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl">
        <aside class="relative bg-primary text-white p-8 sm:p-10 lg:p-12 overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_40%)]"></div>
          <div class="relative z-10 flex items-center justify-between mb-12">
            <img src="/icono2.png" alt="Linea Digital" class="h-14 w-14 object-contain rounded-2xl bg-white/10 p-2 border border-white/15 shadow-lg" />
            <div class="hidden sm:flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck :size="12" />
              Recuperación segura
            </div>
          </div>

          <div class="relative z-10 max-w-xl">
            <div class="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-5">
              <Sparkles :size="12" />
              Acceso asistido
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black font-title tracking-tight leading-tight uppercase">Recupera tu acceso</h1>
            <p class="mt-4 text-white/82 text-base sm:text-lg leading-relaxed max-w-xl">
              Te enviaremos un enlace temporal para crear una nueva contraseña sin complicaciones.
            </p>

            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-white/10 border border-white/15 p-4">
                <MailCheck :size="18" class="mb-3" />
                <p class="text-sm font-black uppercase tracking-[0.2em] mb-2">Correo validado</p>
                <p class="text-sm text-white/80 leading-relaxed">Usa el correo corporativo que ya registraste en el sistema.</p>
              </div>
              <div class="rounded-2xl bg-white/10 border border-white/15 p-4">
                <ShieldCheck :size="18" class="mb-3" />
                <p class="text-sm font-black uppercase tracking-[0.2em] mb-2">Enlace temporal</p>
                <p class="text-sm text-white/80 leading-relaxed">El vínculo expira para mantener tu cuenta protegida.</p>
              </div>
            </div>
          </div>
        </aside>

        <main class="p-6 sm:p-10 lg:p-12 flex items-center justify-center">
          <div class="w-full max-w-md">
            <div class="mb-8 text-center lg:text-left">
              <div class="mx-auto lg:mx-0 mb-5 h-14 w-14 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                <MailCheck class="text-primary" :size="26" />
              </div>
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">Paso 1 de 1</p>
              <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">Recuperación de contraseña</h2>
              <p class="text-light-muted dark:text-dark-muted mt-3 text-base leading-relaxed">
                Ingresa tu correo corporativo y te enviaremos las instrucciones de restablecimiento.
              </p>
            </div>

            <div class="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[2rem] p-5 sm:p-6 shadow-lg">
              <form @submit.prevent="handleForgotPassword" class="flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                  <label for="email" class="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Correo electrónico</label>
                  <InputText id="email" v-model="email" class="w-full !rounded-2xl !py-3.5 !border-2 !border-light-border dark:!border-dark-border !bg-slate-50 dark:!bg-dark-bg !text-light-text dark:!text-dark-text focus:!border-primary" placeholder="nombre@empresa.com" :disabled="loading" autofocus />
                </div>

                <Button type="submit" label="Enviar enlace" :loading="loading" class="w-full !bg-primary !border-none hover:!bg-primary-hover !font-black !py-3.5 !rounded-2xl !text-white uppercase tracking-widest" />

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
