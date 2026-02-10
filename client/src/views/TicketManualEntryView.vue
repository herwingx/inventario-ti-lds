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
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center font-sans transition-all duration-500 sm:p-6 overflow-x-hidden">
    
    <!-- Contenedor Principal Adaptativo -->
    <div class="w-full flex flex-col sm:flex-row sm:max-w-5xl sm:shadow-2xl sm:rounded-[3.5rem] bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border sm:border transition-all min-h-screen sm:min-h-0 overflow-visible sm:overflow-hidden">
      
      <!-- HERO / SIDEBAR: Identidad de Marca -->
      <div class="bg-primary w-full sm:w-[40%] lg:w-[35%] p-8 sm:p-12 text-white flex flex-col justify-center items-center sm:items-start relative overflow-hidden shrink-0 shadow-lg sm:shadow-none z-20">
        <!-- Decoración de fondo -->
        <div class="absolute -top-10 -left-10 opacity-10 pointer-events-none hidden sm:block">
           <i class="pi pi-shield text-[20rem] rotate-12"></i>
        </div>

        <div class="relative z-10 mb-6 lg:mb-12">
          <img src="/logo-white.svg" alt="LDS" class="h-12 sm:h-16 lg:h-20 w-auto drop-shadow-2xl" />
        </div>

        <div class="relative z-10 text-center sm:text-left">
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black font-title mb-3 tracking-tight leading-tight uppercase">Centro de Ayuda</h1>
          <div class="h-1 w-12 bg-white/30 rounded-full mb-4 mx-auto sm:mx-0"></div>
          <p class="text-white/80 text-sm sm:text-base lg:text-lg font-medium max-w-[200px] sm:max-w-xs leading-relaxed">
            Localiza tu etiqueta LDS e ingresa el código del equipo.
          </p>
        </div>
      </div>

      <!-- ÁREA DE INTERACCIÓN -->
      <div class="flex-1 bg-light-card dark:bg-dark-card flex flex-col justify-center relative z-10">
        
        <div class="p-8 sm:p-16 lg:p-20 w-full max-w-md mx-auto">
          
          <div class="mb-10 text-center sm:text-left">
            <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0 rotate-3">
              <i class="pi pi-search text-2xl text-primary"></i>
            </div>
            <h2 class="text-2xl lg:text-3xl font-black font-title text-light-text dark:text-dark-text mb-3 tracking-tight">Busca tu Equipo</h2>
            <p class="text-light-muted dark:text-dark-muted text-base">Escribe el código que aparece debajo del código QR.</p>
          </div>

          <div class="mb-10 group">
            <label class="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 transition-colors">Código de Activo</label>
            <InputText 
              v-model="code" 
              placeholder="EJ: 7E44A7" 
              class="w-full !text-center lg:!text-left !text-3xl sm:!text-4xl lg:!text-5xl !tracking-[0.2em] !py-5 sm:!py-6 !rounded-2xl !border-2 !border-light-border dark:!border-dark-border focus:!border-primary !bg-slate-50 dark:!bg-dark-bg text-light-text dark:text-dark-text font-mono font-black shadow-inner uppercase transition-all"
              @keyup.enter="goToSupport"
              autofocus
            />
          </div>

          <Button 
            label="Verificar Equipo" 
            icon="pi pi-arrow-right" 
            iconPos="right"
            class="!w-full !text-lg !py-5 !rounded-2xl !font-black !bg-primary !border-none shadow-2xl hover:!bg-primary-hover active:scale-95 transition-all mb-10 !text-white uppercase tracking-widest"
            @click="goToSupport"
            :disabled="code.trim().length < 6"
          />
          
          <div class="pt-8 border-t border-light-border dark:border-dark-border text-center sm:text-left">
            <router-link :to="{ name: 'login' }" class="text-light-muted dark:text-dark-muted hover:text-primary transition-colors text-xs font-black inline-flex items-center gap-2 uppercase tracking-widest">
              <i class="pi pi-user text-[10px]"></i>
              Acceso Administrativo
            </router-link>
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