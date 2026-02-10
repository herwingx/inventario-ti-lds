<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const { error: showError } = useSwal()

const loading = ref(true)
const step = ref(1) // 1: Selección, 2: Detalles, 3: Contacto, 4: Éxito
const equipo = ref(null)
const token = route.params.token

// Datos del formulario
const form = ref({
  tipo_falla: '',
  descripcion: '',
  nombre_reporta: '',
  email_reporta: ''
})

// Opciones de falla con tus colores de card definidos en tailwind.config.js
const commonIssues = [
  { id: 'RED', label: 'No tengo Internet', icon: 'pi-wifi', color: 'bg-card-blue text-card-blue border-card-blue/20' },
  { id: 'IMPRESORA', label: 'No imprime', icon: 'pi-print', color: 'bg-card-purple text-card-purple border-card-purple/20' },
  { id: 'LENTO', label: 'está muy lenta', icon: 'pi-clock', color: 'bg-card-orange text-card-orange border-card-orange/20' },
  { id: 'ENCENDIDO', label: 'No prende', icon: 'pi-power-off', color: 'bg-card-red text-card-red border-card-red/20' },
  { id: 'SOFTWARE', label: 'Programa fallando', icon: 'pi-desktop', color: 'bg-card-teal text-card-teal border-card-teal/20' },
  { id: 'HARDWARE', label: 'Algo está roto', icon: 'pi-cog', color: 'bg-gray-500 text-gray-600 border-gray-200' }
]

const ticketInfo = ref(null)

onMounted(async () => {
  if (!token) {
    loading.value = false
    return
  }

  try {
    const { data } = await api.get(`/q/${token}`)
    if (data && data.equipo) {
      equipo.value = data.equipo
    } else {
      throw new Error('Equipo no encontrado')
    }
  } catch (e) {
    console.error('Error cargando equipo por QR:', e)
    equipo.value = null
  } finally {
    loading.value = false
  }
})

const selectIssue = (issueId) => {
  form.value.tipo_falla = issueId
  step.value = 2
}

