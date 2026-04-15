<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSwal } from '../composables/useSwal'
import TicketsService from '../services/TicketsService'
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  Send,
  Loader2,
  Paperclip,
  X,
  History,
  ShieldCheck,
  ArrowRight,
  FileText
} from 'lucide-vue-next'

import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Image from 'primevue/image'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { success: toastSuccess, error: toastError } = useSwal()

const ticket = ref(null)
const comentarios = ref([])
const tecnicos = ref([])
const loading = ref(true)
const saving = ref(false)
const sendingComment = ref(false)
const chatContainer = ref(null)
const commentInput = ref(null)
const fileInput = ref(null)
let pollInterval = null

const CHAT_POLL_MS = 8000

const isDragging = ref(false)
const attachment = ref(null)
const nuevoComentario = ref('')

const showPdfViewer = ref(false)
const pdfUrl = ref('')

const selectedTecnico = ref(null)
const selectedEstatus = ref(null)
const selectedPrioridad = ref(null)

const estatusOptions = [
  { label: 'Abierto', value: 'ABIERTO' },
  { label: 'En progreso', value: 'EN_PROGRESO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Resuelto', value: 'RESUELTO' },
  { label: 'Cerrado', value: 'CERRADO' }
]

const prioridadOptions = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Critica', value: 'CRITICA' }
]

const ticketId = computed(() => route.params.id)
const roleId = computed(() => authStore.user?.roleId)
const canManageTicket = computed(() => roleId.value === 1 || roleId.value === 3)
const canManageAdminFields = computed(() => roleId.value === 1)
const canCommentTicket = computed(() => true)

const ticketHeadline = computed(() => {
  const equipoNombre = [ticket.value?.equipos?.marca, ticket.value?.equipos?.modelo]
    .filter(Boolean)
    .join(' ')
    .trim()

  return ticket.value?.titulo || ticket.value?.categoria || equipoNombre || 'Ticket general'
})

