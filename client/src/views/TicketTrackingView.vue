<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrPublicService from '../services/QrPublicService'
import { Monitor, Clock, CheckCircle, AlertTriangle, Send, Loader2, MessageSquare, ChevronLeft, History, Paperclip, X, Eye } from 'lucide-vue-next'
import Image from 'primevue/image'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const ticketToken = computed(() => route.params.ticketToken)

// Estado
const loading = ref(true)
const submittingComment = ref(false)
const ticket = ref(null)
const comentarios = ref([])
const historialEquipo = ref([]) // Nuevo: Historial en el chat
const error = ref(null)
const chatContainer = ref(null)
let pollInterval = null

// Formulario
const nuevoComentario = ref('')

const showPdfViewer = ref(false)
const pdfUrl = ref('')

const openPdf = (url) => {
  pdfUrl.value = url
  showPdfViewer.value = true
}

const loadTicket = async (isAutoRefresh = false) => {
  if (!isAutoRefresh) loading.value = true
  try {
    const data = await QrPublicService.getTicketStatus(ticketToken.value)
    if (data && data.ticket) {
      const hadNewMessages = data.comentarios?.length !== comentarios.value.length
      ticket.value = data.ticket
      comentarios.value = data.comentarios || []
      
      // Cargar historial del equipo de forma segura
      if (!isAutoRefresh && data.ticket.qr_token) {
         try {
           const equipoData = await QrPublicService.getEquipoByToken(data.ticket.qr_token)
           historialEquipo.value = equipoData.tickets_historial || []
         } catch (e) {
           console.warn('No se pudo cargar el historial del equipo')
         }
      }

      if (hadNewMessages) scrollToBottom()
    } else {
      throw new Error('Ticket no encontrado')
    }
  } catch (err) {
    console.error('Error loading ticket:', err)
    if (!isAutoRefresh) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar los datos'
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

const isDragging = ref(false)
const attachment = ref(null)

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    attachment.value = {
      file,
      preview: e.target.result
    }
  }
  reader.readAsDataURL(file)
}

const handleDrop = async (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) processFile(file)
}

const handlePaste = (e) => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      const file = item.getAsFile()
      processFile(file)
    }
  }
}

const clearAttachment = () => {
  attachment.value = null
}

