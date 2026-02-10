<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import QrPublicService from '../services/QrPublicService'

const route = useRoute()
const router = useRouter()
const { error: showError } = useSwal()

const loading = ref(true)
const step = ref(1)
const equipo = ref(null)
const token = route.params.token

const form = ref({
  tipo_falla: '',
  descripcion: '',
  nombre_reporta: '',
  email_reporta: ''
})

const commonIssues = [
  { id: 'RED', label: 'Internet', icon: 'pi-wifi', color: 'text-card-blue' },
  { id: 'IMPRESORA', label: 'Impresora', icon: 'pi-print', color: 'text-card-purple' },
  { id: 'LENTO', label: 'Lentitud', icon: 'pi-clock', color: 'text-card-orange' },
  { id: 'ENCENDIDO', label: 'No Prende', icon: 'pi-power-off', color: 'text-card-red' },
  { id: 'SOFTWARE', label: 'Programas', icon: 'pi-desktop', color: 'text-card-teal' },
  { id: 'HARDWARE', label: 'Falla Física', icon: 'pi-cog', color: 'text-gray-500' }
]

const ticketInfo = ref(null)

onMounted(async () => {
  if (!token) {
    loading.value = false
    return
  }
  try {
    const data = await QrPublicService.getEquipoByToken(token)
    if (data && data.equipo) {
      equipo.value = data.equipo
    } else {
      throw new Error('404')
    }
  } catch (e) {
    equipo.value = null
  } finally {
    loading.value = false
  }
})

const selectIssue = (label) => {
  form.value.tipo_falla = label
  step.value = 2
}

