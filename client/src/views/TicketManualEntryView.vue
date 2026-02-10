<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const router = useRouter()
const code = ref('')

const goToSupport = () => {
  if (code.value.length >= 6) {
    router.push(`/q/${code.value.toLowerCase().trim()}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center font-sans overflow-hidden">
    
    <!-- Contenedor Principal Adaptativo -->
    <div class="w-full h-full lg:h-auto lg:max-w-5xl lg:flex lg:shadow-2xl lg:rounded-[3rem] lg:overflow-hidden lg:border lg:border-light-border lg:dark:border-dark-border bg-light-card dark:bg-dark-card transition-all duration-500">
      
      <!-- LADO IZQUIERDO: Branding e Instrucciones (Desktop) / Cabecera (Mobile) -->
      <div class="bg-primary w-full lg:w-5/12 p-8 sm:p-12 lg:p-16 text-white flex flex-col justify-center items-center lg:items-start relative overflow-hidden shrink-0">
        <!-- Decoración -->
        <div class="absolute -top-10 -left-10 opacity-10 pointer-events-none">
           <i class="pi pi-shield text-[15rem] rotate-12"></i>
        </div>

        <div class="relative z-10 mb-8 lg:mb-12">
          <img src="/logo-white.svg" alt="LDS Logo" class="h-20 sm:h-24 lg:h-28 w-auto drop-shadow-2xl" />
        </div>

        <div class="relative z-10 text-center lg:text-left">
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-title font-bold mb-4 tracking-tight leading-tight">Centro de <br class="hidden lg:block"> Ayuda</h1>
          <div class="h-1.5 w-20 bg-white/30 rounded-full mb-6 mx-auto lg:mx-0"></div>
          <p class="text-white/80 text-lg lg:text-xl font-medium max-w-xs leading-relaxed">
            Estamos aquí para resolver cualquier inconveniente técnico con tu equipo.
          </p>
        </div>

        <!-- Instrucciones Desktop -->
        <div class="hidden lg:flex flex-col gap-4 mt-12 relative z-10 text-white/60 text-sm italic">
          <div class="flex items-center gap-3">
            <i class="pi pi-check-circle"></i>
            <span>Localiza tu etiqueta LDS</span>
          </div>
          <div class="flex items-center gap-3">
            <i class="pi pi-check-circle"></i>
            <span>Ingresa el código de 8 dígitos</span>
          </div>
        </div>
      </div>

      <!-- LADO DERECHO: Interacción -->
      <div class="flex-1 p-8 sm:p-16 lg:p-20 flex flex-col justify-center bg-light-card dark:bg-dark-card relative">
        
        <div class="max-w-md mx-auto w-full">
          <div class="mb-12 text-center lg:text-left">
            <h2 class="text-2xl lg:text-3xl font-title font-bold text-light-text dark:text-dark-text mb-4">Busca tu Equipo</h2>
            <p class="text-light-muted dark:text-dark-muted text-lg">Escribe el código que aparece debajo del QR en tu etiqueta.</p>
          </div>

          <div class="mb-10 group">
            <label class="block text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 transition-colors">Código de Activo</label>
            <InputText 
              v-model="code" 
              placeholder="EJ: 7E44A7" 
              class="w-full !text-center lg:!text-left !text-4xl sm:!text-5xl lg:!text-6xl !tracking-[0.2em] !py-6 lg:!py-8 !rounded-3xl !border-2 !border-light-border dark:!border-dark-border focus:!border-primary !bg-slate-50 dark:!bg-dark-bg font-mono font-black shadow-inner uppercase transition-all"
              @keyup.enter="goToSupport"
              autofocus
            />
          </div>

          <Button 
            label="Buscar mi Equipo" 
            icon="pi pi-search" 
            iconPos="right"
            class="!w-full !text-xl !py-6 lg:!py-8 !rounded-[2rem] !font-bold !bg-primary !border-none shadow-2xl hover:!bg-primary-hover active:scale-95 transition-all mb-10 !text-white"
            @click="goToSupport"
            :disabled="code.trim().length < 6"
          />
          
          <div class="pt-8 border-t border-light-border dark:border-dark-border text-center lg:text-left">
            <router-link :to="{ name: 'login' }" class="text-light-muted dark:text-dark-muted hover:text-primary transition-colors text-sm font-bold inline-flex items-center gap-2">
              <i class="pi pi-arrow-left text-xs"></i>
              Regresar al Inicio de Sesión
            </router-link>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 8px rgba(19, 180, 151, 0.1) !important;
}
</style>