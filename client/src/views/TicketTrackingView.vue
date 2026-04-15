<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrPublicService from '../services/QrPublicService'
import {
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  MessageSquare,
  ChevronLeft,
  History,
  Paperclip,
  X,
  Eye,
  ShieldCheck,
  ArrowRight,
  FileText
} from 'lucide-vue-next'
import Image from 'primevue/image'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const ticketToken = computed(() => route.params.ticketToken)

const loading = ref(true)
const submittingComment = ref(false)
const ticket = ref(null)
const comentarios = ref([])
const historialEquipo = ref([])
const error = ref(null)
const chatContainer = ref(null)
const commentInput = ref(null)
const fileInput = ref(null)
let pollInterval = null

const nuevoComentario = ref('')
const showPdfViewer = ref(false)
const pdfUrl = ref('')

const isDragging = ref(false)
const attachment = ref(null)

const openPdf = (url) => {
  pdfUrl.value = url
  showPdfViewer.value = true
}

const loadTicket = async (isAutoRefresh = false) => {
  if (!isAutoRefresh) loading.value = true

  try {
    const data = await QrPublicService.getTicketStatus(ticketToken.value)

    if (!data?.ticket) {
      throw new Error('Ticket no encontrado')
    }

    const hadNewMessages = data.comentarios?.length !== comentarios.value.length
    ticket.value = data.ticket
    comentarios.value = data.comentarios || []

    if (!isAutoRefresh && data.ticket.qr_token) {
      try {
        const equipoData = await QrPublicService.getEquipoByToken(data.ticket.qr_token)
        historialEquipo.value = equipoData.tickets_historial || []
      } catch (e) {
        console.warn('No se pudo cargar el historial del equipo')
      }
    }

    if (hadNewMessages || !isAutoRefresh) {
      scrollToBottom()
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

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    attachment.value = { file, preview: e.target.result }
  }
  reader.readAsDataURL(file)
}

const handleDrop = (e) => {
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

const triggerFilePicker = () => {
  fileInput.value?.click()
}

const handleTextareaInput = (e) => {
  const el = e.target
  if (!el) return

  el.style.height = 'auto'
  const nextHeight = Math.min(el.scrollHeight, 176)
  el.style.height = `${nextHeight}px`
  el.style.overflowY = el.scrollHeight > 176 ? 'auto' : 'hidden'
}

const resetTextarea = () => {
  if (!commentInput.value) return
  commentInput.value.style.height = '56px'
  commentInput.value.style.overflowY = 'hidden'
}

const submitComment = async () => {
  if (!nuevoComentario.value.trim() && !attachment.value) return

  submittingComment.value = true
  try {
    if (attachment.value?.file) {
      await QrPublicService.uploadAttachment(ticketToken.value, attachment.value.file)
    }

    if (nuevoComentario.value.trim()) {
      await QrPublicService.addComment(ticketToken.value, nuevoComentario.value)
    }

    nuevoComentario.value = ''
    attachment.value = null
    resetTextarea()

    await loadTicket(true)
    scrollToBottom()
  } catch (err) {
    console.error('Error al comentar', err)
  } finally {
    submittingComment.value = false
  }
}

const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const formatFullDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const parseAttachment = (content) => {
  if (!content) return null
  const match = content.match(/\[ADJUNTO:(.*?)\|(.*?)\|(.*?)\]/)
  if (!match) return null

  const relativeUrl = match[3]
  const fileName = match[2]
  const isPdf = fileName.toLowerCase().endsWith('.pdf')

  return {
    type: isPdf ? 'PDF' : match[1],
    name: fileName,
    url: getFullUrl(relativeUrl)
  }
}

const getFullUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path

  let cleanPath = path.startsWith('/') ? path : `/${path}`
  if (!cleanPath.startsWith('/storage/')) {
    cleanPath = `/storage${cleanPath}`
  }

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
  return `${baseUrl}${cleanPath}`
}

const cleanContent = (content) => {
  return String(content || '').replace(/\[ADJUNTO:.*?\]/, '').trim()
}

const getEstatusConfig = (estatus) => {
  const configs = {
    ABIERTO: { label: 'Abierto', color: 'bg-red-500' },
    EN_PROGRESO: { label: 'En proceso', color: 'bg-amber-500' },
    RESUELTO: { label: 'Resuelto', color: 'bg-emerald-500' },
    CERRADO: { label: 'Cerrado', color: 'bg-slate-500' }
  }
  return configs[estatus] || { label: estatus, color: 'bg-primary' }
}

const getTicketTitle = computed(() => ticket.value?.equipo || 'Seguimiento de ticket')
const hasInitialEvidence = computed(() => Boolean(ticket.value?.evidencia_url))

onMounted(() => {
  loadTicket()
  pollInterval = setInterval(() => loadTicket(true), 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="relative h-[100dvh] bg-light-bg dark:bg-dark-bg font-sans text-light-text dark:text-dark-text overflow-hidden flex flex-col">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/12 blur-3xl"></div>
      <div class="absolute top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl"></div>
    </div>

    <header class="relative z-20 bg-primary text-white shadow-lg border-b border-white/10 shrink-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <router-link :to="{ name: 'soporte-manual' }" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/15 hover:bg-white/25 transition-all shrink-0">
            <ChevronLeft :size="20" />
          </router-link>
          <img src="/logo-white.svg" alt="LDS" class="h-9 sm:h-10 w-auto hidden sm:block" />
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Seguimiento de ticket</p>
            <h1 class="text-base sm:text-lg font-black font-title leading-tight truncate">Ticket #{{ ticket?.id || '...' }} · {{ getTicketTitle }}</h1>
          </div>
        </div>

        <div v-if="ticket" :class="['px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-inner border border-white/10', getEstatusConfig(ticket.estatus).color]">
          {{ getEstatusConfig(ticket.estatus).label }}
        </div>
      </div>
    </header>

    <main class="relative z-10 flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-hidden">
      <div v-if="error" class="max-w-3xl mx-auto bg-white dark:bg-dark-card border border-red-200 dark:border-red-900/40 rounded-[2rem] p-8 text-center shadow-lg">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-300">
          <AlertTriangle :size="28" />
        </div>
        <h2 class="text-xl font-black text-light-text dark:text-dark-text mb-2">No pudimos cargar el ticket</h2>
        <p class="text-light-muted dark:text-dark-muted">{{ error }}</p>
        <button @click="loadTicket()" class="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
          Reintentar
        </button>
      </div>

      <div v-else-if="loading && !ticket" class="h-full min-h-[60vh] flex items-center justify-center">
        <div class="text-center">
          <Loader2 class="animate-spin text-primary mx-auto" :size="44" />
          <p class="mt-4 text-sm font-black uppercase tracking-[0.3em] text-primary">Cargando seguimiento</p>
        </div>
      </div>

      <template v-else-if="ticket">
        <section class="h-full min-h-0 grid lg:grid-cols-[1.25fr_0.75fr] gap-6 lg:gap-8">
          <article class="min-h-0 flex flex-col gap-5">
            <div class="rounded-[2rem] bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl overflow-hidden shrink-0">
              <div class="p-5 sm:p-6 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-white to-slate-50 dark:from-dark-card dark:to-dark-bg/40">
                <div class="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest mb-3">
                  <AlertTriangle :size="12" />
                  Problema reportado
                </div>
                <p class="text-base sm:text-lg font-medium leading-relaxed text-light-text dark:text-dark-text">{{ ticket.descripcion }}</p>

                <div v-if="ticket.evidencia_url" class="mt-4 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border shadow-sm max-w-md bg-slate-50 dark:bg-dark-bg">
                  <Image
                    :src="getFullUrl(ticket.evidencia_url)"
                    preview
                    alt="Evidencia Reporte"
                    imageClass="w-full h-auto object-cover max-h-64 block"
                  />
                </div>
              </div>

              <div class="p-4 sm:p-5 flex items-center justify-between gap-3 text-xs font-bold text-light-muted dark:text-dark-muted">
                <span class="inline-flex items-center gap-2">
                  <Clock :size="14" class="text-primary" />
                  Reportado el {{ formatFullDate(ticket.fecha_creacion) }}
                </span>
                <span class="inline-flex items-center gap-2">
                  <Eye :size="14" class="text-primary" />
                  {{ comentarios.length }} mensajes
                </span>
              </div>
            </div>

            <section class="min-h-0 flex-1 rounded-[2rem] bg-white/95 dark:bg-dark-card/95 border border-light-border dark:border-dark-border shadow-xl overflow-hidden flex flex-col">
              <div class="px-5 py-4 border-b border-light-border dark:border-dark-border flex items-center gap-2 shrink-0 bg-gradient-to-r from-white to-slate-50 dark:from-dark-card dark:to-dark-bg/40">
                <MessageSquare class="text-primary" :size="16" />
                <h2 class="text-sm font-black uppercase tracking-widest text-light-text dark:text-dark-text">Conversación</h2>
              </div>

              <div ref="chatContainer" class="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 sm:p-5 space-y-4">
                <div
                  v-for="(c, i) in comentarios"
                  :key="i"
                  :class="['flex w-full animate-fade-in', c.autor === 'SISTEMA' ? 'justify-center' : (c.id_usuario ? 'justify-end' : 'justify-start')]"
                >
                  <div v-if="c.autor === 'SISTEMA'" class="max-w-[90%] px-4 py-2 rounded-full bg-slate-100 dark:bg-dark-card/70 border border-light-border dark:border-dark-border shadow-sm">
                    <p class="text-[9px] font-black text-light-muted uppercase tracking-widest text-center">{{ c.contenido }}</p>
                  </div>

                  <div
                    v-else
                    :class="[
                      'max-w-[90%] sm:max-w-[72%] p-4 sm:p-5 rounded-[1.5rem] shadow-md transition-all border',
                      c.id_usuario
                        ? 'bg-primary text-white rounded-tr-md border-primary/20 shadow-primary/10'
                        : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border rounded-tl-md'
                    ]"
                  >
                    <div :class="['text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-70', c.id_usuario ? 'text-white' : 'text-primary']">
                      {{ c.autor }}
                    </div>

                    <div v-if="parseAttachment(c.contenido)" class="space-y-2">
                      <div v-if="parseAttachment(c.contenido).type === 'IMAGEN'" class="bg-slate-50 dark:bg-dark-bg rounded-2xl border border-light-border dark:border-dark-border overflow-hidden">
                        <Image
                          :src="parseAttachment(c.contenido).url"
                          alt="Evidencia adjunta"
                          preview
                          imageClass="max-w-full h-auto max-h-80 object-contain block"
                        />
                      </div>
                      <button
                        v-else-if="parseAttachment(c.contenido).type === 'PDF'"
                        class="w-full bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 overflow-hidden cursor-pointer p-3 flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left"
                        @click="openPdf(parseAttachment(c.contenido).url)"
                      >
                        <FileText class="text-red-500 shrink-0" :size="22" />
                        <div class="flex flex-col min-w-0">
                          <span class="text-xs font-black truncate">{{ parseAttachment(c.contenido).name }}</span>
                          <span class="text-[9px] uppercase font-black opacity-60">Visualizar PDF</span>
                        </div>
                      </button>
                      <button
                        v-else
                        class="w-full bg-slate-50 dark:bg-dark-bg rounded-2xl border border-light-border dark:border-dark-border overflow-hidden cursor-pointer p-3 flex items-center gap-3 text-primary hover:underline text-left"
                        @click="window.open(parseAttachment(c.contenido).url, '_blank')"
                      >
                        <Paperclip :size="16" />
                        <span class="text-xs font-bold decoration-dashed truncate">{{ parseAttachment(c.contenido).name }}</span>
                      </button>
                    </div>

                    <p v-if="parseAttachment(c.contenido) && cleanContent(c.contenido)" class="text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap mt-3">
                      {{ cleanContent(c.contenido) }}
                    </p>
                    <p v-else-if="!parseAttachment(c.contenido)" class="text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap">
                      {{ cleanContent(c.contenido) }}
                    </p>

                    <div :class="['mt-3 text-[8px] text-right font-bold', c.id_usuario ? 'text-white/70' : 'text-light-muted dark:text-dark-muted']">
                      {{ formatTime(c.fecha_creacion) }}
                    </div>
                  </div>
                </div>

                <div v-if="comentarios.length === 0" class="h-full min-h-[240px] flex items-center justify-center text-center">
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.25em] text-light-muted dark:text-dark-muted">Sin mensajes aun</p>
                    <p class="text-sm text-light-muted dark:text-dark-muted mt-2">Escribe el primer mensaje para iniciar la conversacion.</p>
                  </div>
                </div>
              </div>
            </section>

            <div
              v-if="!['RESUELTO', 'CERRADO'].includes(ticket.estatus)"
              class="shrink-0 border border-light-border dark:border-dark-border bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl rounded-[1.75rem] p-3 sm:p-4 shadow-lg"
            >
              <div class="flex items-end gap-3">
                <div
                  class="flex-1 relative"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                >
                  <div v-if="isDragging" class="absolute inset-0 z-20 flex items-center justify-center rounded-[1.25rem] border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm pointer-events-none">
                    <span class="text-xs font-black text-primary uppercase tracking-[0.3em]">Suelta la imagen</span>
                  </div>

                  <div v-if="attachment" class="absolute bottom-full left-0 mb-2 w-full p-3 bg-white dark:bg-dark-card rounded-[1.25rem] shadow-xl border border-light-border dark:border-dark-border flex items-center gap-3 z-30">
                    <div class="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                      <img :src="attachment.preview" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-black text-light-text dark:text-dark-text truncate">{{ attachment.file.name }}</p>
                      <p class="text-[8px] text-light-muted uppercase">{{ (attachment.file.size / 1024).toFixed(1) }} KB</p>
                    </div>
                    <button @click="clearAttachment" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                      <X :size="14" />
                    </button>
                  </div>

                  <textarea
                    ref="commentInput"
                    v-model="nuevoComentario"
                    placeholder="Escribe un mensaje para soporte..."
                    rows="1"
                    @input="handleTextareaInput"
                    @paste="handlePaste"
                    class="w-full min-h-[56px] h-[56px] max-h-44 p-4 pr-14 rounded-[1.25rem] border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:border-primary focus:bg-white dark:focus:bg-dark-card transition-all outline-none resize-none overflow-y-hidden text-sm sm:text-base font-medium shadow-inner"
                  ></textarea>

                  <button
                    @click="triggerFilePicker"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted hover:text-primary transition-colors p-2"
                  >
                    <Paperclip :size="18" />
                  </button>
                  <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileSelect" />
                </div>

                <button
                  @click="submitComment"
                  :disabled="submittingComment || (!nuevoComentario.trim() && !attachment)"
                  class="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-xl hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all shrink-0"
                >
                  <Loader2 v-if="submittingComment" class="animate-spin" />
                  <Send v-else :size="20" class="sm:scale-110" />
                </button>
              </div>

              <div class="mt-3 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted gap-3">
                <span class="truncate">Solo puedes escribir mientras el ticket este abierto o en proceso</span>
                <span class="shrink-0">Adjuntos de imagen permitidos</span>
              </div>
            </div>

            <div v-else class="shrink-0 border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-bg text-center text-light-muted font-black uppercase tracking-widest text-[10px] py-4 rounded-[1.25rem]">
              Reporte finalizado{{ ticket?.estatus === 'RESUELTO' ? ' y resuelto' : '' }} por el equipo de soporte
            </div>
          </article>

          <aside class="min-h-0 h-full overflow-y-auto custom-scroll space-y-6 pr-1">
            <div class="rounded-[2rem] bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl overflow-hidden">
              <div class="px-5 py-4 border-b border-light-border dark:border-dark-border flex items-center gap-2">
                <ShieldCheck class="text-primary" :size="16" />
                <h3 class="text-sm font-black uppercase tracking-widest text-light-text dark:text-dark-text">Resumen</h3>
              </div>

              <div class="p-5 space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg p-4 border border-light-border dark:border-dark-border">
                    <p class="text-[9px] font-black uppercase tracking-[0.25em] text-light-muted dark:text-dark-muted mb-2">Estado</p>
                    <div :class="['inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white', getEstatusConfig(ticket.estatus).color]">
                      {{ getEstatusConfig(ticket.estatus).label }}
                    </div>
                  </div>
                  <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg p-4 border border-light-border dark:border-dark-border">
                    <p class="text-[9px] font-black uppercase tracking-[0.25em] text-light-muted dark:text-dark-muted mb-2">Mensajes</p>
                    <p class="text-2xl font-black text-light-text dark:text-dark-text">{{ comentarios.length }}</p>
                  </div>
                </div>

                <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg p-4 border border-light-border dark:border-dark-border">
                  <p class="text-[9px] font-black uppercase tracking-[0.25em] text-light-muted dark:text-dark-muted mb-2">Fecha de creacion</p>
                  <p class="text-sm font-bold text-light-text dark:text-dark-text">{{ formatFullDate(ticket.fecha_creacion) }}</p>
                </div>

                <div class="rounded-2xl bg-slate-50 dark:bg-dark-bg p-4 border border-light-border dark:border-dark-border">
                  <p class="text-[9px] font-black uppercase tracking-[0.25em] text-light-muted dark:text-dark-muted mb-2">Adjuntos</p>
                  <p class="text-sm font-bold text-light-text dark:text-dark-text">{{ hasInitialEvidence ? 'Incluye evidencia inicial' : 'Sin evidencia inicial' }}</p>
                </div>
              </div>
            </div>

            <div v-if="historialEquipo.length > 0" class="rounded-[2rem] bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl overflow-hidden">
              <div class="px-5 py-4 border-b border-light-border dark:border-dark-border flex items-center gap-2">
                <History class="text-primary" :size="16" />
                <h3 class="text-sm font-black uppercase tracking-widest text-light-text dark:text-dark-text">Historial del equipo</h3>
              </div>
              <div class="p-4 space-y-2">
                <button
                  v-for="item in historialEquipo.slice(0, 5)"
                  :key="item.id"
                  @click="router.push(`/q/ticket/${item.token_acceso}`)"
                  class="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-primary/30 transition-all text-left"
                >
                  <div class="min-w-0">
                    <p class="text-xs font-black text-light-text dark:text-dark-text truncate">{{ item.tipo_falla }}</p>
                    <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">{{ formatFullDate(item.fecha_creacion) }}</p>
                  </div>
                  <ArrowRight :size="14" class="text-primary shrink-0" />
                </button>
              </div>
            </div>
          </aside>
        </section>
      </template>
    </main>

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

.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(19, 180, 151, 0.25); border-radius: 20px; }
</style>
