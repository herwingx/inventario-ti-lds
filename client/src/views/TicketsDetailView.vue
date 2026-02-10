<script setup>
/**
 * @fileoverview Vista de Detalle de Ticket.
 * Muestra información completa del ticket, comentarios y permite cambios de estado.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import TicketsService from '../services/TicketsService'
import { ArrowLeft, Monitor, User, Calendar, Clock, AlertCircle, CheckCircle, Send, MessageSquare, Loader2 } from 'lucide-vue-next'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
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

// Form
const nuevoComentario = ref('')
const esInterno = ref(false)
const selectedTecnico = ref(null)
const selectedEstatus = ref(null)
const selectedPrioridad = ref(null)

// Opciones
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

onMounted(async () => {
  await loadTicket()
  await loadTecnicos()
})

const loadTicket = async () => {
  loading.value = true
  try {
    const data = await TicketsService.getById(ticketId.value)
    ticket.value = data
    // Prisma devuelve ticket_comentarios según el include del backend
    comentarios.value = data.ticket_comentarios || []
    
    // Inicializar selects con valores actuales
    selectedEstatus.value = data.estatus
    selectedPrioridad.value = data.prioridad
    selectedTecnico.value = data.id_asignado_a
  } catch (error) {
    toastError('No se pudo cargar el ticket')
    router.push({ name: 'tickets' })
  } finally {
    loading.value = false
  }
}

const loadTecnicos = async () => {
  try {
    tecnicos.value = await TicketsService.getTecnicos()
  } catch (error) {
    console.error('Error al cargar técnicos:', error)
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${diffDays}d`
}

const getPrioridadSeverity = (prioridad) => {
  const map = {
    'BAJA': 'secondary',
    'MEDIA': 'info',
    'ALTA': 'warn',
    'CRITICA': 'danger'
  }
  return map[prioridad] || 'secondary'
}

const getEstatusSeverity = (estatus) => {
  const map = {
    'ABIERTO': 'danger',
    'EN_PROGRESO': 'warn',
    'PENDIENTE': 'secondary',
    'RESUELTO': 'success',
    'CERRADO': 'contrast'
  }
  return map[estatus] || 'secondary'
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
    await loadTicket()
  } catch (error) {
    toastError('No se pudo actualizar el ticket')
  } finally {
    saving.value = false
  }
}

const addComment = async () => {
  if (!nuevoComentario.value.trim()) return
  
  sendingComment.value = true
  try {
    await TicketsService.addComment(ticketId.value, nuevoComentario.value, esInterno.value)
    toastSuccess('Comentario agregado')
    nuevoComentario.value = ''
    esInterno.value = false
    await loadTicket()
  } catch (error) {
    toastError('No se pudo agregar el comentario')
  } finally {
    sendingComment.value = false
  }
}

const goBack = () => {
  router.push({ name: 'tickets' })
}
</script>

<template>
  <div class="animate-fade-in-up">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="animate-spin text-primary" :size="40" />
    </div>

    <template v-else-if="ticket">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button @click="goBack" class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors">
          <ArrowLeft :size="20" class="text-gray-600 dark:text-gray-300" />
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Ticket #{{ ticket.id }}</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Creado {{ formatDate(ticket.fecha_creacion) }}</p>
        </div>
        <div class="flex gap-2">
          <Tag :value="ticket.prioridad" :severity="getPrioridadSeverity(ticket.prioridad)" class="!text-sm !font-bold" />
          <Tag :value="ticket.estatus?.replace('_', ' ')" :severity="getEstatusSeverity(ticket.estatus)" class="!text-sm !font-bold" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Columna Principal -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Info del Ticket -->
          <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Descripción del Problema</h2>
            
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-dark-border">
              <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Monitor :size="24" class="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">{{ ticket.equipos?.marca }} {{ ticket.equipos?.modelo }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">S/N: {{ ticket.equipos?.numero_serie }}</div>
              </div>
              <Tag :value="ticket.tipo_falla" severity="info" class="ml-auto !font-bold" />
            </div>
            
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ ticket.descripcion }}</p>
            
            <!-- Evidencia -->
            <div v-if="ticket.evidencia_url" class="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Evidencia adjunta:</h4>
              <a :href="ticket.evidencia_url" target="_blank" class="text-primary hover:underline text-sm">Ver imagen</a>
            </div>
          </div>

          <!-- Comentarios -->
          <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare :size="20" class="text-primary" />
              Comentarios ({{ comentarios.length }})
            </h2>
            
            <!-- Lista de comentarios -->
            <div v-if="comentarios.length > 0" class="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div 
                v-for="comentario in comentarios" 
                :key="comentario.id"
                :class="[
                  'p-4 rounded-lg',
                  comentario.es_interno 
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' 
                    : 'bg-gray-50 dark:bg-dark-bg'
                ]"
              >
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User :size="16" class="text-primary" />
                  </div>
                  <div class="flex-1">
                    <span class="font-medium text-gray-900 dark:text-white text-sm">{{ comentario.autor_nombre || 'Sistema' }}</span>
                    <span v-if="comentario.es_interno" class="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">(Nota interna)</span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(comentario.fecha_creacion) }}</span>
                </div>
                <p class="text-gray-700 dark:text-gray-300 text-sm pl-10">{{ comentario.contenido }}</p>
              </div>
            </div>
            
            <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare :size="32" class="mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
            </div>

            <!-- Formulario nuevo comentario -->
            <div v-if="ticket.estatus !== 'CERRADO'" class="border-t border-gray-200 dark:border-dark-border pt-4">
              <Textarea 
                v-model="nuevoComentario" 
                rows="3" 
                placeholder="Escribe un comentario..." 
                class="w-full mb-3"
              />
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Checkbox v-model="esInterno" :binary="true" />
                  Nota interna (solo visible para el equipo)
                </label>
                <button 
                  @click="addComment" 
                  :disabled="!nuevoComentario.trim() || sendingComment"
                  class="btn-primary !py-2 !px-4"
                >
                  <Loader2 v-if="sendingComment" class="animate-spin" :size="16" />
                  <Send v-else :size="16" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Lateral -->
        <div class="space-y-6">
          
          <!-- Panel de Gestión -->
          <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gestión del Ticket</h3>
            
            <div class="space-y-4">
              <!-- Estado -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <Select 
                  v-model="selectedEstatus" 
                  :options="estatusOptions" 
                  optionLabel="label" 
                  optionValue="value"
                  class="w-full"
                />
              </div>

              <!-- Prioridad -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                <Select 
                  v-model="selectedPrioridad" 
                  :options="prioridadOptions" 
                  optionLabel="label" 
                  optionValue="value"
                  class="w-full"
                />
              </div>

              <!-- Técnico -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asignar a</label>
                <Select 
                  v-model="selectedTecnico" 
                  :options="tecnicos" 
                  optionLabel="nombre_usuario" 
                  optionValue="id"
                  placeholder="Sin asignar"
                  showClear
                  class="w-full"
                />
              </div>

              <button 
                @click="updateTicket" 
                :disabled="saving"
                class="btn-primary w-full"
              >
                <Loader2 v-if="saving" class="animate-spin" :size="16" />
                <CheckCircle v-else :size="16" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

          <!-- Info Adicional -->
          <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información</h3>
            
            <div class="space-y-3 text-sm">
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar :size="16" class="text-primary" />
                <span>Creado: {{ formatDate(ticket.fecha_creacion) }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock :size="16" class="text-primary" />
                <span>Actualizado: {{ formatDate(ticket.fecha_actualizacion) }}</span>
              </div>
              <div v-if="ticket.fecha_cierre" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CheckCircle :size="16" class="text-green-500" />
                <span>Cerrado: {{ formatDate(ticket.fecha_cierre) }}</span>
              </div>
              <div v-if="ticket.reportado_por" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <User :size="16" class="text-primary" />
                <span>Reportado por: {{ ticket.reportado_por }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