const submitComment = async () => {
  if (!nuevoComentario.value.trim() && !attachment.value) return
  submittingComment.value = true
  try {
    // 1. Si hay archivo, subirlo primero
    if (attachment.value && attachment.value.file) {
      // Usamos el endpoint público
      await QrPublicService.uploadAttachment(ticketToken.value, attachment.value.file)
    }

    // 2. Si hay texto, enviarlo como comentario
    if (nuevoComentario.value.trim()) {
      await QrPublicService.addComment(ticketToken.value, nuevoComentario.value)
    }

    nuevoComentario.value = ''
    attachment.value = null
    await loadTicket(true)
  } catch (err) {
    console.error('Error al comentar', err)
  } finally {
    submittingComment.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const parseAttachment = (content) => {
  if (!content) return null
  const match = content.match(/\[ADJUNTO:(.*?)\|(.*?)\|(.*?)\]/)
  if (match) {
    const relativeUrl = match[3]
    const fileName = match[2]
    const isPdf = fileName.toLowerCase().endsWith('.pdf')

    return {
      type: isPdf ? 'PDF' : match[1],
      name: fileName,
      url: getFullUrl(relativeUrl)
    }
  }
  return null
}

const getFullUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  
  let cleanPath = path.startsWith('/') ? path : `/${path}`
  
  // Soporte para rutas antiguas que no tenían /storage/ o /uploads/
  // Si la ruta empieza con /tickets/ pero no con /storage/tickets/, se añade /storage
  if (cleanPath.startsWith('/tickets/') && !cleanPath.startsWith('/storage/')) {
    cleanPath = `/storage${cleanPath}`
  }
  
  const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  return `${baseUrl}${cleanPath}`
}

const cleanContent = (content) => {
  // Remover el bloque [ADJUNTO:...] para mostrar solo texto si lo hubiera
  return content.replace(/\[ADJUNTO:.*?\]/, '').trim()
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

onMounted(() => {
  loadTicket()
  pollInterval = setInterval(() => loadTicket(true), 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="h-[100dvh] w-screen bg-light-bg dark:bg-dark-bg flex flex-col font-sans text-light-text dark:text-dark-text overflow-hidden fixed inset-0">
    
    <!-- HEADER PREMIUM CON LOGO -->
    <header class="bg-primary p-4 sm:p-5 text-white shadow-md shrink-0 z-30">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link :to="{ name: 'soporte-manual' }" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all">
            <ChevronLeft :size="20" />
          </router-link>
          
          <!-- Logo en el header del chat -->
          <img src="/logo-white.svg" alt="LDS" class="h-8 sm:h-10 w-auto mr-2 hidden sm:block" />
          
          <div>
            <h1 class="text-base sm:text-lg font-black font-title leading-tight">Ticket #{{ ticket?.id || '...' }}</h1>
            <p class="text-[10px] sm:text-xs opacity-80 font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">{{ ticket?.equipo }}</p>
          </div>
        </div>
        <div v-if="ticket" :class="['px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-inner border border-white/10', getEstatusConfig(ticket.estatus).color]">
          {{ getEstatusConfig(ticket.estatus).label }}
        </div>
      </div>
    </header>

    <!-- AREA DE CONVERSACIÓN -->
    <main 
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scroll bg-slate-50/30 dark:bg-dark-bg/10 relative"
    >
      <div class="max-w-4xl mx-auto w-full pb-10">
        
        <div v-if="error" class="p-8 text-center text-red-500 font-bold">
          <p>{{ error }}</p>
          <button @click="loadTicket()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Reintentar</button>
        </div>

        <div v-else-if="loading && !ticket" class="flex items-center justify-center h-full pt-20">
          <Loader2 class="animate-spin text-primary" :size="40" />
        </div>

        <template v-else-if="ticket">
          <!-- Banner de Inicio -->
          <div class="flex justify-center mb-8 mt-2">
            <div class="bg-white dark:bg-dark-card px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-light-muted shadow-sm border border-light-border dark:border-dark-border">
              {{ new Date(ticket.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) }}
            </div>
          </div>

          <!-- Problema Original -->
          <div class="flex justify-start mb-10">
            <div class="max-w-[90%] sm:max-w-[75%] bg-white dark:bg-dark-card p-5 rounded-2xl rounded-tl-none shadow-md border-l-4 border-l-amber-500 border-y border-r border-light-border dark:border-dark-border">
              <div class="flex items-center gap-2 mb-2 text-amber-600 font-black text-[9px] uppercase tracking-widest">
                <AlertTriangle :size="12" /> Problema Reportado
              </div>
              <p class="text-sm sm:text-base font-medium leading-relaxed">{{ ticket.descripcion }}</p>
              
              <!-- Evidencia Original en Seguimiento -->
              <div v-if="ticket.evidencia_url" class="mt-4 rounded-xl overflow-hidden border border-light-border dark:border-dark-border shadow-sm max-w-xs bg-slate-50 dark:bg-dark-bg">
                  <Image 
                    :src="getFullUrl(ticket.evidencia_url)" 
                    preview 
                    alt="Evidencia Reporte" 
                    imageClass="w-full h-auto object-cover max-h-48 block"
                  />
              </div>

              <div class="mt-2 text-[9px] text-light-muted text-right font-bold opacity-60">
                {{ formatDate(ticket.fecha_creacion) }}
              </div>
            </div>
          </div>

          <!-- Mensajes dinámicos -->
          <div 
            v-for="(c, i) in comentarios" :key="i"
            :class="['flex w-full mb-4 animate-fade-in', c.autor === 'SISTEMA' ? 'justify-center' : (c.id_usuario ? 'justify-end' : 'justify-start')]"
          >
            <!-- Sistema -->
            <div v-if="c.autor === 'SISTEMA'" class="bg-slate-100 dark:bg-dark-card/50 px-4 py-2 rounded-xl border border-light-border dark:border-dark-border shadow-sm mx-4">
               <p class="text-[9px] font-black text-light-muted uppercase tracking-widest text-center">{{ c.contenido }}</p>
            </div>

            <!-- Usuario/Soporte -->
            <div 
              v-else
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
              
              <div v-if="parseAttachment(c.contenido)">
                <div v-if="parseAttachment(c.contenido).type === 'IMAGEN'" class="bg-slate-50 dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border overflow-hidden mb-1">
                  <Image 
                    :src="parseAttachment(c.contenido).url" 
                    alt="Evidencia adjunta" 
                    preview 
                    imageClass="max-w-full h-auto max-h-64 object-contain block"
                  />
                </div>
                <div v-else-if="parseAttachment(c.contenido).type === 'PDF'" class="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden cursor-pointer mb-1 p-3 flex items-center gap-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" @click="openPdf(parseAttachment(c.contenido).url)">
                    <i class="pi pi-file-pdf text-xl"></i>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold truncate max-w-[150px]">{{ parseAttachment(c.contenido).name }}</span>
                      <span class="text-[9px] uppercase font-black opacity-60">Visualizar PDF</span>
                    </div>
                </div>
                <div v-else class="bg-slate-50 dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border overflow-hidden cursor-pointer mb-1 p-3 flex items-center gap-2 text-primary hover:underline" @click="window.open(parseAttachment(c.contenido).url, '_blank')">
                    <Paperclip :size="16" />
                    <span class="text-xs decoration-dashed truncate max-w-[150px]">{{ parseAttachment(c.contenido).name }}</span>
                </div>
              </div>
              <!-- Mostrar texto si lo hubiera junto al adjunto -->
              <p v-if="parseAttachment(c.contenido) && cleanContent(c.contenido)" class="text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap mt-2">{{ cleanContent(c.contenido) }}</p>
              <p v-else-if="!parseAttachment(c.contenido)" class="text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap">{{ cleanContent(c.contenido) }}</p>

              <div :class="['mt-2 text-[8px] text-right font-bold', c.id_usuario ? 'text-white/70' : 'text-light-muted']">
                {{ formatDate(c.fecha_creacion) }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <div v-if="ticket && !['RESUELTO', 'CERRADO'].includes(ticket.estatus)" class="p-3 sm:p-6 pb-8 sm:pb-8 bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border shrink-0 z-30 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
      <div class="max-w-4xl mx-auto flex items-center gap-3">
        <div 
          class="flex-1 relative"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <!-- Overlay Drag -->
          <div v-if="isDragging" class="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl z-20 flex items-center justify-center backdrop-blur-sm pointer-events-none">
            <span class="text-xs font-bold text-primary uppercase tracking-widest">Soltar imagen</span>
          </div>

          <!-- Preview Adjunto -->
          <div v-if="attachment" class="absolute bottom-full left-0 mb-3 w-full p-2 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-light-border dark:border-dark-border flex items-center gap-3 animate-fade-in z-30">
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
               <img :src="attachment.preview" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-bold text-light-text dark:text-dark-text truncate">{{ attachment.file.name }}</p>
              <p class="text-[8px] text-light-muted uppercase">{{ (attachment.file.size / 1024).toFixed(1) }} KB</p>
            </div>
            <button @click="clearAttachment" class="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
              <X :size="12" />
            </button>
          </div>

          <textarea 
            v-model="nuevoComentario"
            placeholder="Escribe un mensaje..."
            rows="1"
            @input="e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
            @paste="handlePaste"
            class="w-full min-h-[48px] sm:min-h-[56px] max-h-32 p-3 sm:p-4 pr-12 rounded-2xl border-2 border-slate-50 dark:border-dark-bg bg-slate-50 dark:bg-dark-bg focus:border-primary focus:bg-white dark:focus:bg-dark-card transition-all outline-none resize-none text-sm sm:text-base font-medium shadow-inner chat-input flex items-center"
          ></textarea>

          <!-- Botón Adjuntar -->
          <button 
            @click="$refs.fileInput.click()"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-light-muted hover:text-primary transition-colors p-2"
          >
            <Paperclip :size="18" />
          </button>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />
        </div>

        <button 
          @click="submitComment"
          :disabled="submittingComment || (!nuevoComentario.trim() && !attachment)"
          class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-90 disabled:opacity-50 transition-all shrink-0"
        >
          <Loader2 v-if="submittingComment" class="animate-spin" />
          <Send v-else :size="20" class="sm:scale-110" />
        </button>
      </div>
    </div>

    <!-- Banner Cerrado/Resuelto -->
    <div v-else-if="['RESUELTO', 'CERRADO'].includes(ticket?.estatus)" class="p-5 bg-slate-100 dark:bg-dark-bg text-center text-light-muted font-black uppercase tracking-widest text-[10px] shrink-0 border-t border-light-border dark:border-dark-border pb-8">
      Reporte finalizado {{ ticket?.estatus === 'RESUELTO' ? ' y resuelto' : '' }} por el equipo de soporte
    </div>

    <!-- Visor de PDF Integrado -->
    <Dialog 
      v-model:visible="showPdfViewer" 
      modal 
      header="Visualizador de PDF" 
      class="!max-w-5xl !w-[95vw] !h-[90vh] !rounded-3xl overflow-hidden"
      contentClass="!p-0 !h-full"
    >
      <iframe :src="pdfUrl" class="w-full h-full border-none"></iframe>
    </Dialog>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

.custom-scroll::-webkit-scrollbar { display: none; }
.custom-scroll { scrollbar-width: none; -ms-overflow-style: none; }

.chat-input::-webkit-scrollbar { display: none; }
.chat-input { scrollbar-width: none; -ms-overflow-style: none; }
</style>