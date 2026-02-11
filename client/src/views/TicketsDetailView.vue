<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import TicketsService from '../services/TicketsService'
import { ArrowLeft, Monitor, User, Calendar, Clock, AlertCircle, CheckCircle, Send, MessageSquare, Loader2, ShieldCheck, Info, Settings2, History } from 'lucide-vue-next'

import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'

const route = useRoute()
const router = useRouter()
const { success: toastSuccess, error: toastError } = useSwal()

// Data
const ticket = ref(null)
const comentarios = ref([])
const tecnicos = ref([])
const loading = ref(true)
const saving = ref(false)
const sendingComment = ref(false)
const chatContainer = ref(null)
const showMobileSettings = ref(false)
let pollInterval = null

// Form
const nuevoComentario = ref('')
const esInterno = ref(false)
const selectedTecnico = ref(null)
const selectedEstatus = ref(null)
const selectedPrioridad = ref(null)

const estatusOptions = [
  { label: 'Abierto', value: 'ABIERTO' },
  { label: 'En Progreso', value: 'EN_PROGRESO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Resuelto', value: 'RESUELTO' },
  { label: 'Cerrado', value: 'CERRADO' }
]

const prioridadOptions = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Crítica', value: 'CRITICA' }
]

const ticketId = computed(() => route.params.id)

