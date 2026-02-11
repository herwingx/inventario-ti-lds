<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import QrPublicService from '../services/QrPublicService'
import { History, Clock, ChevronRight, AlertCircle, Info } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { error: showError } = useSwal()

const loading = ref(true)
const step = ref(1)
const equipo = ref(null)
const ticketsActivos = ref([])
const ticketsHistorial = ref([])
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
      ticketsActivos.value = data.tickets_activos || []
      ticketsHistorial.value = data.tickets_historial || []
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
    showError('Error al enviar el reporte.')
  } finally {
    loading.value = false
  }
}

const goToTicket = (tokenAcceso) => {
  router.push(`/q/ticket/${tokenAcceso}`)
}
</script>

<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center font-sans transition-all duration-500 sm:p-6 overflow-x-hidden">
    
    <!-- Loader -->
    <div v-if="loading && !equipo" class="text-center animate-pulse">
      <i class="pi pi-spin pi-spinner text-6xl text-primary mb-4"></i>
      <p class="text-xl font-title font-bold text-primary tracking-widest uppercase">Iniciando</p>
    </div>

    <!-- Contenedor Principal -->
    <div v-else-if="equipo" class="w-full flex flex-col sm:flex-row sm:max-w-6xl sm:shadow-2xl sm:rounded-[2.5rem] bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border sm:border transition-all min-h-screen sm:min-h-0 overflow-visible sm:overflow-hidden">
      
      <!-- SIDEBAR IZQUIERDO -->
      <div class="bg-primary w-full sm:w-[35%] lg:w-[30%] p-6 sm:p-10 text-white flex flex-col justify-center relative overflow-hidden shrink-0 shadow-lg sm:shadow-none z-20">
        <div class="absolute -top-10 -right-10 opacity-10 pointer-events-none hidden sm:block">
           <i class="pi pi-qrcode text-[20rem] rotate-12"></i>
        </div>

        <div class="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-4 sm:gap-10">
          <div class="shrink-0">
            <img src="/logo-white.svg" alt="LDS" class="h-10 sm:h-12 lg:h-16 w-auto drop-shadow-md" />
          </div>
          
          <div class="flex-1 bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
            <div class="hidden sm:flex items-center gap-2 mb-2 opacity-60">
              <i class="pi pi-desktop text-[10px]"></i>
              <span class="text-[9px] uppercase font-bold tracking-widest">Activo Identificado</span>
            </div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-black font-title leading-tight mb-1 uppercase tracking-tight">{{ equipo.tipo }}</h2>
            <p class="text-white/80 text-xs sm:text-base font-medium opacity-90 truncate">{{ equipo.marca }} {{ equipo.modelo }}</p>
          </div>
        </div>
      </div>

      <!-- ÁREA DE INTERACCIÓN -->
      <div class="flex-1 bg-light-card dark:bg-dark-card flex flex-col relative z-10 overflow-hidden">
        
        <div class="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto custom-scroll flex flex-col">
          
          <!-- STEP 1: Selección + Historial -->
          <div v-if="step === 1" class="animate-fade-in w-full space-y-10">
            
            <!-- Sección de Reporte Nuevo -->
            <section>
              <div class="mb-8 text-center sm:text-left">
                <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text mb-2 tracking-tight">¿Qué sucede hoy?</h2>
                <p class="text-light-muted dark:text-dark-muted text-base sm:text-lg">Selecciona una categoría para recibir ayuda.</p>
              </div>

              <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <button 
                  v-for="issue in commonIssues" :key="issue.id"
                  @click="selectIssue(issue.label)"
                  class="flex flex-row sm:flex-col items-center gap-4 sm:gap-0 p-4 sm:p-6 rounded-2xl border-2 border-slate-50 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 hover:bg-white dark:hover:bg-dark-card hover:border-primary/40 transition-all text-left sm:text-center active:scale-[0.97] shadow-sm sm:hover:shadow-lg group"
                >
                  <div class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card shadow-inner sm:mb-4 shrink-0 transition-transform group-hover:scale-110">
                    <i :class="`pi ${issue.icon} text-xl sm:text-2xl ${issue.color}`"></i>
                  </div>
                  <span class="font-bold text-sm lg:text-base font-title text-light-text dark:text-dark-text uppercase">{{ issue.label }}</span>
                </button>
              </div>
            </section>

            <!-- Sección de Historial Activo -->
            <section v-if="ticketsActivos.length > 0">
              <div class="flex items-center gap-2 mb-4 border-b border-light-border dark:border-dark-border pb-2">
                <Clock class="text-amber-500" :size="18" />
                <h3 class="text-sm font-black text-light-text dark:text-dark-text uppercase tracking-widest">Reportes en curso</h3>
              </div>
              <div class="space-y-2">
                <div 
                  v-for="ticket in ticketsActivos" :key="ticket.id"
                  @click="goToTicket(ticket.token_acceso)"
                  class="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span class="font-bold text-sm text-amber-800 dark:text-amber-200 uppercase">{{ ticket.tipo_falla }}</span>
                  </div>
                  <ChevronRight class="text-amber-400" :size="16" />
                </div>
              </div>
            </section>

            <!-- Sección de Historial Pasado (Collapsible opcional o simple lista) -->
            <section v-if="ticketsHistorial.length > 0">
              <div class="flex items-center gap-2 mb-4 border-b border-light-border dark:border-dark-border pb-2 opacity-60">
                <History class="text-light-muted" :size="18" />
                <h3 class="text-sm font-black text-light-text dark:text-dark-text uppercase tracking-widest">Reportes anteriores</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div 
                  v-for="ticket in ticketsHistorial" :key="ticket.id"
                  @click="goToTicket(ticket.token_acceso)"
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-bg/20 border border-light-border dark:border-dark-border rounded-xl cursor-pointer hover:border-primary/30 opacity-70 hover:opacity-100 transition-all"
                >
                  <span class="text-xs font-bold text-light-muted dark:text-dark-muted truncate">{{ ticket.tipo_falla }}</span>
                  <span class="text-[9px] font-black text-primary uppercase">{{ new Date(ticket.fecha_creacion).toLocaleDateString() }}</span>
                </div>
              </div>
            </section>

          </div>

          <!-- RESTO DE LOS STEPS (2, 3, 4) permanecen igual pero con paddings ajustados -->
          <div v-if="step === 2" class="animate-fade-in max-w-2xl w-full mx-auto justify-center flex flex-col h-full">
            <div class="flex items-center gap-4 mb-8">
              <button @click="step = 1" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                <i class="pi pi-arrow-left text-lg"></i>
              </button>
              <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">Cuéntanos más</h2>
            </div>
            <textarea v-model="form.descripcion" rows="5" class="w-full text-base p-5 border-2 border-light-border dark:border-dark-border rounded-2xl bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none focus:bg-white transition-all resize-none mb-8 shadow-inner" placeholder="Escribe aquí..."></textarea>
            <button @click="step = 3" :disabled="!form.descripcion" class="w-full py-4 rounded-xl font-black bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm">Continuar</button>
          </div>

          <div v-if="step === 3" class="animate-fade-in max-w-xl w-full mx-auto justify-center flex flex-col h-full">
            <div class="flex items-center gap-4 mb-8">
              <button @click="step = 2" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                <i class="pi pi-arrow-left text-lg"></i>
              </button>
              <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">¿Quién reporta?</h2>
            </div>
            <div class="space-y-4 mb-8">
              <input v-model="form.nombre_reporta" type="text" class="w-full text-base p-4 rounded-xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none shadow-inner" placeholder="Tu nombre" />
              <input v-model="form.email_reporta" type="email" class="w-full text-base p-4 rounded-xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none shadow-inner" placeholder="correo@ejemplo.com" />
            </div>
            <button @click="submitTicket" :disabled="loading" class="w-full py-4 rounded-xl font-black bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              <span>Enviar Reporte</span>
            </button>
          </div>

          <div v-if="step === 4" class="text-center animate-fade-in max-w-2xl w-full mx-auto py-10">
            <div class="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i class="pi pi-check text-5xl text-success"></i>
            </div>
            <h2 class="text-3xl font-black font-title text-success mb-2 tracking-tight">¡Enviado!</h2>
            <p class="text-lg text-light-muted mb-8 px-4 leading-tight">Folio registrado:<br><span class="font-mono font-black text-primary text-3xl">#{{ ticketInfo.id }}</span></p>
            <div class="bg-primary/5 p-6 rounded-3xl border-2 border-primary/20 mb-8 mx-4">
              <a :href="ticketInfo.url" class="text-base font-bold text-primary underline break-all font-mono">Ver Seguimiento</a>
            </div>
            <button @click="step = 1" class="text-light-muted text-xs font-black uppercase tracking-widest">Terminar</button>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(19, 180, 151, 0.2); border-radius: 20px; }
</style>
