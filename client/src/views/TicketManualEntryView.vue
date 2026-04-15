<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { ShieldCheck, Search, ArrowRight, Ticket, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const code = ref('')

const goToSupport = () => {
  if (code.value.length >= 6) {
    router.push(`/q/${code.value.toLowerCase().trim()}`)
  }
}
</script>

<template>
  <div class="relative min-h-screen bg-light-bg dark:bg-dark-bg font-sans transition-all duration-500 overflow-x-hidden">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/12 blur-3xl"></div>
      <div class="absolute top-28 -right-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-slate-400/10 blur-3xl"></div>
    </div>
    
    <!-- Contenedor Principal Adaptativo -->
    <div class="relative z-10 w-full max-w-6xl mx-auto min-h-screen flex items-stretch sm:items-center p-0 sm:p-6 lg:p-8">
      <div class="w-full flex flex-col lg:flex-row bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl lg:shadow-2xl lg:rounded-[3rem] border-light-border dark:border-dark-border lg:border overflow-hidden min-h-screen lg:min-h-[720px]">
      
      <!-- HERO / SIDEBAR: Identidad de Marca -->
      <div class="relative bg-primary w-full lg:w-[38%] p-8 sm:p-12 lg:p-14 text-white flex flex-col justify-between items-center sm:items-start overflow-hidden shrink-0 shadow-lg z-20">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_40%)]"></div>
        <div class="absolute -top-10 -left-10 opacity-10 pointer-events-none hidden lg:block">
           <i class="pi pi-shield text-[20rem] rotate-12"></i>
        </div>

        <div class="relative z-10 mb-6 lg:mb-12 w-full flex items-center justify-between lg:justify-start gap-4">
          <img src="/logo-white.svg" alt="LDS" class="h-12 sm:h-16 lg:h-20 w-auto drop-shadow-2xl" />
          <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldCheck :size="12" />
            Soporte
          </div>
        </div>

        <div class="relative z-10 text-center sm:text-left w-full">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-[0.3em] mb-5">
            <Sparkles :size="12" />
            Acceso rápido
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black font-title mb-3 tracking-tight leading-tight uppercase">Centro de Ayuda</h1>
          <div class="h-1 w-14 bg-white/30 rounded-full mb-4 mx-auto sm:mx-0"></div>
          <p class="text-white/80 text-sm sm:text-base lg:text-lg font-medium max-w-[240px] sm:max-w-sm leading-relaxed">
            Localiza tu etiqueta LDS e ingresa el código del equipo.
          </p>
        </div>

        <div class="relative z-10 grid grid-cols-2 gap-3 w-full mt-8">
          <div class="rounded-2xl bg-white/10 border border-white/15 p-4">
            <div class="flex items-center gap-2 mb-2 opacity-80">
              <Ticket :size="14" />
              <span class="text-[9px] uppercase font-black tracking-[0.25em]">1. Buscar</span>
            </div>
            <p class="text-xs text-white/80 leading-relaxed">Escribe el código que aparece en la etiqueta del activo.</p>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-4">
            <div class="flex items-center gap-2 mb-2 opacity-80">
              <ArrowRight :size="14" />
              <span class="text-[9px] uppercase font-black tracking-[0.25em]">2. Reportar</span>
            </div>
            <p class="text-xs text-white/80 leading-relaxed">Completa el formulario y envía tu solicitud.</p>
          </div>
        </div>
      </div>

      <!-- ÁREA DE INTERACCIÓN -->
      <div class="flex-1 bg-light-card dark:bg-dark-card flex flex-col justify-center relative z-10">
        
        <div class="p-8 sm:p-16 lg:p-20 w-full max-w-2xl mx-auto">
          
          <div class="mb-10 text-center sm:text-left">
            <div class="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6 mx-auto sm:mx-0 rotate-3 border border-primary/10">
              <Search class="text-primary" :size="24" />
            </div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">Paso 1 de 2</p>
            <h2 class="text-3xl lg:text-4xl font-black font-title text-light-text dark:text-dark-text mb-3 tracking-tight">Busca tu equipo</h2>
            <p class="text-light-muted dark:text-dark-muted text-base lg:text-lg max-w-2xl leading-relaxed">Escribe el código que aparece debajo del código QR para abrir la ficha de ayuda del activo.</p>
          </div>

          <div class="mb-10 group bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-[2rem] p-4 sm:p-6 shadow-lg">
            <label class="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 transition-colors">Código de Activo</label>
            <InputText 
              v-model="code" 
              placeholder="EJ: 7E44A7" 
              class="w-full !text-center lg:!text-left !text-3xl sm:!text-4xl lg:!text-5xl !tracking-[0.2em] !py-5 sm:!py-6 !rounded-2xl !border-2 !border-light-border dark:!border-dark-border focus:!border-primary !bg-slate-50 dark:!bg-dark-bg text-light-text dark:text-dark-text font-mono font-black uppercase transition-all"
              @keyup.enter="goToSupport"
              autofocus
            />
            <p class="text-xs text-light-muted dark:text-dark-muted mt-4 leading-relaxed">El código se encuentra en la etiqueta del equipo. Si no lo tienes, puedes volver al acceso administrativo.</p>
          </div>

          <Button 
            label="Verificar Equipo" 
            icon="pi pi-arrow-right" 
            iconPos="right"
            class="!w-full !text-lg !py-5 !rounded-2xl !font-black !bg-primary !border-none shadow-2xl hover:!bg-primary-hover active:scale-95 transition-all mb-10 !text-white uppercase tracking-widest"
            @click="goToSupport"
            :disabled="code.trim().length < 6"
          />
          
          <div class="pt-8 border-t border-light-border dark:border-dark-border text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center justify-center sm:justify-start gap-2 text-light-muted dark:text-dark-muted text-xs font-black uppercase tracking-widest">
              <i class="pi pi-info-circle text-primary"></i>
              Soporte guiado y rápido
            </div>
            <router-link :to="{ name: 'login' }" class="text-light-muted dark:text-dark-muted hover:text-primary transition-colors text-xs font-black inline-flex items-center gap-2 uppercase tracking-widest">
              <i class="pi pi-user text-[10px]"></i>
              Acceso Administrativo
            </router-link>
          </div>
        </div>

      </div>
      </div>

      </div>

    </div>
</template>

<style scoped>
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 6px rgba(19, 180, 151, 0.1) !important;
}
</style>