<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TicketsService from '../services/TicketsService'
import { useSwal } from '../composables/useSwal'
import { useAuthStore } from '../stores/auth'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import {
  ArrowLeft,
  Loader2,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Clock3,
  CheckCircle2,
  Lock,
  Wifi,
  HardDrive,
  Zap,
  ChevronRight
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const { success: toastSuccess, error: toastError, warning: toastWarning } = useSwal()

const titulo = ref('')
const categoria = ref('')
const descripcion = ref('')
const prioridad = ref('MEDIA')
const loading = ref(false)
const selectedTemplate = ref('')

const categoriaOptions = [
  { label: 'Consulta / Soporte General', value: 'Consulta / Soporte General' },
  { label: 'Software / Licencias', value: 'Software / Licencias' },
  { label: 'Accesos / Permisos', value: 'Accesos / Permisos' },
  { label: 'Red / Internet', value: 'Red / Internet' },
  { label: 'Equipos / Hardware', value: 'Equipos / Hardware' },
  { label: 'Mantenimiento', value: 'Mantenimiento' },
  { label: 'Modificacion / Cambio', value: 'Modificacion / Cambio' },
  { label: 'Otro', value: 'Otro' }
]

const prioridadOptions = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Critica', value: 'CRITICA' }
]

const issueTemplates = [
  {
    id: 'acceso',
    title: 'No puedo iniciar sesion',
    category: 'Accesos / Permisos',
    description: 'Al intentar ingresar al sistema aparece un error de acceso. Ya valide usuario y contrasena, pero sigue sin permitir entrada.',
    icon: Lock,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'internet',
    title: 'Sin conexion de red',
    category: 'Red / Internet',
    description: 'El equipo no tiene acceso a internet. Ya reinicie cable/modem y persiste la falla. Impacta actividades operativas.',
    icon: Wifi,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'sistema',
    title: 'Aplicacion se cierra sola',
    category: 'Software / Licencias',
    description: 'La aplicacion cierra inesperadamente al abrir modulo principal. Ocurre de forma repetitiva y bloquea el trabajo.',
    icon: Zap,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'hardware',
    title: 'Falla de equipo',
    category: 'Equipos / Hardware',
    description: 'El equipo presenta falla fisica/intermitente. Se detectan comportamientos anormales (ruido, apagado o no enciende).',
    icon: HardDrive,
    color: 'from-indigo-500 to-blue-500'
  }
]

const mapCategoriaToTipoFalla = (categoriaValue) => {
  const value = String(categoriaValue || '').toLowerCase()

  if (value.includes('equipo') || value.includes('hardware') || value.includes('mantenimiento')) {
    return 'HARDWARE'
  }

  if (value.includes('software') || value.includes('licencia') || value.includes('acceso') || value.includes('permiso')) {
    return 'SOFTWARE'
  }

  if (value.includes('red') || value.includes('internet')) {
    return 'RED'
  }

  return 'OTRO'
}

const canSetCriticalPriority = computed(() => authStore.user?.roleId !== 2)
const isViewer = computed(() => authStore.user?.roleId === 2)

const roleLabel = computed(() => {
  const roleId = authStore.user?.roleId
  if (roleId === 1) return 'Administrador'
  if (roleId === 2) return 'Viewer'
  if (roleId === 3) return 'Analista'
  return 'Usuario'
})

const availablePriorityOptions = computed(() => {
  if (canSetCriticalPriority.value) return prioridadOptions
  return prioridadOptions.filter(option => option.value !== 'CRITICA')
})

const titleLength = computed(() => titulo.value.trim().length)
const descriptionLength = computed(() => descripcion.value.trim().length)

const categoryHint = computed(() => {
  if (!categoria.value) return 'Selecciona una categoria para enrutar el ticket al equipo correcto.'
  return `Se clasificara como ${mapCategoriaToTipoFalla(categoria.value)} para triage interno.`
})

const priorityHint = computed(() => {
  if (prioridad.value === 'ALTA') return 'Alta: impacto operativo relevante, requiere atencion prioritaria.'
  if (prioridad.value === 'CRITICA') return 'Critica: interrupcion total. Se atiende como incidente mayor.'
  if (prioridad.value === 'BAJA') return 'Baja: incidencia menor, no bloquea operacion principal.'
  return 'Media: afecta productividad pero hay alternativa temporal.'
})

const canSubmit = computed(() => {
  return Boolean(titulo.value.trim() && categoria.value && descripcion.value.trim().length >= 10 && !loading.value)
})

watch(canSetCriticalPriority, (canSetCritical) => {
  if (!canSetCritical && prioridad.value === 'CRITICA') {
    prioridad.value = 'ALTA'
  }
}, { immediate: true })

watch(categoria, (newCategory) => {
  if (!newCategory) return
  if (!titulo.value.trim()) {
    titulo.value = `Soporte: ${newCategory}`
  }
})

