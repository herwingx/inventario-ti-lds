/**
 * @fileoverview Vista pública para seguimiento de ticket.
 * Permite ver el estado y agregar comentarios sin autenticación.
 */
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QrPublicService from '../services/QrPublicService'
import { Monitor, Clock, CheckCircle, AlertTriangle, Send, Loader2, MessageSquare, User, Calendar } from 'lucide-vue-next'

const route = useRoute()
const ticketToken = computed(() => route.params.ticketToken)

// Estado
const loading = ref(true)
const submittingComment = ref(false)
const ticket = ref(null)
const comentarios = ref([])
const error = ref(null)
const success = ref(null)

// Formulario comentario
const nuevoComentario = ref('')
const nombreComentario = ref('')

onMounted(async () => {
  await loadTicket()
})

const loadTicket = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await QrPublicService.getTicketStatus(ticketToken.value)
    ticket.value = data.ticket
    comentarios.value = data.comentarios || []
  } catch (err) {
    error.value = 'No se encontró el ticket o el código es inválido.'
  } finally {
    loading.value = false
  }
}

const submitComment = async () => {
  if (!nuevoComentario.value.trim()) return
  
  submittingComment.value = true
  success.value = null
  error.value = null
  
  try {
    await QrPublicService.addComment(ticketToken.value, nuevoComentario.value, nombreComentario.value)
    success.value = 'Comentario enviado'
    nuevoComentario.value = ''
    await loadTicket() // Recargar para ver el nuevo comentario
  } catch (err) {
    error.value = 'Error al enviar el comentario'
  } finally {
    submittingComment.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstatusConfig = (estatus) => {
  const configs = {
    'ABIERTO': { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', label: 'Abierto' },
    'EN_PROGRESO': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'En Progreso' },
    'PENDIENTE': { icon: Clock, color: 'text-light-muted', bg: 'bg-light-muted/10', label: 'Pendiente' },
    'RESUELTO': { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Resuelto' },
    'CERRADO': { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10', label: 'Cerrado' }
  }
  return configs[estatus] || configs['ABIERTO']
}
</script>

<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg py-8 px-4">
    <div class="max-w-lg mx-auto">
      
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
          <MessageSquare class="text-white" :size="32" />
        </div>
        <h1 class="text-2xl font-bold text-light-text dark:text-dark-text">Seguimiento de Ticket</h1>
        <p class="text-light-muted dark:text-dark-muted text-sm">Consulta el estado de tu reporte</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-8 text-center border border-light-border dark:border-dark-border">
        <Loader2 class="animate-spin text-primary mx-auto mb-4" :size="40" />
        <p class="text-light-muted dark:text-dark-muted">Cargando ticket...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error && !ticket" class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-8 text-center border border-light-border dark:border-dark-border">
        <div class="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="text-danger" :size="32" />
        </div>
        <h2 class="text-xl font-bold text-light-text dark:text-dark-text mb-2">Ticket no encontrado</h2>
        <p class="text-light-muted dark:text-dark-muted">{{ error }}</p>
      </div>

      <!-- Ticket Info -->
      <template v-else-if="ticket">
        <!-- Card Estado -->
        <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 mb-6 border border-light-border dark:border-dark-border">
          <!-- Estado Badge -->
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-light-muted dark:text-dark-muted">Ticket #{{ ticket.id }}</span>
            <div :class="['flex items-center gap-2 px-3 py-1.5 rounded-full', getEstatusConfig(ticket.estatus).bg]">
              <component :is="getEstatusConfig(ticket.estatus).icon" :size="16" :class="getEstatusConfig(ticket.estatus).color" />
              <span :class="['font-semibold text-sm', getEstatusConfig(ticket.estatus).color]">
                {{ getEstatusConfig(ticket.estatus).label }}
              </span>
            </div>
          </div>

          <!-- Equipo -->
          <div class="flex items-center gap-3 mb-4 p-3 bg-light-bg dark:bg-dark-bg rounded-xl">
            <Monitor class="text-primary flex-shrink-0" :size="24" />
            <div>
              <p class="font-semibold text-light-text dark:text-dark-text">{{ ticket.equipo }}</p>
              <p class="text-xs text-light-muted dark:text-dark-muted">{{ ticket.tipo_falla }}</p>
            </div>
          </div>

          <!-- Descripción -->
          <div class="mb-4">
            <p class="text-sm text-light-muted dark:text-dark-muted mb-1">Descripción:</p>
            <p class="text-light-text dark:text-dark-text text-sm whitespace-pre-wrap">{{ ticket.descripcion }}</p>
          </div>

          <!-- Info adicional -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-light-border dark:border-dark-border text-sm">
            <div>
              <p class="text-light-muted dark:text-dark-muted text-xs">Creado</p>
              <p class="text-light-text dark:text-dark-text">{{ formatDate(ticket.fecha_creacion) }}</p>
            </div>
            <div>
              <p class="text-light-muted dark:text-dark-muted text-xs">Técnico Asignado</p>
              <p class="text-light-text dark:text-dark-text">{{ ticket.tecnico || 'Sin asignar' }}</p>
            </div>
          </div>
        </div>

        <!-- Comentarios -->
        <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 mb-6 border border-light-border dark:border-dark-border">
          <h3 class="font-semibold text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
            <MessageSquare :size="18" class="text-primary" />
            Conversación
          </h3>

          <!-- Lista de comentarios -->
          <div v-if="comentarios.length > 0" class="space-y-3 mb-4 max-h-64 overflow-y-auto">
            <div 
              v-for="(comentario, index) in comentarios" 
              :key="index"
              class="p-3 rounded-xl bg-light-bg dark:bg-dark-bg"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-primary">{{ comentario.autor }}</span>
                <span class="text-xs text-light-muted dark:text-dark-muted">{{ formatDate(comentario.fecha_creacion) }}</span>
              </div>
              <p class="text-sm text-light-text dark:text-dark-text">{{ comentario.contenido }}</p>
            </div>
          </div>
          <div v-else class="text-center py-6 text-light-muted dark:text-dark-muted text-sm">
            No hay comentarios aún
          </div>

          <!-- Formulario nuevo comentario -->
          <div v-if="ticket.estatus !== 'CERRADO'" class="pt-4 border-t border-light-border dark:border-dark-border">
            <div v-if="success" class="bg-success/10 text-success rounded-lg p-2 mb-3 text-sm text-center">
              {{ success }}
            </div>
            
            <div class="flex gap-2">
              <textarea
                v-model="nuevoComentario"
                rows="2"
                placeholder="Escribe tu respuesta..."
                class="flex-1 px-4 py-2 rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:border-primary focus:ring-0 transition-colors text-sm resize-none"
              ></textarea>
              <button
                @click="submitComment"
                :disabled="submittingComment || !nuevoComentario.trim()"
                class="btn-primary !px-4 !py-2 self-end"
              >
                <Loader2 v-if="submittingComment" class="animate-spin" :size="18" />
                <Send v-else :size="18" />
              </button>
            </div>
          </div>
          <div v-else class="pt-4 border-t border-light-border dark:border-dark-border text-center text-light-muted dark:text-dark-muted text-sm">
            Este ticket está cerrado
          </div>
        </div>
      </template>

      <!-- Footer -->
      <p class="text-center text-xs text-light-muted dark:text-dark-muted mt-6">
        Sistema de Soporte Técnico • Inventario TI
      </p>
    </div>
  </div>
</template>

<style scoped>
input:focus, textarea:focus {
  outline: none;
}
</style>