const submitTicket = async () => {
  if (!form.value.descripcion) return
  
  loading.value = true
  try {
    const { data } = await api.post(`/q/${token}`, form.value)
    ticketInfo.value = {
      id: data.ticket_id,
      url: `/soporte${data.url_seguimiento}`
    }
    step.value = 4
  } catch (e) {
    showError('No se pudo enviar el reporte. Intente de nuevo.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center font-sans overflow-x-hidden">
    
    <!-- Loader Inicial -->
    <div v-if="loading && !equipo" class="text-center animate-pulse">
      <i class="pi pi-spin pi-spinner text-6xl text-primary mb-4"></i>
      <p class="text-2xl font-title font-bold tracking-tight">Iniciando Soporte...</p>
    </div>

    <!-- Contenedor Principal Adaptativo -->
    <div v-else-if="equipo" class="w-full h-screen sm:h-auto sm:max-w-6xl sm:flex sm:shadow-2xl sm:rounded-[3rem] overflow-hidden bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border transition-all">
      
      <!-- SIDEBAR IZQUIERDO: Información del Equipo (Fijo en desktop) -->
      <div class="bg-primary w-full sm:w-1/3 lg:w-[30%] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
        <!-- Decoración -->
        <div class="absolute -top-10 -right-10 opacity-10 pointer-events-none hidden sm:block">
           <i class="pi pi-qrcode text-[15rem] rotate-12"></i>
        </div>

        <div>
          <div class="mb-10 hidden sm:block">
            <img src="/logo-white.svg" alt="LDS Logo" class="h-16 w-auto drop-shadow-md" />
          </div>
          
          <h1 class="text-2xl sm:text-3xl font-title font-bold mb-8">Centro de Soporte</h1>
          
          <div class="space-y-6">
            <div class="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
              <p class="text-white/60 text-xs uppercase font-bold tracking-widest mb-2">Equipo Identificado</p>
              <h2 class="text-xl lg:text-2xl font-bold font-title mb-1 capitalize">{{ equipo.tipo }}</h2>
              <p class="text-white/90 text-lg font-medium opacity-80">{{ equipo.marca }} {{ equipo.modelo }}</p>
            </div>

            <div class="flex items-center gap-3 px-4">
              <div class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <span class="text-sm font-medium opacity-70">Sistema Listo para Reportar</span>
            </div>
          </div>
        </div>

        <div class="mt-12 hidden sm:block">
          <p class="text-xs text-white/40 font-bold uppercase tracking-widest">Línea Digital del Sureste</p>
        </div>
      </div>

      <!-- ÁREA DERECHA: Flujo del Wizard -->
      <div class="flex-1 p-6 sm:p-12 lg:p-16 flex flex-col bg-light-card dark:bg-dark-card overflow-y-auto">
        
        <!-- PASO 1: SELECCIÓN -->
        <div v-if="step === 1" class="animate-fade-in flex flex-col h-full">
          <div class="mb-10 text-center sm:text-left">
            <h2 class="text-3xl sm:text-4xl font-title font-bold text-light-text dark:text-dark-text mb-4">¿En qué podemos ayudarte?</h2>
            <p class="text-light-muted dark:text-dark-muted text-xl">Selecciona el problema que presentas hoy.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <button 
              v-for="issue in commonIssues" 
              :key="issue.id"
              @click="selectIssue(issue.label)"
              class="flex flex-row sm:flex-col items-center gap-4 sm:gap-0 p-6 sm:p-8 rounded-[2rem] border-2 border-transparent bg-slate-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card transition-all group hover:shadow-xl hover:border-primary/30 text-left sm:text-center relative overflow-hidden"
            >
              <div :class="`w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl sm:mb-5 transition-transform group-hover:scale-110 ${issue.color} bg-opacity-10`" style="background-color: rgba(var(--issue-color-rgb), 0.1)">
                <i :class="`pi ${issue.icon} text-3xl sm:text-4xl`" :style="`color: ${issue.color.split(' ')[1].replace('text-', '')}`"></i>
              </div>
              <span class="font-bold text-lg lg:text-xl font-title leading-tight text-light-text dark:text-dark-text">{{ issue.label }}</span>
            </button>
          </div>
        </div>

        <!-- PASO 2: DETALLES -->
        <div v-if="step === 2" class="animate-fade-in max-w-2xl mx-auto w-full">
          <div class="flex items-center gap-4 mb-10">
            <button @click="step = 1" class="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary transition-all hover:text-white">
              <i class="pi pi-arrow-left text-xl"></i>
            </button>
            <h2 class="text-3xl font-title font-bold">Cuéntanos el problema</h2>
          </div>
          
          <div class="mb-10">
            <textarea 
              v-model="form.descripcion" 
              rows="8" 
              class="w-full text-xl lg:text-2xl p-8 border-2 border-light-border dark:border-dark-border rounded-[2.5rem] shadow-inner bg-slate-50 dark:bg-dark-bg focus:border-primary focus:bg-white outline-none transition-all resize-none" 
              placeholder="Ej: Al conectar mi cargador, la computadora hace un ruido extraño y la pantalla parpadea..."
            ></textarea>
          </div>

          <button 
            @click="step = 3"
            :disabled="!form.descripcion"
            class="w-full text-2xl py-8 rounded-[2rem] font-bold bg-primary text-white shadow-2xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
          >
            <span>Continuar</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>

        <!-- PASO 3: IDENTIFICACIÓN -->
        <div v-if="step === 3" class="animate-fade-in max-w-2xl mx-auto w-full">
          <div class="flex items-center gap-4 mb-10">
            <button @click="step = 2" class="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary transition-all hover:text-white">
              <i class="pi pi-arrow-left text-xl"></i>
            </button>
            <h2 class="text-3xl font-title font-bold">¿Quién solicita apoyo?</h2>
          </div>

          <div class="space-y-8 mb-12">
            <div class="group">
              <label class="block font-bold mb-3 text-sm text-light-muted dark:text-dark-muted uppercase tracking-[0.2em]">Nombre Completo</label>
              <input 
                v-model="form.nombre_reporta" 
                type="text"
                class="w-full text-2xl p-6 rounded-2xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg focus:border-primary outline-none transition-all" 
                placeholder="Escribe tu nombre"
              />
            </div>
            <div class="group">
              <label class="block font-bold mb-3 text-sm text-light-muted dark:text-dark-muted uppercase tracking-[0.2em]">Correo Institucional (Opcional)</label>
              <input 
                v-model="form.email_reporta" 
                type="email"
                class="w-full text-2xl p-6 rounded-2xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg focus:border-primary outline-none transition-all" 
                placeholder="ejemplo@lds.com"
              />
            </div>
          </div>

          <button 
            @click="submitTicket"
            :disabled="loading"
            class="w-full text-2xl py-8 rounded-[2rem] font-bold bg-primary text-white shadow-2xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
          >
            <i v-if="loading" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-send"></i>
            <span>Enviar Reporte de Soporte</span>
          </button>
        </div>

        <!-- PASO 4: ÉXITO -->
        <div v-if="step === 4" class="text-center animate-fade-in py-10 max-w-2xl mx-auto w-full">
          <div class="w-32 h-32 sm:w-40 sm:h-40 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
            <i class="pi pi-check text-7xl lg:text-8xl text-success"></i>
          </div>
          <h2 class="text-4xl lg:text-6xl font-title font-bold text-success mb-6">¡Enviado!</h2>
          <p class="text-2xl text-light-muted dark:text-dark-muted mb-12 leading-relaxed">
            TI ha recibido tu reporte. <br>
            Tu Folio es: <span class="font-mono font-black text-primary text-4xl lg:text-6xl mt-4 block tracking-tighter">#{{ ticketInfo.id }}</span>
          </p>
          
          <div class="bg-primary/5 p-10 rounded-[3rem] border-2 border-primary/20 mb-12 shadow-sm">
            <p class="text-xl mb-4 opacity-70">Enlace de seguimiento privado:</p>
            <a :href="ticketInfo.url" class="text-2xl font-bold text-primary underline break-all hover:text-primary-hover">
              Consultar Avance de mi Ticket
            </a>
          </div>

          <button 
            @click="step = 1"
            class="text-light-muted text-xl px-12 py-6 rounded-2xl hover:bg-slate-100 dark:hover:bg-dark-bg transition-all font-bold"
          >
            Finalizar y Cerrar
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>