const loadTicket = async (isAutoRefresh = false) => {
  if (!isAutoRefresh) loading.value = true
  try {
    const data = await TicketsService.getById(ticketId.value)
    const hadNewMessages = data.ticket_comentarios?.length !== comentarios.value.length
    ticket.value = data
    comentarios.value = data.ticket_comentarios || []
    
    if (!isAutoRefresh) {
      selectedEstatus.value = data.estatus
      selectedPrioridad.value = data.prioridad
      selectedTecnico.value = data.id_asignado_a
    }

    if (hadNewMessages) scrollToBottom()
  } catch (error) {
    if (!isAutoRefresh) {
      toastError('Error al cargar ticket')
      router.push({ name: 'tickets' })
    }
  } finally {
    if (!isAutoRefresh) loading.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const loadTecnicos = async () => {
  try { tecnicos.value = await TicketsService.getTecnicos() } catch (e) {}
}

const updateTicket = async () => {
  saving.value = true
  try {
    await TicketsService.update(ticketId.value, {
      estatus: selectedEstatus.value,
      prioridad: selectedPrioridad.value,
      id_asignado_a: selectedTecnico.value
    })
    toastSuccess('Ticket actualizado')
    showMobileSettings.value = false
    await loadTicket(true)
  } catch (e) {
    toastError('Error al actualizar')
  } finally {
    saving.value = false
  }
}

const addComment = async () => {
  if (!nuevoComentario.value.trim()) return
  sendingComment.value = true
  try {
    await TicketsService.addComment(ticketId.value, nuevoComentario.value, esInterno.value)
    nuevoComentario.value = ''
    esInterno.value = false
    await loadTicket(true)
  } catch (e) {
    toastError('Error al comentar')
  } finally {
    sendingComment.value = false
  }
}

onMounted(() => {
  loadTicket()
  loadTecnicos()
  pollInterval = setInterval(() => loadTicket(true), 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const formatStatus = (s) => s ? String(s).replace(/_/g, ' ') : ''
</script>

<template>
  <div class="h-[calc(100dvh-160px)] sm:h-[calc(100dvh-120px)] flex flex-col font-sans animate-fade-in overflow-hidden relative px-1 sm:px-4 pb-4 sm:pb-0">
    
    <!-- HEADER FIJO PREMIUM -->
    <header class="flex items-center justify-between mb-4 shrink-0 bg-white dark:bg-dark-card shadow-sm border border-light-border dark:border-dark-border p-3 sm:p-4 rounded-2xl z-20">
      <div class="flex items-center gap-3">
        <button @click="router.push({ name: 'tickets' })" class="w-9 h-9 rounded-xl bg-slate-50 dark:bg-dark-bg flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
          <ArrowLeft :size="18" />
        </button>
        
        <div>
          <h1 class="text-lg sm:text-xl font-black font-title leading-tight uppercase italic">Ticket #{{ ticketId }}</h1>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <p class="text-[9px] font-bold text-light-muted uppercase tracking-widest opacity-70 truncate max-w-[150px] sm:max-w-none">
              {{ ticket?.equipos?.marca }} {{ ticket?.equipos?.modelo }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <Tag :value="formatStatus(ticket?.estatus)" severity="secondary" class="!px-3 !py-1 !rounded-full !font-black !text-[9px] uppercase hidden md:inline-flex" />
        <button @click="showMobileSettings = !showMobileSettings" class="lg:hidden w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
          <Settings2 :size="20" />
        </button>
      </div>
    </header>

    <!-- CUERPO DUAL -->
    <div class="flex-1 flex gap-4 min-h-0 relative overflow-hidden">
      
      <!-- COLUMNA CHAT -->
      <div class="flex-1 flex flex-col bg-white dark:bg-dark-card rounded-[2.5rem] shadow-card border border-light-border dark:border-dark-border overflow-hidden relative z-10">
        
        <!-- Área de Conversación Independiente -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scroll bg-slate-50/20 dark:bg-dark-bg/10">
          
          <!-- Reporte Original -->
          <div class="flex justify-start mb-8">
            <div class="max-w-[95%] sm:max-w-[80%] bg-white dark:bg-dark-card p-6 rounded-3xl rounded-tl-none shadow-md border-l-4 border-l-amber-500 border-y border-r border-light-border dark:border-dark-border">
              <div class="flex items-center gap-2 mb-2 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em]">
                <AlertCircle :size="14" /> REPORTE ORIGINAL
              </div>
              <p class="text-sm sm:text-base font-semibold leading-relaxed">{{ ticket?.descripcion }}</p>
              <div v-if="ticket?.evidencia_url" class="mt-4 pt-4 border-t border-dashed border-light-border dark:border-dark-border">
                <a :href="ticket.evidencia_url" target="_blank" class="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Monitor :size="14" /> Ver Evidencia Adjunta
                </a>
              </div>
            </div>
          </div>

          <!-- Burbujas Dinámicas -->
          <div 
            v-for="c in comentarios" :key="c.id"
            :class="['flex flex-col mb-4 animate-fade-in', c.autor_nombre === 'SISTEMA' ? 'items-center' : (c.id_usuario ? 'items-end' : 'items-start')]"
          >
            <!-- Caso: Mensaje de Sistema -->
            <div v-if="c.autor_nombre === 'SISTEMA'" class="bg-slate-100 dark:bg-dark-bg/50 px-4 py-2 rounded-xl border border-light-border dark:border-dark-border shadow-sm mx-4">
               <p class="text-[9px] font-black text-light-muted uppercase tracking-widest text-center">{{ c.contenido }}</p>
            </div>

            <!-- Caso: Nota Interna Badge -->
            <div v-else-if="c.es_interno" class="flex items-center gap-1 mb-1 px-3 text-[8px] font-black uppercase text-amber-600 tracking-[0.2em] italic">
              <ShieldCheck :size="10" /> Nota interna
            </div>

            <!-- Caso: Burbuja Normal -->
            <div 
              v-if="c.autor_nombre !== 'SISTEMA'"
              :class="[
                'max-w-[85%] p-4 sm:p-5 rounded-2xl shadow-sm relative transition-all',
                c.id_usuario 
                  ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
                  : (c.es_interno ? 'bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-tl-none' : 'bg-slate-100 dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-tl-none')
              ]"
            >
              <div :class="['text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-60', c.id_usuario ? 'text-white' : 'text-primary']">
                {{ c.autor_nombre }}
              </div>
              <p class="text-sm font-medium leading-relaxed">{{ c.contenido }}</p>
              <div :class="['mt-2 text-[8px] font-bold text-right opacity-50', c.id_usuario ? 'text-white' : 'text-light-muted']">
                {{ new Date(c.fecha_creacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Barra de Respuesta -->
        <div v-if="ticket?.estatus !== 'CERRADO'" class="p-3 sm:p-6 pb-8 sm:pb-8 bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border shrink-0 z-30 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
          <div class="max-w-4xl mx-auto">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex-1 relative">
                <textarea 
                  v-model="nuevoComentario"
                  rows="1"
                  placeholder="Escribe una respuesta técnica..."
                  @input="e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
                  class="w-full min-h-[48px] sm:min-h-[56px] p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-card transition-all outline-none text-sm font-medium resize-none shadow-inner flex items-center"
                ></textarea>
              </div>
              
              <button 
                @click="addComment"
                :disabled="sendingComment || !nuevoComentario.trim()"
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-90 disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
              >
                <Loader2 v-if="sendingComment" class="animate-spin" />
                <Send v-else :size="20" class="sm:scale-110" />
              </button>
            </div>

            <div class="px-1 flex justify-between items-center">
              <label class="inline-flex items-center gap-2 cursor-pointer group">
                <Checkbox v-model="esInterno" :binary="true" />
                <span class="text-[9px] font-black text-light-muted group-hover:text-amber-600 transition-colors uppercase tracking-[0.2em]">Marcar como Nota Interna</span>
              </label>
              <span class="text-[8px] font-bold text-light-muted uppercase opacity-40">Shift + Enter para nueva línea</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SIDEBAR GESTIÓN (Lateral / Flotante) -->
      <aside 
        :class="[
          'fixed inset-0 lg:relative lg:inset-auto z-40 lg:z-0 lg:w-72 flex flex-col gap-4 transition-transform duration-300 lg:translate-x-0',
          showMobileSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        ]"
      >
        <div @click="showMobileSettings = false" class="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden"></div>

        <div class="relative ml-auto lg:ml-0 w-4/5 lg:w-full h-full lg:h-auto bg-white dark:bg-dark-card p-8 lg:p-6 shadow-2xl lg:shadow-lg border-l lg:border border-light-border dark:border-dark-border lg:rounded-[2.5rem] flex flex-col overflow-y-auto">
          
          <div class="flex items-center justify-between mb-8 lg:mb-6">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-light-muted flex items-center gap-2">
              <ShieldCheck :size="14" class="text-primary" /> Panel de Control
            </h3>
            <button @click="showMobileSettings = false" class="lg:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-bg flex items-center justify-center">
              <i class="pi pi-times"></i>
            </button>
          </div>
          
          <div class="space-y-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-light-muted uppercase ml-1">Estatus</label>
              <Select v-model="selectedEstatus" :options="estatusOptions" optionLabel="label" optionValue="value" class="w-full !rounded-xl" />
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-light-muted uppercase ml-1">Prioridad</label>
              <Select v-model="selectedPrioridad" :options="prioridadOptions" optionLabel="label" optionValue="value" class="w-full !rounded-xl" />
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-light-muted uppercase ml-1">Técnico</label>
              <Select v-model="selectedTecnico" :options="tecnicos" optionLabel="nombre_usuario" optionValue="id" placeholder="Asignar..." showClear class="w-full !rounded-xl" />
            </div>

            <button @click="updateTicket" :disabled="saving" class="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary-hover active:scale-95 transition-all mt-4">
              <span v-if="!saving">Actualizar Registro</span>
              <Loader2 v-else class="animate-spin mx-auto" />
            </button>
          </div>

          <!-- Historial -->
          <div v-if="ticket?.historial_equipo?.length > 0" class="mt-10 pt-6 border-t border-light-border dark:border-dark-border">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-light-muted mb-4 flex items-center gap-2">
              <History :size="14" class="text-primary" /> Reportes Previos
            </h3>
            <div class="space-y-3">
              <div 
                v-for="h in ticket.historial_equipo" :key="h.id"
                @click="router.push({ name: 'tickets-detalle', params: { id: h.id } })"
                class="p-3 bg-slate-50 dark:bg-dark-bg/40 rounded-xl border border-transparent hover:border-primary/30 cursor-pointer transition-all group"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="text-[9px] font-black text-primary">#{{ h.id }}</span>
                  <Tag :value="formatStatus(h.estatus)" severity="secondary" class="!text-[7px] !px-1.5 !py-0" />
                </div>
                <p class="text-[10px] font-bold truncate group-hover:text-primary transition-colors uppercase italic">{{ h.tipo_falla }}</p>
                <p class="text-[8px] opacity-50 font-medium">{{ new Date(h.fecha_creacion).toLocaleDateString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { display: none; }
.custom-scroll { scrollbar-width: none; -ms-overflow-style: none; }

:deep(.p-select) {
  border: 2px solid transparent !important;
  background: #f8fafa !important;
}
.dark :deep(.p-select) {
  background: #24292d !important;
}
:deep(.p-select:hover) {
  border-color: #13B497 !important;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
