<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSwal } from '../composables/useSwal'
import TicketsService from '../services/TicketsService'
import { ArrowLeft, Monitor, User, Calendar, Clock, AlertCircle, CheckCircle, Send, MessageSquare, Loader2, ShieldCheck, Info, Settings2, History, Paperclip, X, Eye } from 'lucide-vue-next'

import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Image from 'primevue/image'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
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

const isDragging = ref(false)
const attachment = ref(null)

const showPdfViewer = ref(false)
const pdfUrl = ref('')

const openPdf = (url) => {
  pdfUrl.value = url
  showPdfViewer.value = true
}

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

const quickReplies = {
  soporte: [
    "⏳ Se está revisando el caso.",
    "🔧 Requiere visita técnica física.",
    "📦 Pieza solicitada a proveedor.",
    "✅ Equipo operativo nuevamente.",
    "❓ Por favor envía una foto del error."
  ],
  interno: [
    "🛡 Investigando posible causa raíz.",
    "🛡 Escalar a nivel 2.",
    "🛡 Pendiente de autorización."
  ]
}

const ticketId = computed(() => route.params.id)
const canManageTicket = computed(() => authStore.user?.roleId !== 2)
const ticketHeadline = computed(() => {
  const teamName = [ticket.value?.equipos?.marca, ticket.value?.equipos?.modelo].filter(Boolean).join(' ').trim()
  return ticket.value?.titulo || ticket.value?.categoria || teamName || 'Ticket general'
})

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
    console.error('Error loading ticket:', error)
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

const handleDrop = async (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) processFile(file)
}

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
  // Reset input if exists via ref
}

