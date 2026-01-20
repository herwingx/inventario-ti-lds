<script setup>
/**
 * @fileoverview Vista pública de landing QR.
 * Permite a usuarios externos reportar fallas y ver estado de tickets sin autenticación.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrPublicService from '../services/QrPublicService'
import { Monitor, AlertTriangle, Clock, CheckCircle, Send, Upload, Loader2, Ticket, MessageSquare, Camera, History, ChevronDown, ChevronUp } from 'lucide-vue-next'

// Route
const route = useRoute()
const router = useRouter()
const token = computed(() => route.params.token)

// Estado
const loading = ref(true)
const submitting = ref(false)
const uploadingEvidence = ref(false)
const equipo = ref(null)
const ticketsActivos = ref([])
const ticketsHistorial = ref([])
const showHistorial = ref(false)
const error = ref(null)
const success = ref(null)
const ticketCreado = ref(null)

// Formulario
const form = ref({
  tipo_falla: '',
  descripcion: '',
  nombre_reporta: '',
  email_reporta: ''
})

// Opciones
const tiposFalla = [
  { label: 'Hardware (físico)', value: 'HARDWARE', icon: '🔧' },
  { label: 'Software (programas)', value: 'SOFTWARE', icon: '💻' },
  { label: 'Red / Internet', value: 'RED', icon: '🌐' },
  { label: 'Impresora', value: 'IMPRESORA', icon: '🖨️' },
  { label: 'Otro', value: 'OTRO', icon: '❓' }
]

onMounted(async () => {
  await loadEquipo()
})

const loadEquipo = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await QrPublicService.getEquipoByToken(token.value)
    equipo.value = data.equipo
    ticketsActivos.value = data.tickets_activos || []
    ticketsHistorial.value = data.tickets_historial || []
  } catch (err) {
    console.error('Error:', err)
    error.value = 'No se encontró el equipo o el código QR es inválido.'
  } finally {
    loading.value = false
  }
}

const goToTicket = (tokenAcceso) => {
  router.push(`/q/ticket/${tokenAcceso}`)
}

const submitReport = async () => {
  if (!form.value.tipo_falla || !form.value.descripcion) {
    error.value = 'Por favor completa el tipo de falla y la descripción.'
    return
  }
  
  submitting.value = true
  error.value = null
  
  try {
    const result = await QrPublicService.reportFalla(token.value, form.value)
    success.value = result.message
    ticketCreado.value = result
    
    // Limpiar formulario
    form.value = { tipo_falla: '', descripcion: '', nombre_reporta: '', email_reporta: '' }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al enviar el reporte. Intenta de nuevo.'
  } finally {
    submitting.value = false
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validar tipo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Solo se permiten imágenes JPG, PNG o WEBP.'
    return
  }
  
  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen no debe superar los 5MB.'
    return
  }
  
  if (!ticketCreado.value?.token_seguimiento) {
    error.value = 'Primero debes crear el reporte.'
    return
  }
  
  uploadingEvidence.value = true
  error.value = null
  
  try {
    await QrPublicService.uploadEvidence(ticketCreado.value.token_seguimiento, file)
    success.value = '¡Evidencia subida correctamente!'
  } catch (err) {
    error.value = 'Error al subir la evidencia.'
  } finally {
    uploadingEvidence.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

const getEstatusIcon = (estatus) => {
  const map = {
    'ABIERTO': AlertTriangle,
    'EN_PROGRESO': Clock,
    'PENDIENTE': Clock,
    'RESUELTO': CheckCircle,
    'CERRADO': CheckCircle
  }
  return map[estatus] || AlertTriangle
}

const getEstatusColor = (estatus) => {
  const map = {
    'ABIERTO': 'text-danger',
    'EN_PROGRESO': 'text-warning',
    'PENDIENTE': 'text-light-muted',
    'RESUELTO': 'text-success',
    'CERRADO': 'text-primary'
  }
  return map[estatus] || 'text-light-muted'
}

const getEstatusLabel = (estatus) => {
  const map = {
    'ABIERTO': 'Abierto',
    'EN_PROGRESO': 'En Progreso',
    'PENDIENTE': 'Pendiente',
    'RESUELTO': 'Resuelto',
    'CERRADO': 'Cerrado'
  }
  return map[estatus] || estatus
}
</script>

<template>
  <div class="min-h-screen bg-light-bg dark:bg-dark-bg py-8 px-4">
    <div class="max-w-lg mx-auto">
      
      <!-- Header con Logo -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
          <Monitor class="text-white" :size="32" />
        </div>
        <h1 class="text-2xl font-bold text-light-text dark:text-dark-text">Soporte Técnico</h1>
        <p class="text-light-muted dark:text-dark-muted text-sm">Reporte de fallas rápido y sencillo</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-8 text-center border border-light-border dark:border-dark-border">
        <Loader2 class="animate-spin text-primary mx-auto mb-4" :size="40" />
        <p class="text-light-muted dark:text-dark-muted">Cargando información del equipo...</p>
      </div>

      <!-- Error: Equipo no encontrado -->
      <div v-else-if="error && !equipo" class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-8 text-center border border-light-border dark:border-dark-border">
        <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="text-danger" :size="32" />
        </div>
        <h2 class="text-xl font-bold text-light-text dark:text-dark-text mb-2">Código QR Inválido</h2>
        <p class="text-light-muted dark:text-dark-muted">{{ error }}</p>
      </div>

      <!-- Contenido Principal -->
      <template v-else-if="equipo">
        
        <!-- Card Info Equipo -->
        <div class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 mb-6 border border-light-border dark:border-dark-border">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Monitor class="text-primary" :size="28" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-light-text dark:text-dark-text truncate">
                {{ equipo.marca }} {{ equipo.modelo }}
              </h2>
              <p class="text-sm text-light-muted dark:text-dark-muted">{{ equipo.tipo }}</p>
              <p class="text-xs text-light-muted/70 dark:text-dark-muted/70">S/N: {{ equipo.numero_serie }}</p>
            </div>
          </div>
          
          <div v-if="equipo.sucursal || equipo.empresa" class="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
            <p class="text-sm text-light-muted dark:text-dark-muted">
              <span v-if="equipo.empresa">{{ equipo.empresa }}</span>
              <span v-if="equipo.empresa && equipo.sucursal"> • </span>
              <span v-if="equipo.sucursal">{{ equipo.sucursal }}</span>
            </p>
          </div>
        </div>

        <!-- Tickets Activos -->
        <div v-if="ticketsActivos.length > 0" class="bg-warning/10 rounded-2xl p-4 mb-6 border border-warning/30">
          <h3 class="font-semibold text-warning flex items-center gap-2 mb-3">
            <Ticket :size="18" />
            Ya hay reportes activos para este equipo
          </h3>
          <div class="space-y-2">
            <div 
              v-for="ticket in ticketsActivos" 
              :key="ticket.id"
              class="flex items-center justify-between bg-light-card dark:bg-dark-card rounded-lg p-3 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
              @click="goToTicket(ticket.token_acceso)"
              title="Ver estado"
            >
              <div class="flex items-center gap-2">
                <component :is="getEstatusIcon(ticket.estatus)" :size="16" :class="getEstatusColor(ticket.estatus)" />
                <span class="text-sm font-medium text-light-text dark:text-dark-text">{{ ticket.tipo_falla }}</span>
              </div>
              <span class="text-xs text-light-muted dark:text-dark-muted">{{ formatDate(ticket.fecha_creacion) }}</span>
            </div>
          </div>
        </div>

        <!-- Historial de Tickets (Collapsible) -->
        <div v-if="ticketsHistorial.length > 0" class="mb-6">
          <button 
            @click="showHistorial = !showHistorial"
            class="w-full flex items-center justify-between p-4 bg-light-card dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-primary transition-colors"
          >
            <span class="flex items-center gap-2 font-medium">
              <History :size="18" />
              Ver historial de reportes
            </span>
            <component :is="showHistorial ? ChevronUp : ChevronDown" :size="18" />
          </button>

          <div v-if="showHistorial" class="mt-2 space-y-2 pl-2 max-h-60 overflow-y-auto custom-scrollbar">
            <div 
              v-for="ticket in ticketsHistorial" 
              :key="'hist-'+ticket.id"
              class="flex items-center justify-between bg-light-card dark:bg-dark-card rounded-lg p-3 border border-light-border dark:border-dark-border cursor-pointer hover:border-primary transition-colors"
              @click="goToTicket(ticket.token_acceso)"
            >
              <div class="flex items-center gap-3">
                <div :class="['p-1.5 rounded-full bg-opacity-10', getEstatusColor(ticket.estatus).replace('text-', 'bg-')]">
                   <component :is="getEstatusIcon(ticket.estatus)" :size="14" :class="getEstatusColor(ticket.estatus)" />
                </div>
                <div>
                  <p class="text-sm font-medium text-light-text dark:text-dark-text">{{ ticket.tipo_falla }}</p>
                  <p class="text-xs text-light-muted dark:text-dark-muted">{{ getEstatusLabel(ticket.estatus) }}</p>
                </div>
              </div>
              <span class="text-xs text-light-muted dark:text-dark-muted">{{ formatDate(ticket.fecha_creacion) }}</span>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="success && ticketCreado" class="bg-success/10 rounded-2xl p-6 mb-6 border border-success/30 text-center">
          <div class="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle class="text-success" :size="32" />
          </div>
          <h3 class="text-lg font-bold text-success mb-2">¡Reporte Enviado!</h3>
          <p class="text-success/80 text-sm mb-4">
            Tu ticket ha sido creado con el número <strong>#{{ ticketCreado.ticket_id }}</strong>
          </p>
          <div class="bg-light-card dark:bg-dark-card rounded-lg p-3 mb-4 border border-light-border dark:border-dark-border">
            <p class="text-xs text-light-muted dark:text-dark-muted mb-1">Código de seguimiento:</p>
            <p class="font-mono text-lg font-bold text-primary">{{ ticketCreado.token_seguimiento }}</p>
          </div>
          
          <!-- Subir evidencia -->
          <div class="mt-4">
            <label class="block text-sm text-light-muted dark:text-dark-muted mb-2">¿Tienes una foto del problema?</label>
            <label class="cursor-pointer inline-flex items-center gap-2 btn-primary !py-2 !px-4">
              <Camera v-if="!uploadingEvidence" :size="18" />
              <Loader2 v-else class="animate-spin" :size="18" />
              <span>{{ uploadingEvidence ? 'Subiendo...' : 'Subir Foto' }}</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                class="hidden" 
                @change="handleFileUpload"
                :disabled="uploadingEvidence"
              />
            </label>
          </div>
        </div>

        <!-- Formulario de Reporte -->
        <div v-if="!ticketCreado" class="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 border border-light-border dark:border-dark-border">
          <h3 class="text-lg font-bold text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
            <AlertTriangle class="text-warning" :size="20" />
            Reportar un Problema
          </h3>

          <!-- Error Message -->
          <div v-if="error" class="bg-danger/10 text-danger rounded-lg p-3 mb-4 text-sm border border-danger/30">
            {{ error }}
          </div>

          <form @submit.prevent="submitReport" class="space-y-4">
            <!-- Tipo de Falla -->
            <div>
              <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">¿Qué tipo de problema es?</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="tipo in tiposFalla"
                  :key="tipo.value"
                  type="button"
                  @click="form.tipo_falla = tipo.value"
                  :class="[
                    'p-3 rounded-xl border-2 text-left transition-all',
                    form.tipo_falla === tipo.value
                      ? 'border-primary bg-primary/10'
                      : 'border-light-border dark:border-dark-border hover:border-primary/50'
                  ]"
                >
                  <span class="text-xl">{{ tipo.icon }}</span>
                  <p class="text-sm font-medium text-light-text dark:text-dark-text mt-1">{{ tipo.label }}</p>
                </button>
              </div>
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Describe el problema</label>
              <textarea
                v-model="form.descripcion"
                rows="4"
                placeholder="Cuéntanos qué está pasando con el equipo..."
                class="w-full px-4 py-3 rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:border-primary focus:ring-0 transition-colors resize-none"
              ></textarea>
            </div>

            <!-- Datos de contacto (opcionales) -->
            <div class="pt-4 border-t border-light-border dark:border-dark-border">
              <p class="text-sm text-light-muted dark:text-dark-muted mb-3">Opcional: tus datos de contacto</p>
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="form.nombre_reporta"
                  type="text"
                  placeholder="Tu nombre"
                  class="px-4 py-2.5 rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:border-primary focus:ring-0 transition-colors text-sm"
                />
                <input
                  v-model="form.email_reporta"
                  type="email"
                  placeholder="Tu email"
                  class="px-4 py-2.5 rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:border-primary focus:ring-0 transition-colors text-sm"
                />
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="submitting || !form.tipo_falla || !form.descripcion"
              class="btn-primary w-full !py-3.5"
            >
              <Loader2 v-if="submitting" class="animate-spin" :size="20" />
              <Send v-else :size="20" />
              <span>{{ submitting ? 'Enviando...' : 'Enviar Reporte' }}</span>
            </button>
          </form>
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
/* Reset para inputs */
input:focus, textarea:focus {
  outline: none;
}
</style>