const applyTemplate = (templateId) => {
  const template = issueTemplates.find(t => t.id === templateId)
  if (!template) return

  selectedTemplate.value = template.id
  titulo.value = template.title
  categoria.value = template.category
  descripcion.value = template.description

  if (isViewer.value && prioridad.value === 'BAJA') {
    prioridad.value = 'MEDIA'
  }
}

const submitTicket = async () => {
  if (!titulo.value.trim() || !categoria.value || !descripcion.value.trim()) {
    toastWarning('Completa titulo, categoria y descripcion')
    return
  }

  if (descripcion.value.trim().length < 10) {
    toastWarning('La descripcion debe tener al menos 10 caracteres')
    return
  }

  loading.value = true

  try {
    if (!canSetCriticalPriority.value && prioridad.value === 'CRITICA') {
      toastWarning('La prioridad CRITICA solo puede validarla soporte o administracion.')
      return
    }

    await TicketsService.create({
      titulo: titulo.value.trim(),
      categoria: categoria.value,
      descripcion: descripcion.value.trim(),
      prioridad: prioridad.value,
      tipo_falla: mapCategoriaToTipoFalla(categoria.value)
    })

    toastSuccess('Ticket creado correctamente')
    router.push({ name: 'tickets' })
  } catch (error) {
    toastError(error.response?.data?.message || 'No se pudo crear el ticket')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto custom-scroll animate-fade-in px-2 sm:px-4 pb-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-3 pt-2">
        <button @click="router.push({ name: 'tickets' })" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors">
          <ArrowLeft :size="20" class="text-light-muted dark:text-dark-muted" />
        </button>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.35em] text-light-muted dark:text-dark-muted">Soporte TI</p>
          <h1 class="text-2xl sm:text-3xl font-black text-light-text dark:text-white">Crear nuevo ticket</h1>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <!-- Left Sidebar: Info & Tips -->
        <aside class="space-y-4 lg:sticky lg:top-4 lg:h-fit">
          <!-- Quick Templates Card -->
          <div class="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div class="px-5 py-4 bg-gradient-to-r from-primary/10 to-emerald-500/10 border-b border-light-border dark:border-dark-border">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-light-muted dark:text-dark-muted">Atajos inteligentes</p>
              <h3 class="text-sm font-black mt-1">Plantillas rápidas</h3>
            </div>
            <div class="p-4 space-y-2.5">
              <button
                v-for="template in issueTemplates"
                :key="template.id"
                type="button"
                @click="applyTemplate(template.id)"
                :class="[
                  'w-full text-left rounded-xl p-3.5 transition-all group',
                  selectedTemplate === template.id
                    ? 'border-2 border-primary bg-primary/5 shadow-sm'
                    : 'border border-light-border dark:border-dark-border hover:border-primary/50 bg-white dark:bg-dark-bg/50 hover:bg-slate-50 dark:hover:bg-dark-bg'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div :class="['bg-gradient-to-br', template.color, 'p-2 rounded-lg text-white shrink-0']">
                    <component :is="template.icon" :size="16" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-light-text dark:text-white group-hover:text-primary transition-colors">{{ template.title }}</p>
                    <p class="text-[10px] text-light-muted dark:text-dark-muted mt-0.5 line-clamp-1">{{ template.category }}</p>
                  </div>
                  <ChevronRight :size="14" class="text-light-muted dark:text-dark-muted mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            </div>
          </div>

          <!-- Tips Card -->
          <div class="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm">
            <div class="px-5 py-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-light-border dark:border-dark-border">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-light-muted dark:text-dark-muted">Recomendaciones</p>
              <h3 class="text-sm font-black mt-1">Mejora tu reporte</h3>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex gap-3">
                <Lightbulb :size="16" class="text-amber-500 shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed text-light-text dark:text-white">Describe sintomas específicos, cuando empezó y qué acciones ya intentaste.</p>
              </div>
              <div class="flex gap-3">
                <Clock3 :size="16" class="text-blue-500 shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed text-light-text dark:text-white">Reportes precisos reducen tiempo de diagnóstico y resolución.</p>
              </div>
              <div class="flex gap-3">
                <ShieldCheck :size="16" class="text-emerald-500 shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed text-light-text dark:text-white">{{ isViewer ? 'Soporte validará prioridades críticas cuando sea necesario.' : 'Tu rol permite establecer prioridad completa en tickets.' }}</p>
              </div>
            </div>
          </div>

          <!-- Role Info Card -->
          <div :class="[
            'rounded-2xl border p-4 flex items-start gap-3',
            isViewer ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
          ]">
            <component :is="isViewer ? AlertTriangle : CheckCircle2" :size="18" :class="isViewer ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'" class="mt-0.5 shrink-0" />
            <p class="text-xs leading-relaxed" :class="isViewer ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'">
              <span v-if="isViewer"><strong>Rol Viewer:</strong> Creas tickets y sugieres prioridad. Soporte escalará si es crítico.</span>
              <span v-else><strong>Rol {{ roleLabel }}:</strong> Tienes acceso a todas las prioridades incluyendo crítica.</span>
            </p>
          </div>
        </aside>

        <!-- Right Content: Form -->
        <section class="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-xl overflow-hidden">
          <div class="px-6 sm:px-8 py-5 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-white to-slate-50 dark:from-dark-card dark:to-dark-bg/40">
            <p class="text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted">Formulario de solicitud</p>
            <h2 class="text-lg font-black mt-1">Información del problema</h2>
          </div>

          <form @submit.prevent="submitTicket" class="p-6 sm:p-8 space-y-7">
            <!-- Titulo -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Asunto *</label>
                <span class="text-xs font-semibold" :class="titleLength >= 100 ? 'text-amber-600' : titleLength > 0 ? 'text-emerald-600' : 'text-light-muted dark:text-dark-muted'">{{ titleLength }}/120</span>
              </div>
              <InputText
                v-model="titulo"
                class="w-full !rounded-xl !py-3 !px-4 text-sm"
                placeholder="Describe brevemente el problema"
                maxlength="120"
              />
              <p class="text-xs text-light-muted dark:text-dark-muted">Sé específico y conciso para que el equipo entienda rápidamente.</p>
            </div>

            <!-- Categoria & Prioridad (2 columns) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="space-y-2.5">
                <label class="text-xs font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Categoría *</label>
                <Select
                  v-model="categoria"
                  :options="categoriaOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona una categoría"
                  class="w-full !rounded-xl"
                />
                <p class="text-xs text-light-muted dark:text-dark-muted">{{ categoryHint }}</p>
              </div>

              <div class="space-y-2.5">
                <label class="text-xs font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Prioridad *</label>
                <Select
                  v-model="prioridad"
                  :options="availablePriorityOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full !rounded-xl"
                />
                <p class="text-xs text-light-muted dark:text-dark-muted">{{ priorityHint }}</p>
              </div>
            </div>

            <!-- Descripcion -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Descripción detallada *</label>
                <span :class="descriptionLength >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400'">
                  {{ descriptionLength >= 10 ? '✓ OK' : 'Mínimo 10 caracteres' }}
                </span>
              </div>
              <textarea
                v-model="descripcion"
                rows="7"
                class="w-full rounded-xl border-2 border-light-border dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-y min-h-[150px] font-mono text-xs"
                placeholder="Incluye: síntomas específicos, cuándo comenzó, qué intentaste, equipos afectados..."
              ></textarea>
              <div class="flex items-center justify-between text-xs">
                <p class="text-light-muted dark:text-dark-muted">{{ descriptionLength }} caracteres</p>
                <p class="text-light-muted dark:text-dark-muted">Máximo útil: 500 caracteres</p>
              </div>
            </div>

            <!-- Validation Summary -->
            <div class="rounded-xl bg-slate-50 dark:bg-dark-bg border border-light-border dark:border-dark-border p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-light-muted dark:text-dark-muted mb-2">Resumen de validación</p>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-2 h-2 rounded-full shrink-0',
                    titulo.trim() ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  ]"></div>
                  <span class="text-light-text dark:text-white">Asunto: <strong>{{ titulo.trim() ? 'Listo' : 'Falta' }}</strong></span>
                </div>
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-2 h-2 rounded-full shrink-0',
                    categoria ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  ]"></div>
                  <span class="text-light-text dark:text-white">Categoría: <strong>{{ categoria ? 'Listo' : 'Falta' }}</strong></span>
                </div>
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-2 h-2 rounded-full shrink-0',
                    descriptionLength >= 10 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  ]"></div>
                  <span class="text-light-text dark:text-white">Descripción: <strong>{{ descriptionLength >= 10 ? 'OK' : 'Corta' }}</strong></span>
                </div>
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-2 h-2 rounded-full shrink-0',
                    prioridad ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  ]"></div>
                  <span class="text-light-text dark:text-white">Prioridad: <strong>{{ prioridad ? 'Listo' : 'Falta' }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-end border-t border-light-border dark:border-dark-border pt-6">
              <button
                type="button"
                @click="router.push({ name: 'tickets' })"
                class="px-6 py-3 rounded-xl border border-light-border dark:border-dark-border text-sm font-bold text-light-muted dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="!canSubmit"
                class="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-[0.12em] hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[200px] shadow-lg hover:shadow-xl"
              >
                <Loader2 v-if="loading" :size="18" class="animate-spin" />
                <ClipboardList v-else :size="18" />
                {{ loading ? 'Creando...' : 'Crear ticket' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
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
  background: rgb(203, 213, 225);
  border-radius: 3px;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(148, 163, 184);
}

.dark .custom-scroll::-webkit-scrollbar-thumb {
  background: rgb(71, 85, 105);
}

.dark .custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(100, 116, 139);
}

/* PrimeVue Select customization */
:deep(.p-select) {
  @apply rounded-xl;
}

:deep(.p-select .p-select-label) {
  @apply py-3 px-4;
}
</style>