const submitTicket = async () => {
  if (!form.value.descripcion) return
  loading.value = true
  try {
    const data = await QrPublicService.reportFalla(token, form.value)
    ticketInfo.value = { id: data.ticket_id, url: `/soporte${data.url_seguimiento}` }
    step.value = 4
  } catch (e) {
    showError('Error al enviar el reporte. Intente más tarde.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center font-sans transition-all duration-500 sm:p-6 overflow-x-hidden">
    
    <!-- Loader -->
    <div v-if="loading && !equipo" class="text-center animate-pulse">
      <i class="pi pi-spin pi-spinner text-6xl text-primary mb-4"></i>
      <p class="text-xl font-title font-bold text-primary tracking-widest uppercase">Iniciando</p>
    </div>

    <!-- Contenedor Principal Adaptativo -->
    <div v-else-if="equipo" class="w-full flex flex-col sm:flex-row sm:max-w-6xl sm:shadow-2xl sm:rounded-[2.5rem] bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border sm:border transition-all min-h-screen sm:min-h-0 overflow-visible sm:overflow-hidden">
      
      <!-- HERO / SIDEBAR: Adaptable -->
      <div class="bg-primary w-full sm:w-[35%] lg:w-[30%] p-6 sm:p-10 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden shrink-0 shadow-lg sm:shadow-none z-20">
        <!-- Decoración -->
        <div class="absolute -top-10 -right-10 opacity-10 pointer-events-none hidden sm:block text-white">
           <i class="pi pi-qrcode text-[20rem] rotate-12"></i>
        </div>

        <div class="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-4 sm:gap-10">
          <!-- Logo -->
          <div class="shrink-0">
            <img src="/logo-white.svg" alt="LDS" class="h-10 sm:h-12 lg:h-16 w-auto drop-shadow-md" />
          </div>
          
          <!-- Info del Equipo -->
          <div class="flex-1 bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
            <div class="hidden sm:flex items-center gap-2 mb-2 opacity-60">
              <i class="pi pi-desktop text-[10px]"></i>
              <span class="text-[9px] uppercase font-bold tracking-widest">Activo Identificado</span>
            </div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-black font-title leading-tight mb-1 uppercase tracking-tight">{{ equipo.tipo }}</h2>
            <p class="text-white/80 text-xs sm:text-base font-medium opacity-90 truncate">{{ equipo.marca }} {{ equipo.modelo }}</p>
          </div>
        </div>

        <!-- Slogan Desktop -->
        <div class="mt-10 hidden sm:block">
          <p class="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">Línea Digital del Sureste</p>
        </div>
      </div>

      <!-- ÁREA DE INTERACCIÓN -->
      <div class="flex-1 bg-light-card dark:bg-dark-card flex flex-col relative z-10">
        
        <div class="flex-1 p-6 sm:p-10 lg:p-16 overflow-y-visible sm:overflow-y-auto custom-scroll flex flex-col justify-center">
          
          <!-- STEP 1: Selección Directa -->
          <div v-if="step === 1" class="animate-fade-in w-full">
            <div class="mb-8 sm:mb-10 text-center sm:text-left">
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black font-title text-light-text dark:text-dark-text mb-2 tracking-tight">¿Qué sucede hoy?</h2>
              <p class="text-light-muted dark:text-dark-muted text-base sm:text-lg">Toca una opción para recibir ayuda técnica.</p>
            </div>

            <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              <button 
                v-for="issue in commonIssues" :key="issue.id"
                @click="selectIssue(issue.label)"
                class="flex flex-row sm:flex-col items-center gap-4 sm:gap-0 p-4 sm:p-6 rounded-2xl border-2 border-slate-50 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 hover:bg-white dark:hover:bg-dark-card hover:border-primary/40 transition-all text-left sm:text-center active:scale-[0.97] shadow-sm sm:hover:shadow-lg"
              >
                <div class="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card shadow-inner sm:mb-4 shrink-0 transition-transform group-hover:scale-110">
                  <i :class="`pi ${issue.icon} text-xl sm:text-3xl ${issue.color}`"></i>
                </div>
                <span class="font-bold text-sm lg:text-base font-title text-light-text dark:text-dark-text tracking-tight uppercase">{{ issue.label }}</span>
              </button>
            </div>
          </div>

          <!-- STEP 2: Detalles -->
          <div v-if="step === 2" class="animate-fade-in max-w-2xl w-full mx-auto">
            <div class="flex items-center gap-4 mb-6 sm:mb-8">
              <button @click="step = 1" class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                <i class="pi pi-arrow-left text-lg"></i>
              </button>
              <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">Cuéntanos más</h2>
            </div>
            <textarea 
              v-model="form.descripcion" 
              rows="5" 
              class="w-full text-base sm:text-lg p-5 sm:p-6 border-2 border-light-border dark:border-dark-border rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none focus:bg-white transition-all resize-none mb-6 sm:mb-8 shadow-inner"
              placeholder="Describe el problema de forma sencilla..."
            ></textarea>
            <button @click="step = 3" :disabled="!form.descripcion" class="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all text-base sm:text-lg uppercase tracking-widest">Continuar</button>
          </div>

          <!-- STEP 3: Identificación -->
          <div v-if="step === 3" class="animate-fade-in max-w-xl w-full mx-auto">
            <div class="flex items-center gap-4 mb-6 sm:mb-8">
              <button @click="step = 2" class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                <i class="pi pi-arrow-left text-lg"></i>
              </button>
              <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">¿Quién eres?</h2>
            </div>
            <div class="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
              <input v-model="form.nombre_reporta" type="text" class="w-full text-base sm:text-lg p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none transition-all shadow-inner" placeholder="Escribe tu nombre" />
              <input v-model="form.email_reporta" type="email" class="w-full text-base sm:text-lg p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none transition-all shadow-inner" placeholder="correo@ejemplo.com" />
            </div>
            <button @click="submitTicket" :disabled="loading" class="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all text-base sm:text-lg uppercase tracking-widest flex items-center justify-center gap-3">
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              <span>Enviar Reporte</span>
            </button>
          </div>

          <!-- STEP 4: ÉXITO -->
          <div v-if="step === 4" class="text-center animate-fade-in max-w-2xl w-full mx-auto py-4 sm:py-0">
            <div class="w-24 h-24 sm:w-28 sm:h-28 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-success/20">
              <i class="pi pi-check text-5xl text-success"></i>
            </div>
            <h2 class="text-3xl lg:text-4xl font-black font-title text-success mb-3 tracking-tight">¡Recibido!</h2>
            <p class="text-lg text-light-muted dark:text-dark-muted mb-8 leading-tight">TI recibió tu reporte con el folio:<br><span class="font-mono font-black text-primary text-3xl mt-2 block tracking-tighter">#{{ ticketInfo.id }}</span></p>
            <div class="bg-primary/5 dark:bg-primary/10 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-2 border-primary/20 mb-8 shadow-sm">
              <p class="text-xs uppercase font-black tracking-widest mb-3 opacity-60">Enlace de Seguimiento</p>
              <a :href="ticketInfo.url" class="text-lg font-bold text-primary underline break-all hover:text-primary-hover font-mono">Ver Avances</a>
            </div>
            <button @click="step = 1" class="text-light-muted dark:text-dark-muted hover:text-primary text-xs font-black uppercase tracking-[0.2em]">Cerrar</button>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* Scrollbar invisible pero funcional */
.custom-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.custom-scroll::-webkit-scrollbar {
  display: none;
}
</style>