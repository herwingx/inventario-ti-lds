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
  CheckCircle2
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
    description: 'Al intentar ingresar al sistema aparece un error de acceso. Ya valide usuario y contrasena, pero sigue sin permitir entrada.'
  },
  {
    id: 'internet',
    title: 'Sin conexion de red',
    category: 'Red / Internet',
    description: 'El equipo no tiene acceso a internet. Ya reinicie cable/modem y persiste la falla. Impacta actividades operativas.'
  },
  {
    id: 'sistema',
    title: 'Aplicacion se cierra sola',
    category: 'Software / Licencias',
    description: 'La aplicacion cierra inesperadamente al abrir modulo principal. Ocurre de forma repetitiva y bloquea el trabajo.'
  },
  {
    id: 'hardware',
    title: 'Falla de equipo',
    category: 'Equipos / Hardware',
    description: 'El equipo presenta falla fisica/intermitente. Se detectan comportamientos anormales (ruido, apagado o no enciende).'
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
  <div class="h-full min-h-0 overflow-y-auto custom-scroll animate-fade-in px-1 sm:px-2 pb-6">
    <div class="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
      <aside class="rounded-3xl border border-light-border dark:border-dark-border bg-gradient-to-br from-primary/95 to-emerald-500 text-white p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div class="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-xl"></div>
        <div class="pointer-events-none absolute bottom-0 left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>

        <div class="relative z-10">
          <button @click="router.push({ name: 'tickets' })" class="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-all flex items-center justify-center mb-6">
            <ArrowLeft :size="18" />
          </button>

          <p class="text-[10px] font-black uppercase tracking-[0.35em] opacity-80">Soporte TI</p>
          <h1 class="text-2xl sm:text-3xl font-black leading-tight mt-2">Crear nuevo ticket</h1>
          <p class="mt-3 text-sm text-white/85 leading-relaxed">
            Registra una incidencia clara y priorizada para acelerar diagnostico y atencion del equipo de soporte.
          </p>

          <div class="mt-7 space-y-3">
            <div class="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 flex items-start gap-3">
              <Lightbulb :size="16" class="mt-0.5 shrink-0" />
              <p class="text-xs leading-relaxed">Describe sintomas, desde cuando ocurre y que acciones ya probaste.</p>
            </div>
            <div class="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 flex items-start gap-3">
              <Clock3 :size="16" class="mt-0.5 shrink-0" />
              <p class="text-xs leading-relaxed">Entre mas preciso sea el reporte, menor tiempo de resolucion.</p>
            </div>
            <div class="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 flex items-start gap-3">
              <ShieldCheck :size="16" class="mt-0.5 shrink-0" />
              <p class="text-xs leading-relaxed">{{ isViewer ? 'Como viewer, prioridad critica se valida por soporte.' : 'Puedes escalar prioridad critica cuando aplique.' }}</p>
            </div>
          </div>
        </div>
      </aside>

      <section class="rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-xl overflow-hidden">
        <div class="px-6 sm:px-8 py-5 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-white to-slate-50 dark:from-dark-card dark:to-dark-bg/40">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.28em] text-light-muted dark:text-dark-muted">Formulario guiado</p>
              <h2 class="text-xl font-black mt-1">Solicitud de soporte</h2>
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.16em]">
              <Sparkles :size="14" />
              UX optimizada
            </div>
          </div>
        </div>

        <form @submit.prevent="submitTicket" class="p-6 sm:p-8 space-y-6">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-light-muted dark:text-dark-muted mb-3">Plantillas rapidas</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                v-for="template in issueTemplates"
                :key="template.id"
                type="button"
                @click="applyTemplate(template.id)"
                :class="[
                  'text-left rounded-xl border px-4 py-3 transition-all',
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-light-border dark:border-dark-border hover:border-primary/40 bg-white dark:bg-dark-bg/40'
                ]"
              >
                <p class="text-sm font-black">{{ template.title }}</p>
                <p class="text-[11px] text-light-muted dark:text-dark-muted mt-1">{{ template.category }}</p>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Titulo</label>
              <InputText
                v-model="titulo"
                class="w-full !rounded-xl !py-3"
                placeholder="Ej. No puedo acceder al sistema"
              />
              <p class="text-[11px] text-light-muted dark:text-dark-muted">{{ titleLength }}/120</p>
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Categoria</label>
              <Select
                v-model="categoria"
                :options="categoriaOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona una categoria"
                class="w-full"
              />
              <p class="text-[11px] text-light-muted dark:text-dark-muted">{{ categoryHint }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Descripcion del problema</label>
            <textarea
              v-model="descripcion"
              rows="7"
              class="w-full rounded-2xl border-2 border-light-border dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-3 text-sm outline-none focus:border-primary resize-y min-h-[150px]"
              placeholder="Describe el problema con detalle: que paso, cuando inicio, impacto y que intentaste."
            ></textarea>
            <div class="flex items-center justify-between text-[11px]">
              <p :class="descriptionLength >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'">
                {{ descriptionLength >= 10 ? 'Descripcion suficiente' : 'Minimo recomendado: 10 caracteres' }}
              </p>
              <p class="text-light-muted dark:text-dark-muted">{{ descriptionLength }} caracteres</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-[0.45fr_0.55fr] gap-5">
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted">Prioridad</label>
              <Select
                v-model="prioridad"
                :options="availablePriorityOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
              <p class="text-[11px] text-light-muted dark:text-dark-muted">{{ priorityHint }}</p>
            </div>

            <div class="rounded-2xl border p-4 flex items-start gap-3" :class="isViewer ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'">
              <AlertTriangle v-if="isViewer" :size="18" class="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <CheckCircle2 v-else :size="18" class="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <p class="text-sm" :class="isViewer ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'">
                <span v-if="isViewer">Como viewer puedes crear tickets y sugerir prioridad. Si se requiere, soporte puede escalar a CRITICA.</span>
                <span v-else>Tu perfil puede definir prioridad completa, incluyendo CRITICA para incidentes mayores.</span>
              </p>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              @click="router.push({ name: 'tickets' })"
              class="px-5 py-3 rounded-xl border border-light-border dark:border-dark-border text-sm font-bold text-light-muted dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!canSubmit"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-[0.12em] hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[190px]"
            >
              <Loader2 v-if="loading" :size="18" class="animate-spin" />
              <ClipboardList v-else :size="18" />
              Crear ticket
            </button>
          </div>
        </form>
      </section>
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
  background-color: rgba(19, 180, 151, 0.25);
  border-radius: 20px;
}

:deep(.p-inputtext),
:deep(.p-select) {
  border: 2px solid #e5e7eb !important;
  border-radius: 0.85rem !important;
  transition: all 0.2s ease;
}

.dark :deep(.p-inputtext),
.dark :deep(.p-select) {
  border-color: #3a4148 !important;
  background: #24292d !important;
}

:deep(.p-inputtext:focus),
:deep(.p-select.p-focus) {
  border-color: #13b497 !important;
  box-shadow: none !important;
}

.animate-fade-in {
  animation: fadeIn 0.32s ease-out forwards;
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