const addComment = async () => {
  if (!nuevoComentario.value.trim() && !attachment.value) return
  sendingComment.value = true
  try {
    // 1. Si hay archivo, subirlo primero
    if (attachment.value && attachment.value.file) {
      await TicketsService.uploadAttachment(ticketId.value, attachment.value.file)
    }

    // 2. Si hay texto, enviarlo como comentario
    if (nuevoComentario.value.trim()) {
      await TicketsService.addComment(ticketId.value, nuevoComentario.value, esInterno.value)
    }

    nuevoComentario.value = ''
    attachment.value = null
    esInterno.value = false
    await loadTicket(true)
  } catch (e) {
    if (e.response?.status === 413) {
       toastError('Archivo demasiado grande (Max 10MB)')
    } else {
       toastError('Error al enviar mensaje')
    }
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
  
  // Asegurar que la ruta comience con /storage si no lo tiene
  if (!cleanPath.startsWith('/storage/')) {
    cleanPath = `/storage${cleanPath}`
  }
  
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
  return `${baseUrl}${cleanPath}`
}

const getInitials = (name) => {
  if (!name) return '??'
  return name.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const cleanContent = (content) => {
  if (!content) return ''
  return content.replace(/\[ADJUNTO:.*?\]/, '').trim()
}

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
              {{ ticketHeadline }}
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
                <div class="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2 flex items-center gap-2">
                  <Monitor :size="14" /> EVIDENCIA DEL EQUIPO
                </div>
                <!-- Usar Image para el reporte original también -->
                <div class="rounded-xl overflow-hidden border border-light-border dark:border-dark-border shadow-sm max-w-xs bg-slate-50 dark:bg-dark-bg">
                  <Image 
                    :src="getFullUrl(ticket.evidencia_url)" 
                    preview 
                    alt="Evidencia Original" 
                    imageClass="w-full h-auto object-cover max-h-48 block"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Burbujas Dinámicas -->
          <div 
            v-for="c in comentarios" :key="c.id"
            :class="['flex flex-col mb-4 animate-fade-in', c.autor_nombre === 'SISTEMA' ? 'items-center' : (c.id_usuario === authStore.user?.id ? 'items-end' : 'items-start')]"
          >
            <!-- Caso: Mensaje de Sistema -->
            <div v-if="c.autor_nombre === 'SISTEMA'" class="bg-slate-100 dark:bg-dark-bg/50 px-4 py-2 rounded-xl border border-light-border dark:border-dark-border shadow-sm mx-4">
               <p class="text-[9px] font-black text-light-muted uppercase tracking-widest text-center">{{ c.contenido }}</p>
            </div>

            <!-- Caso: Burbuja Normal con Avatar -->
            <div 
              v-else-if="c.autor_nombre !== 'SISTEMA'"
              :class="['flex gap-3 max-w-[90%]', c.id_usuario === authStore.user?.id ? 'flex-row-reverse self-end' : 'flex-row self-start']"
            >
              <!-- Avatar -->
              <div 
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm font-black text-[9px] tracking-tighter', 
                  c.id_usuario === authStore.user?.id 
                    ? 'bg-primary text-white border-primary-dark' 
                    : (c.es_interno ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700' : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text border-slate-200 dark:border-zinc-700')
                ]"
              >
                {{ getInitials(c.autor_nombre) }}
              </div>

              <!-- Burbuja -->
              <div 
                :class="[
                  'p-3 sm:p-4 rounded-2xl shadow-sm relative transition-all min-w-[120px]',
                  c.id_usuario === authStore.user?.id 
                    ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
                    : (c.es_interno ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-tl-none' : 'bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-tl-none')
                ]"
              >
                <div :class="['text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 flex justify-between gap-4', c.id_usuario === authStore.user?.id ? 'text-white' : 'text-primary']">
                  <span>{{ c.autor_nombre }}</span>
                  <span v-if="c.es_interno" class="flex items-center gap-1"><ShieldCheck :size="10" /> INTERNAL</span>
                </div>
                
                <div v-if="parseAttachment(c.contenido)">
                  <div v-if="parseAttachment(c.contenido).type === 'IMAGEN'" class="bg-slate-50 dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
                    <Image 
                      :src="parseAttachment(c.contenido).url" 
                      alt="Evidencia adjunta" 
                      preview 
                      imageClass="max-w-full h-auto max-h-64 object-contain block"
                    />
                  </div>
                  <div v-else-if="parseAttachment(c.contenido).type === 'PDF'" class="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden cursor-pointer p-3 flex items-center gap-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" @click="openPdf(parseAttachment(c.contenido).url)">
                    <i class="pi pi-file-pdf text-xl"></i>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold truncate max-w-[150px]">{{ parseAttachment(c.contenido).name }}</span>
                      <span class="text-[9px] uppercase font-black opacity-60">Visualizar PDF</span>
                    </div>
                  </div>
                  <div v-else class="bg-slate-50 dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border overflow-hidden cursor-pointer p-3 flex items-center gap-2 text-primary hover:underline" @click="window.open(parseAttachment(c.contenido).url, '_blank')">
                    <Paperclip :size="16" />
                    <span class="text-xs decoration-dashed truncate max-w-[150px]">{{ parseAttachment(c.contenido).name }}</span>
                  </div>
                </div>
                <!-- Mostrar texto si lo hubiera junto al adjunto -->
                <p v-if="parseAttachment(c.contenido) && cleanContent(c.contenido)" class="text-sm font-medium leading-relaxed whitespace-pre-wrap mt-2">{{ cleanContent(c.contenido) }}</p>
                <p v-else-if="!parseAttachment(c.contenido)" class="text-sm font-medium leading-relaxed whitespace-pre-wrap">{{ c.contenido }}</p>

                <div :class="['mt-1 text-[8px] font-bold text-right opacity-50', c.id_usuario === authStore.user?.id ? 'text-white' : 'text-light-muted']">
                  {{ new Date(c.fecha_creacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Barra de Respuesta -->
        <div v-if="!['RESUELTO', 'CERRADO'].includes(ticket?.estatus)" class="p-3 sm:p-6 pb-8 sm:pb-8 bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border shrink-0 z-30 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
          <div class="max-w-4xl mx-auto">
            
            <!-- Quick Replies -->
            <div class="flex gap-2 overflow-x-auto pb-3 mb-1 custom-scroll">
              <button 
                v-for="reply in (esInterno ? quickReplies.interno : quickReplies.soporte)" 
                :key="reply"
                @click="nuevoComentario = reply"
                class="px-3 py-1 bg-slate-100 dark:bg-dark-bg hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border border-light-border dark:border-dark-border"
              >
                {{ reply }}
              </button>
            </div>

            <div class="flex items-center gap-3 mb-3">
                <div 
                  class="flex-1 relative"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                >
                  <!-- Overlay de Drag & Drop -->
                  <div v-if="isDragging" class="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl z-20 flex items-center justify-center backdrop-blur-sm">
                    <div class="text-primary font-bold text-xs uppercase tracking-widest flex items-col gap-2">
                      <span>Soltar para adjuntar</span>
                    </div>
                  </div>

                  <!-- Preview de Imagen (Ahora relativo, encima del input) -->
                  <div v-if="attachment" class="absolute bottom-full left-0 mb-3 w-full p-2 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-light-border dark:border-dark-border flex items-center gap-3 animate-fade-in-up z-30">
                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                       <img :src="attachment.preview" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-bold text-light-text dark:text-dark-text truncate">{{ attachment.file.name }}</p>
                      <p class="text-[8px] text-light-muted font-mono uppercase">Imagen adjunta • {{ (attachment.file.size / 1024).toFixed(1) }} KB</p>
                    </div>
                    <button @click="clearAttachment" class="w-7 h-7 rounded-full bg-slate-100 dark:bg-dark-bg hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors shrink-0">
                      <X :size="14" />
                    </button>
                  </div>

                  <textarea 
                    v-model="nuevoComentario"
                    rows="1"
                    placeholder="Escribe una respuesta técnica..."
                    @input="e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
                    @keydown.enter.exact.prevent="addComment"
                    @paste="handlePaste"
                    class="w-full min-h-[48px] sm:min-h-[56px] p-3 sm:p-4 pr-12 rounded-2xl bg-slate-50 dark:bg-dark-bg/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-card transition-all outline-none text-sm font-medium resize-none shadow-inner flex items-center"
                  ></textarea>

                  <!-- Botón Adjuntar (Clip) -->
                  <button 
                    @click="$refs.fileInput.click()"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted hover:text-primary transition-colors p-2"
                    title="Adjuntar imagen"
                  >
                    <Paperclip :size="18" />
                  </button>
                  <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />
                </div>
              
              <button 
                @click="addComment"
                :disabled="sendingComment || (!nuevoComentario.trim() && !attachment)"
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-90 disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
              >
                <Loader2 v-if="sendingComment" class="animate-spin" />
                <Send v-else :size="20" class="sm:scale-110" />
              </button>
            </div>

            <!-- Shift + Enter Hint -->
            <div class="px-1 flex justify-between items-center">
              <label v-if="canManageTicket" class="inline-flex items-center gap-2 cursor-pointer group">
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
        class="fixed inset-0 lg:relative lg:inset-auto z-40 lg:z-0 lg:w-72 flex flex-col gap-4 transition-transform duration-300 lg:translate-x-0"
        :class="showMobileSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'"
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
            <!-- Información del Usuario Reportante -->
            <div class="bg-slate-50 dark:bg-dark-bg/50 p-4 rounded-2xl border border-light-border dark:border-dark-border">
              <p class="text-[8px] font-black uppercase text-light-muted mb-3 tracking-widest opacity-70">Reportado Por</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-700">
                  {{ ticket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.username ? ticket.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema.username.substring(0, 2).toUpperCase() : '?' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[9px] font-bold truncate">{{ ticket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.username || ticket?.nombre_reporta || 'Usuario Externo' }}</p>
                  <p class="text-[8px] opacity-50 truncate">{{ ticket?.email_reporta }}</p>
                </div>
              </div>
            </div>

            <!-- Información del Técnico Asignado -->
            <div v-if="ticket?.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema" class="bg-slate-50 dark:bg-dark-bg/50 p-4 rounded-2xl border border-light-border dark:border-dark-border">
              <p class="text-[8px] font-black uppercase text-light-muted mb-3 tracking-widest opacity-70">Asignado a</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/30">
                  {{ ticket.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema.username.substring(0, 2).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[9px] font-bold truncate">{{ ticket.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema.username }}</p>
                  <p class="text-[8px] opacity-50">Técnico Asignado</p>
                </div>
              </div>
            </div>

            <div v-if="canManageTicket" class="space-y-1.5">
              <label class="text-[9px] font-black text-light-muted uppercase ml-1">Estatus</label>
              <Select v-model="selectedEstatus" :options="estatusOptions" optionLabel="label" optionValue="value" class="w-full !rounded-xl" />
            </div>

            <div v-if="canManageTicket" class="space-y-1.5">
              <label class="text-[9px] font-black text-light-muted uppercase ml-1">Prioridad</label>
              <Select v-model="selectedPrioridad" :options="prioridadOptions" optionLabel="label" optionValue="value" class="w-full !rounded-xl" />
            </div>

            <div v-if="canManageTicket" class="space-y-1.5">
              <label class="text-[9px] font-black text-light-muted uppercase ml-1">Técnico</label>
              <Select v-model="selectedTecnico" :options="tecnicos" optionLabel="nombre_usuario" optionValue="id" placeholder="Asignar..." showClear class="w-full !rounded-xl" />
            </div>

            <button v-if="canManageTicket" @click="updateTicket" :disabled="saving" class="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary-hover active:scale-95 transition-all mt-4">
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
.animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