const getUserDisplayName = (user, fallback = 'Usuario') => {
  const firstName = user?.nombres?.trim()
  const lastName = user?.apellidos?.trim()
  if (firstName && lastName) return `${firstName} ${lastName}`

  const employeeFirstName = user?.empleados?.nombres?.trim()
  const employeeLastName = user?.empleados?.apellidos?.trim()
  if (employeeFirstName && employeeLastName) return `${employeeFirstName} ${employeeLastName}`

  const username = user?.username?.trim()
  if (!username) return fallback

  return username
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const getUserInitials = (user, fallback = '?') => {
  const displayName = getUserDisplayName(user, '').trim()
  if (!displayName) return fallback

  const parts = displayName.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return displayName.substring(0, 2).toUpperCase()
}

const getCommentAuthor = (comment) => {
  return comment?.autor_nombre || comment?.autor || getUserDisplayName(comment?.usuarios_sistema, 'Usuario')
}

const isSystemComment = (comment) => {
  return getCommentAuthor(comment) === 'SISTEMA'
}

const isMine = (comment) => {
  return Boolean(comment?.id_usuario && authStore.user?.id && comment.id_usuario === authStore.user.id)
}

const getEquipoIP = computed(() => {
  return ticket.value?.equipos?.asignaciones?.[0]?.direcciones_ip?.direccion_ip || null
})

const formatStatus = (status) => (status ? String(status).replace(/_/g, ' ') : '')

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

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

    if (hadNewMessages || !isAutoRefresh) {
      scrollToBottom()
    }
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

const loadTecnicos = async () => {
  try {
    const data = await TicketsService.getTecnicos()

    const normalizeName = (value) => {
      const source = String(value || '').trim()
      if (!source) return 'Sin nombre'

      const base = source.includes('@') ? source.split('@')[0] : source
      const firstChunk = base
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(/\s+/)[0] || 'Sin nombre'

      return firstChunk.charAt(0).toUpperCase() + firstChunk.slice(1).toLowerCase()
    }

    tecnicos.value = data.map((tecnico) => ({
      ...tecnico,
      display_name: normalizeName(tecnico.nombre_usuario)
    }))
  } catch (err) {
    console.error('Error loading analysts:', err)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const updateTicket = async () => {
  if (!canManageTicket.value) return

  saving.value = true
  try {
    const payload = {
      estatus: selectedEstatus.value
    }

    if (canManageAdminFields.value) {
      payload.prioridad = selectedPrioridad.value
      payload.id_asignado_a = selectedTecnico.value
    }

    await TicketsService.update(ticketId.value, payload)
    toastSuccess('Ticket actualizado')
    await loadTicket(true)
  } catch (err) {
    toastError('Error al actualizar ticket')
  } finally {
    saving.value = false
  }
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

const addComment = async () => {
  if (!nuevoComentario.value.trim() && !attachment.value) return

  sendingComment.value = true
  try {
    if (attachment.value?.file) {
      await TicketsService.uploadAttachment(ticketId.value, attachment.value.file)
    }

    if (nuevoComentario.value.trim()) {
      await TicketsService.addComment(ticketId.value, nuevoComentario.value)
    }

    nuevoComentario.value = ''
    attachment.value = null
    resetTextarea()

    await loadTicket(true)
    scrollToBottom()
  } catch (err) {
    if (err.response?.status === 413) {
      toastError('Archivo demasiado grande (maximo 10MB)')
    } else {
      toastError('Error al enviar comentario')
    }
  } finally {
    sendingComment.value = false
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

const cleanContent = (content) => {
  if (!content) return ''
  return content.replace(/\[ADJUNTO:.*?\]/, '').trim()
}

const openPdf = (url) => {
  pdfUrl.value = url
  showPdfViewer.value = true
}

const handleVisibilityChange = () => {
  if (!document.hidden) loadTicket(true)
}

const handleWindowFocus = () => {
  loadTicket(true)
}

onMounted(() => {
  loadTicket()
  loadTecnicos()

  pollInterval = setInterval(() => loadTicket(true), CHAT_POLL_MS)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleWindowFocus)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleWindowFocus)
})
</script>

<template>
  <div class="h-full min-h-0 flex flex-col overflow-hidden font-sans animate-fade-in">
    <header class="shrink-0 flex items-center justify-between gap-3 mb-4 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-3 sm:p-4 shadow-sm">
      <div class="flex items-center gap-3 min-w-0">
        <button @click="router.push({ name: 'tickets' })" class="w-9 h-9 rounded-xl bg-slate-50 dark:bg-dark-bg flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shrink-0">
          <ArrowLeft :size="18" />
        </button>

        <div class="min-w-0">
          <h1 class="text-lg sm:text-xl font-black leading-tight uppercase">Ticket #{{ ticketId }}</h1>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted truncate">
            {{ ticketHeadline }}
          </p>
        </div>
      </div>

      <Tag :value="formatStatus(ticket?.estatus)" severity="secondary" class="!px-3 !py-1 !rounded-full !font-black !text-[10px] uppercase shrink-0" />
    </header>

    <div v-if="loading" class="flex-1 min-h-0 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border flex items-center justify-center">
      <div class="text-center">
        <Loader2 class="animate-spin text-primary mx-auto" :size="40" />
        <p class="mt-3 text-xs font-black uppercase tracking-[0.3em] text-primary">Cargando ticket</p>
      </div>
    </div>

    <section v-else-if="ticket" class="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4 overflow-hidden">
      <article class="min-h-0 flex flex-col gap-4 overflow-hidden">
        <div class="shrink-0 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
          <div class="p-5 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-white to-slate-50 dark:from-dark-card dark:to-dark-bg/50">
            <div class="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
              <AlertTriangle :size="14" />
              Problema reportado
            </div>
            <p class="text-sm sm:text-base font-semibold leading-relaxed">{{ ticket.descripcion }}</p>

            <div v-if="ticket.evidencia_url" class="mt-4 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border shadow-sm max-w-md bg-slate-50 dark:bg-dark-bg">
              <Image
                :src="getFullUrl(ticket.evidencia_url)"
                preview
                alt="Evidencia original"
                imageClass="w-full h-auto object-cover max-h-64 block"
              />
            </div>
          </div>

          <div class="px-5 py-3 flex items-center justify-between gap-3 text-xs font-bold text-light-muted dark:text-dark-muted">
            <span class="inline-flex items-center gap-2">
              <Clock :size="14" class="text-primary" />
              {{ formatDate(ticket.fecha_creacion) }}
            </span>
            <span class="inline-flex items-center gap-2">
              <Eye :size="14" class="text-primary" />
              {{ comentarios.length }} mensajes
            </span>
          </div>
        </div>

        <section class="min-h-0 flex-1 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-light-border dark:border-dark-border flex items-center gap-2 shrink-0">
            <MessageSquare class="text-primary" :size="16" />
            <h2 class="text-sm font-black uppercase tracking-widest">Conversacion</h2>
          </div>

          <div ref="chatContainer" class="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-dark-bg/20">
            <div
              v-for="c in comentarios"
              :key="c.id"
              :class="['flex w-full animate-fade-in', isSystemComment(c) ? 'justify-center' : (isMine(c) ? 'justify-end' : 'justify-start')]"
            >
              <div v-if="isSystemComment(c)" class="max-w-[90%] px-4 py-2 rounded-full bg-slate-100 dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
                <p class="text-[9px] font-black text-light-muted dark:text-dark-muted uppercase tracking-widest text-center">{{ c.contenido }}</p>
              </div>

              <div
                v-else
                :class="[
                  'max-w-[90%] sm:max-w-[75%] p-4 rounded-2xl border shadow-sm',
                  isMine(c)
                    ? 'bg-primary text-white border-primary/30 rounded-tr-md'
                    : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border rounded-tl-md'
                ]"
              >
                <div :class="['text-[9px] font-black uppercase tracking-[0.25em] mb-2 opacity-70', isMine(c) ? 'text-white' : 'text-primary']">
                  {{ getCommentAuthor(c) }}
                </div>

                <div v-if="parseAttachment(c.contenido)" class="space-y-2">
                  <div v-if="parseAttachment(c.contenido).type === 'IMAGEN'" class="bg-slate-50 dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border overflow-hidden">
                    <Image
                      :src="parseAttachment(c.contenido).url"
                      alt="Adjunto"
                      preview
                      imageClass="max-w-full h-auto max-h-72 object-contain block"
                    />
                  </div>

                  <button
                    v-else-if="parseAttachment(c.contenido).type === 'PDF'"
                    class="w-full bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-3 flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left"
                    @click="openPdf(parseAttachment(c.contenido).url)"
                  >
                    <FileText class="shrink-0" :size="18" />
                    <div class="min-w-0">
                      <p class="text-xs font-black truncate">{{ parseAttachment(c.contenido).name }}</p>
                      <p class="text-[9px] uppercase font-black opacity-60">Visualizar PDF</p>
                    </div>
                  </button>

                  <button
                    v-else
                    class="w-full bg-slate-50 dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border p-3 flex items-center gap-3 text-primary hover:underline text-left"
                    @click="window.open(parseAttachment(c.contenido).url, '_blank')"
                  >
                    <Paperclip :size="16" class="shrink-0" />
                    <span class="text-xs font-bold truncate">{{ parseAttachment(c.contenido).name }}</span>
                  </button>
                </div>

                <p v-if="parseAttachment(c.contenido) && cleanContent(c.contenido)" class="text-sm leading-relaxed whitespace-pre-wrap mt-3">
                  {{ cleanContent(c.contenido) }}
                </p>
                <p v-else-if="!parseAttachment(c.contenido)" class="text-sm leading-relaxed whitespace-pre-wrap">
                  {{ c.contenido }}
                </p>

                <div :class="['mt-2 text-[9px] text-right font-bold', isMine(c) ? 'text-white/75' : 'text-light-muted dark:text-dark-muted']">
                  {{ formatTime(c.fecha_creacion) }}
                </div>
              </div>
            </div>

            <div v-if="comentarios.length === 0" class="h-full min-h-[220px] flex items-center justify-center text-center">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.25em] text-light-muted dark:text-dark-muted">Sin mensajes aun</p>
                <p class="text-sm text-light-muted dark:text-dark-muted mt-2">Inicia la conversacion para dar seguimiento al ticket.</p>
              </div>
            </div>
          </div>
        </section>

        <div
          v-if="!['RESUELTO', 'CERRADO'].includes(ticket.estatus) && canCommentTicket"
          class="shrink-0 border border-light-border dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl p-3 sm:p-4 shadow-sm"
        >
          <div class="flex items-end gap-3">
            <div
              class="flex-1 relative"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div v-if="isDragging" class="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm pointer-events-none">
                <span class="text-xs font-black text-primary uppercase tracking-[0.3em]">Suelta la imagen</span>
              </div>

              <div v-if="attachment" class="absolute bottom-full left-0 mb-2 w-full p-3 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-light-border dark:border-dark-border flex items-center gap-3 z-30">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                  <img :src="attachment.preview" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[10px] font-black truncate">{{ attachment.file.name }}</p>
                  <p class="text-[8px] text-light-muted dark:text-dark-muted uppercase">{{ (attachment.file.size / 1024).toFixed(1) }} KB</p>
                </div>
                <button @click="clearAttachment" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                  <X :size="14" />
                </button>
              </div>

              <textarea
                ref="commentInput"
                v-model="nuevoComentario"
                rows="1"
                placeholder="Escribe una respuesta tecnica..."
                @input="handleTextareaInput"
                @keydown.enter.exact.prevent="addComment"
                @paste="handlePaste"
                class="w-full min-h-[56px] h-[56px] max-h-44 p-4 pr-14 rounded-xl bg-slate-50 dark:bg-dark-bg/50 border-2 border-light-border dark:border-dark-border focus:border-primary focus:bg-white dark:focus:bg-dark-card transition-all outline-none resize-none overflow-y-hidden text-sm font-medium shadow-inner"
              ></textarea>

              <button
                @click="triggerFilePicker"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted hover:text-primary transition-colors p-2"
                title="Adjuntar imagen"
              >
                <Paperclip :size="18" />
              </button>
              <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileSelect" />
            </div>

            <button
              @click="addComment"
              :disabled="sendingComment || (!nuevoComentario.trim() && !attachment)"
              class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary text-white shadow-lg hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
            >
              <Loader2 v-if="sendingComment" class="animate-spin" />
              <Send v-else :size="20" />
            </button>
          </div>

          <div class="mt-2 flex justify-end">
            <span class="text-[9px] font-bold text-light-muted dark:text-dark-muted uppercase opacity-50">Enter para enviar, Shift+Enter para salto</span>
          </div>
        </div>

        <div v-else class="shrink-0 border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-bg text-center text-light-muted font-black uppercase tracking-widest text-[10px] py-4 rounded-xl">
          Ticket finalizado{{ ticket?.estatus === 'RESUELTO' ? ' y resuelto' : '' }}
        </div>
      </article>

      <aside class="min-h-0 xl:h-full xl:overflow-y-auto custom-scroll pr-1 space-y-4">
        <div class="rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-light-border dark:border-dark-border flex items-center gap-2">
            <ShieldCheck class="text-primary" :size="16" />
            <h3 class="text-sm font-black uppercase tracking-widest">Gestion</h3>
          </div>

          <div class="p-5 space-y-4">
            <div class="bg-slate-50 dark:bg-dark-bg/50 p-3 rounded-2xl border border-light-border dark:border-dark-border">
              <p class="text-[9px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted mb-2">Reportado por</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-700">
                  {{ getUserInitials(ticket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema) }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold truncate">{{ getUserDisplayName(ticket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema, ticket?.nombre_reporta || 'Usuario externo') }}</p>
                  <p class="text-[10px] opacity-60 truncate">{{ ticket?.email_reporta || 'Sin correo' }}</p>
                </div>
              </div>
            </div>

            <div v-if="ticket?.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema" class="bg-slate-50 dark:bg-dark-bg/50 p-3 rounded-2xl border border-light-border dark:border-dark-border">
              <p class="text-[9px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted mb-2">Asignado a</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/30">
                  {{ getUserInitials(ticket.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema) }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold truncate">{{ getUserDisplayName(ticket.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema, 'Sin asignar') }}</p>
                  <p class="text-[10px] opacity-60">Tecnico asignado</p>
                </div>
              </div>
            </div>

            <div v-if="ticket?.equipos" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
              <p class="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300 mb-3">Equipo relacionado</p>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase font-bold opacity-70">ID</span>
                  <span class="text-xs font-bold text-primary">{{ ticket.equipos?.id || 'N/A' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase font-bold opacity-70">Marca</span>
                  <span class="text-xs font-semibold">{{ ticket.equipos?.marca || 'N/A' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase font-bold opacity-70">Modelo</span>
                  <span class="text-xs font-semibold">{{ ticket.equipos?.modelo || 'N/A' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase font-bold opacity-70">Serie</span>
                  <span class="text-xs font-mono truncate">{{ ticket.equipos?.numero_serie || 'S/N' }}</span>
                </div>
                <div v-if="getEquipoIP" class="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span class="text-[8px] uppercase font-bold opacity-70">IP asignada</span>
                  <p class="text-xs font-mono font-bold mt-1">{{ getEquipoIP }}</p>
                </div>
              </div>
            </div>

            <div v-if="canManageTicket" class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Estatus</label>
              <Select v-model="selectedEstatus" :options="estatusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>

            <div v-if="canManageAdminFields" class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Prioridad</label>
              <Select v-model="selectedPrioridad" :options="prioridadOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>

            <div v-if="canManageAdminFields" class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Responsable</label>
              <Select
                v-model="selectedTecnico"
                :options="tecnicos"
                optionLabel="display_name"
                optionValue="id"
                placeholder="Asignar analista"
                showClear
                class="w-full"
              />
            </div>

            <button
              v-if="canManageTicket"
              @click="updateTicket"
              :disabled="saving"
              class="w-full py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-primary-hover active:scale-95 transition-all"
            >
              <span v-if="!saving">Actualizar ticket</span>
              <Loader2 v-else class="animate-spin mx-auto" :size="16" />
            </button>

            <p v-if="roleId === 3" class="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2">
              Modo analista: puedes gestionar estatus y comentar. Prioridad y asignacion se administran por el equipo de control.
            </p>
          </div>
        </div>

        <div v-if="ticket?.historial_equipo?.length > 0" class="rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-light-border dark:border-dark-border flex items-center gap-2">
            <History class="text-primary" :size="16" />
            <h3 class="text-sm font-black uppercase tracking-widest">Reportes previos</h3>
          </div>

          <div class="p-4 space-y-2">
            <button
              v-for="h in ticket.historial_equipo"
              :key="h.id"
              @click="router.push({ name: 'tickets-detalle', params: { id: h.id } })"
              class="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-primary/30 transition-all text-left"
            >
              <div class="min-w-0">
                <p class="text-xs font-black text-primary">#{{ h.id }}</p>
                <p class="text-xs font-semibold truncate uppercase">{{ h.tipo_falla }}</p>
                <p class="text-[10px] opacity-60">{{ formatDate(h.fecha_creacion) }}</p>
              </div>
              <ArrowRight :size="14" class="text-primary shrink-0" />
            </button>
          </div>
        </div>
      </aside>
    </section>

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
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(19, 180, 151, 0.25);
  border-radius: 20px;
}

:deep(.p-select) {
  border: 2px solid transparent !important;
  background: #f8fafa !important;
  border-radius: 0.85rem !important;
}

.dark :deep(.p-select) {
  background: #24292d !important;
}

:deep(.p-select:hover),
:deep(.p-select.p-focus) {
  border-color: #13b497 !important;
}

.animate-fade-in {
  animation: fadeIn 0.35s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
