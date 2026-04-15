<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import QrPublicService from '../services/QrPublicService'
import { History, Clock, ChevronRight, AlertCircle, Info, ShieldCheck, Wrench, MessageSquareText, ArrowRight, Sparkles } from 'lucide-vue-next'

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
const activosCount = computed(() => ticketsActivos.value.length)
const historialCount = computed(() => ticketsHistorial.value.length)

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

const formatShortDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="relative min-h-screen bg-light-bg dark:bg-dark-bg font-sans transition-all duration-500 overflow-x-hidden">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-primary/12 blur-3xl"></div>
      <div class="absolute top-32 -right-28 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-slate-400/10 blur-3xl"></div>
    </div>
    
    <!-- Loader -->
    <div v-if="loading && !equipo" class="relative z-10 min-h-screen flex items-center justify-center text-center px-6 animate-pulse">
      <div>
        <div class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white dark:bg-dark-card shadow-xl flex items-center justify-center border border-light-border dark:border-dark-border">
          <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
        </div>
        <p class="text-lg sm:text-xl font-black text-primary tracking-[0.3em] uppercase">Iniciando</p>
      </div>
    </div>

    <!-- Contenedor Principal -->
    <div v-else-if="equipo" class="relative z-10 w-full max-w-7xl mx-auto min-h-screen flex items-stretch sm:items-center p-0 sm:p-6 lg:p-8">
      <div class="w-full flex flex-col lg:flex-row bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl lg:shadow-2xl lg:rounded-[2.5rem] border-light-border dark:border-dark-border lg:border overflow-hidden min-h-screen lg:min-h-[780px]">
      
      <!-- SIDEBAR IZQUIERDO -->
      <div class="relative bg-primary w-full lg:w-[34%] p-6 sm:p-10 lg:p-12 text-white flex flex-col justify-between overflow-hidden shrink-0 shadow-lg z-20">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_45%)]"></div>
        <div class="absolute -top-10 -right-10 opacity-10 pointer-events-none hidden lg:block">
           <i class="pi pi-qrcode text-[20rem] rotate-12"></i>
        </div>

        <div class="relative z-10 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-5 lg:gap-10">
          <div class="shrink-0 flex items-center gap-3">
            <img src="/logo-white.svg" alt="LDS" class="h-10 sm:h-12 lg:h-16 w-auto drop-shadow-md" />
          </div>
          
          <div class="flex-1 w-full bg-white/12 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
            <div class="hidden lg:flex items-center gap-2 mb-3 opacity-70">
              <ShieldCheck :size="12" />
              <span class="text-[10px] uppercase font-black tracking-[0.3em]">Activo Identificado</span>
            </div>
            <h2 class="text-lg sm:text-xl lg:text-3xl font-black font-title leading-tight mb-2 uppercase tracking-tight">{{ equipo.tipo }}</h2>
            <p class="text-white/85 text-xs sm:text-base font-medium opacity-90 truncate">{{ equipo.marca }} {{ equipo.modelo }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="px-3 py-1 rounded-full bg-white/15 border border-white/15 text-[10px] font-black uppercase tracking-widest">{{ equipo.empresa || 'Empresa' }}</span>
              <span class="px-3 py-1 rounded-full bg-white/15 border border-white/15 text-[10px] font-black uppercase tracking-widest">{{ equipo.sucursal || 'Sucursal' }}</span>
            </div>
          </div>
        </div>

        <div class="relative z-10 mt-6 lg:mt-10 grid grid-cols-3 gap-3 text-center">
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <p class="text-[9px] uppercase tracking-[0.25em] font-black opacity-70">Activos</p>
            <p class="text-xl font-black mt-1">{{ activosCount }}</p>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <p class="text-[9px] uppercase tracking-[0.25em] font-black opacity-70">Historial</p>
            <p class="text-xl font-black mt-1">{{ historialCount }}</p>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <p class="text-[9px] uppercase tracking-[0.25em] font-black opacity-70">Atención</p>
            <p class="text-xl font-black mt-1">24/7</p>
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
              <div class="mb-8">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                  <Sparkles :size="12" />
                  Centro de ayuda
                </div>
                <h2 class="text-3xl sm:text-4xl font-black font-title text-light-text dark:text-dark-text mb-3 tracking-tight">¿Qué sucede hoy?</h2>
                <p class="text-light-muted dark:text-dark-muted text-base sm:text-lg max-w-2xl leading-relaxed">Selecciona una categoría y sigue el flujo guiado para registrar tu incidencia de forma clara y rápida.</p>
              </div>

              <div class="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                <button 
                  v-for="issue in commonIssues" :key="issue.id"
                  @click="selectIssue(issue.label)"
                  class="group relative flex flex-row sm:flex-col items-center gap-4 sm:gap-0 p-4 sm:p-6 rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg/40 hover:bg-white dark:hover:bg-dark-card hover:border-primary/40 transition-all text-left sm:text-center active:scale-[0.98] shadow-sm hover:shadow-xl overflow-hidden"
                >
                  <div class="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card shadow-inner sm:mb-4 shrink-0 transition-transform group-hover:scale-110">
                    <i :class="`pi ${issue.icon} text-xl sm:text-2xl ${issue.color}`"></i>
                  </div>
                  <div class="relative z-10">
                    <span class="font-black text-sm lg:text-base font-title text-light-text dark:text-dark-text uppercase block">{{ issue.label }}</span>
                    <span class="hidden sm:block text-[10px] text-light-muted dark:text-dark-muted mt-1 uppercase tracking-[0.2em]">Reportar ahora</span>
                  </div>
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
                  class="flex items-center justify-between p-4 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all shadow-sm hover:shadow-md"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <div>
                      <span class="block font-black text-sm text-amber-800 dark:text-amber-200 uppercase">{{ ticket.tipo_falla }}</span>
                      <span class="block text-[10px] text-amber-700/70 dark:text-amber-300/70 font-bold">Ticket #{{ ticket.id }}</span>
                    </div>
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
                  class="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-dark-bg/20 border border-light-border dark:border-dark-border rounded-xl cursor-pointer hover:border-primary/30 opacity-80 hover:opacity-100 transition-all shadow-sm"
                >
                  <div class="min-w-0">
                    <span class="block text-xs font-black text-light-text dark:text-dark-text truncate">{{ ticket.tipo_falla }}</span>
                    <span class="block text-[9px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em]">{{ formatShortDate(ticket.fecha_creacion) }}</span>
                  </div>
                  <ArrowRight class="text-primary/70" :size="14" />
                </div>
              </div>
            </section>

          </div>

          <!-- RESTO DE LOS STEPS -->
          <div v-if="step === 2" class="animate-fade-in max-w-2xl w-full mx-auto justify-center flex flex-col h-full">
            <div class="mb-8 flex items-center justify-between gap-3">
              <button @click="step = 1" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shrink-0">
                <i class="pi pi-arrow-left text-lg"></i>
              </button>
              <div class="flex-1">
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Paso 2 de 3</p>
                <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">Cuéntanos más</h2>
              </div>
            </div>
            <div class="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-4 sm:p-6 shadow-lg mb-8">
              <textarea v-model="form.descripcion" rows="5" class="w-full text-base p-4 sm:p-5 border-0 rounded-2xl bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner" placeholder="Describe qué está pasando, qué mensaje ves, desde cuándo ocurre o cualquier detalle útil..."></textarea>
            </div>
            <button @click="step = 3" :disabled="!form.descripcion" class="w-full py-4 rounded-xl font-black bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm inline-flex items-center justify-center gap-2">
              <span>Continuar</span>
              <ArrowRight :size="16" />
            </button>
          </div>

          <div v-if="step === 3" class="animate-fade-in max-w-xl w-full mx-auto justify-center flex flex-col h-full">
            <div class="mb-8 flex items-center justify-between gap-3">
              <button @click="step = 2" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shrink-0">
                <i class="pi pi-arrow-left text-lg"></i>
              </button>
              <div class="flex-1">
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Paso 3 de 3</p>
                <h2 class="text-2xl sm:text-3xl font-black font-title text-light-text dark:text-dark-text tracking-tight">¿Quién reporta?</h2>
              </div>
            </div>
            <div class="space-y-4 mb-8 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-4 sm:p-6 shadow-lg">
              <input v-model="form.nombre_reporta" type="text" class="w-full text-base p-4 rounded-xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none shadow-inner" placeholder="Tu nombre" />
              <input v-model="form.email_reporta" type="email" class="w-full text-base p-4 rounded-xl border-2 border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-bg/50 text-light-text dark:text-dark-text focus:border-primary outline-none shadow-inner" placeholder="correo@ejemplo.com" />
              <div class="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4 text-sm text-light-muted dark:text-dark-muted">
                <Info :size="16" class="text-primary shrink-0 mt-0.5" />
                <p>Usamos estos datos para enviarte el seguimiento y notificarte el avance de tu reporte.</p>
              </div>
            </div>
            <button @click="submitTicket" :disabled="loading" class="w-full py-4 rounded-xl font-black bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              <span>Enviar Reporte</span>
            </button>
          </div>

          <div v-if="step === 4" class="text-center animate-fade-in max-w-2xl w-full mx-auto py-10">
            <div class="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-success/20">
              <i class="pi pi-check text-5xl text-success"></i>
            </div>
            <h2 class="text-3xl font-black font-title text-success mb-2 tracking-tight">¡Enviado!</h2>
            <p class="text-lg text-light-muted mb-8 px-4 leading-tight">Folio registrado:<br><span class="font-mono font-black text-primary text-3xl">#{{ ticketInfo.id }}</span></p>
            <div class="bg-primary/5 p-6 rounded-3xl border-2 border-primary/20 mb-8 mx-4 shadow-sm">
              <a :href="ticketInfo.url" class="text-base font-bold text-primary underline break-all font-mono">Ver Seguimiento</a>
            </div>
            <button @click="step = 1" class="text-light-muted text-xs font-black uppercase tracking-widest">Terminar</button>
          </div>

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
