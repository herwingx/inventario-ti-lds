<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrPublicService from '../services/QrPublicService'
import { Monitor, Clock, CheckCircle, AlertTriangle, Send, Loader2, MessageSquare, ChevronLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const ticketToken = computed(() => route.params.ticketToken)

// Estado
const loading = ref(true)
const submittingComment = ref(false)
const ticket = ref(null)
const comentarios = ref([])
const error = ref(null)
const chatContainer = ref(null)

// Formulario
const nuevoComentario = ref('')

const loadTicket = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await QrPublicService.getTicketStatus(ticketToken.value)
    if (data && data.ticket) {
      ticket.value = data.ticket
      comentarios.value = data.comentarios || []
      scrollToBottom()
    } else {
      throw new Error('404')
    }
  } catch (err) {
    error.value = 'No se encontró el ticket.'
  } finally {
    loading.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const submitComment = async () => {
  if (!nuevoComentario.value.trim()) return
  submittingComment.value = true
  try {
    await QrPublicService.addComment(ticketToken.value, nuevoComentario.value)
    nuevoComentario.value = ''
    await loadTicket()
  } catch (err) {
    console.error('Error al comentar')
  } finally {
    submittingComment.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const getEstatusConfig = (estatus) => {
  const configs = {
    'ABIERTO': { label: 'Abierto', color: 'bg-red-500' },
    'EN_PROGRESO': { label: 'En Proceso', color: 'bg-amber-500' },
    'RESUELTO': { label: 'Resuelto', color: 'bg-emerald-500' },
    'CERRADO': { label: 'Cerrado', color: 'bg-slate-500' }
  }
  return configs[estatus] || { label: estatus, color: 'bg-primary' }
}

onMounted(loadTicket)
</script>

<template>
  <div class="h-[100dvh] w-screen bg-light-bg dark:bg-dark-bg flex flex-col font-sans text-light-text dark:text-dark-text overflow-hidden fixed inset-0">
    
    <!-- HEADER FIJO -->
    <header class="bg-primary p-4 sm:p-5 text-white shadow-md shrink-0 z-30">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/ayuda" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all">
            <ChevronLeft :size="20" />
          </router-link>
          <div>
            <h1 class="text-base sm:text-xl font-black font-title leading-tight">Ticket #{{ ticket?.id || '...' }}</h1>
            <p class="text-[10px] sm:text-xs opacity-80 font-bold uppercase tracking-widest">{{ ticket?.equipo }}</p>
          </div>
        </div>
        <div v-if="ticket" :class="['px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-inner border border-white/10', getEstatusConfig(ticket.estatus).color]">
          {{ getEstatusConfig(ticket.estatus).label }}
        </div>
      </div>
    </header>

    <!-- AREA DE CONVERSACIÓN (Única con scroll) -->
    <main 
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scroll bg-slate-50/30 dark:bg-dark-bg/10 relative"
    >
      <div class="max-w-4xl mx-auto w-full">
        <div v-if="loading && !ticket" class="flex items-center justify-center h-full pt-20">
          <Loader2 class="animate-spin text-primary" :size="40" />
        </div>

        <template v-else-if="ticket">
          <!-- Separador de Fecha -->
          <div class="flex justify-center mb-8 mt-2">
            <div class="bg-white dark:bg-dark-card px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-light-muted shadow-sm border border-light-border dark:border-dark-border">
              {{ new Date(ticket.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) }}
            </div>
          </div>

          <!-- Burbuja de Problema Inicial -->
          <div class="flex justify-start mb-10">
            <div class="max-w-[90%] sm:max-w-[75%] bg-white dark:bg-dark-card rounded-2xl rounded-tl-none p-5 shadow-sm border-l-4 border-l-amber-500 border-y border-r border-light-border dark:border-dark-border">
              <div class="flex items-center gap-2 mb-2 text-amber-600 font-black text-[9px] uppercase tracking-widest">
                <AlertTriangle :size="12" /> Problema Reportado
              </div>
              <p class="text-sm sm:text-base font-medium leading-relaxed">{{ ticket.descripcion }}</p>
              <div class="mt-2 text-[9px] text-light-muted text-right font-bold opacity-60 italic">
                {{ formatDate(ticket.fecha_creacion) }}
              </div>
            </div>
          </div>

          <!-- Conversación Dinámica -->
          <div 
            v-for="(c, i) in comentarios" :key="i"
            :class="['flex w-full mb-4 animate-fade-in', c.id_usuario ? 'justify-end' : 'justify-start']"
          >
            <div 
              :class="[
                'max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-sm transition-all',
                c.id_usuario
                  ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
                  : 'bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-tl-none'
              ]"
            >
              <div :class="['text-[9px] font-black uppercase tracking-widest mb-1 opacity-60', c.id_usuario ? 'text-white' : 'text-primary']">
                {{ c.autor }}
              </div>
              <p class="text-sm sm:text-base leading-relaxed font-medium">{{ c.contenido }}</p>
              <div :class="['mt-2 text-[8px] text-right font-bold', c.id_usuario ? 'text-white/70' : 'text-light-muted']">
                {{ formatDate(c.fecha_creacion) }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- ENTRADA DE TEXTO FIJA -->
    <div v-if="ticket && ticket.estatus !== 'CERRADO'" class="p-3 sm:p-6 pb-6 sm:pb-6 bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border shrink-0 z-30">
      <div class="max-w-4xl mx-auto flex items-center gap-3">
        <div class="flex-1 relative">
          <textarea 
            v-model="nuevoComentario"
            placeholder="Responder..."
            rows="1"
            @input="e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
            class="w-full max-h-32 p-3 sm:p-4 rounded-2xl border-2 border-slate-50 dark:border-dark-bg bg-slate-50 dark:bg-dark-bg focus:border-primary focus:bg-white dark:focus:bg-dark-card transition-all outline-none resize-none text-sm sm:text-base font-medium shadow-inner"
          ></textarea>
        </div>
        <button 
          @click="submitComment"
          :disabled="submittingComment || !nuevoComentario.trim()"
          class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-lg hover:bg-primary-hover active:scale-90 disabled:opacity-50 transition-all shrink-0"
        >
          <Loader2 v-if="submittingComment" class="animate-spin" />
          <Send v-else :size="20" class="sm:scale-110" />
        </button>
      </div>
    </div>

    <!-- Banner Cerrado -->
    <div v-else-if="ticket?.estatus === 'CERRADO'" class="p-4 bg-slate-100 dark:bg-dark-bg text-center text-light-muted font-black uppercase tracking-widest text-[10px] shrink-0 border-t border-light-border dark:border-dark-border">
      Este ticket ha sido finalizado por soporte
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* Scrollbar Profesional */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #13B497 transparent;
}
.custom-scroll::-webkit-scrollbar { width: 5px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(19, 180, 151, 0.2); border-radius: 20px; }
</style>
