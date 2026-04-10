<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TicketsService from '../services/TicketsService'
import { useSwal } from '../composables/useSwal'
import { useAuthStore } from '../stores/auth'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { ClipboardList, ArrowLeft, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const { success: toastSuccess, error: toastError, warning: toastWarning } = useSwal()

const titulo = ref('')
const categoria = ref('')
const descripcion = ref('')
const prioridad = ref('MEDIA')
const loading = ref(false)

const categoriaOptions = [
  { label: 'Consulta / Soporte General', value: 'Consulta / Soporte General' },
  { label: 'Software / Licencias', value: 'Software / Licencias' },
  { label: 'Accesos / Permisos', value: 'Accesos / Permisos' },
  { label: 'Red / Internet', value: 'Red / Internet' },
  { label: 'Equipos / Hardware', value: 'Equipos / Hardware' },
  { label: 'Mantenimiento', value: 'Mantenimiento' },
  { label: 'Modificación / Cambio', value: 'Modificación / Cambio' },
  { label: 'Otro', value: 'Otro' }
]

const prioridadOptions = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Crítica', value: 'CRITICA' }
]

const canSetCriticalPriority = computed(() => authStore.user?.roleId !== 2)
const availablePriorityOptions = computed(() => {
  if (canSetCriticalPriority.value) return prioridadOptions
  return prioridadOptions.filter(option => option.value !== 'CRITICA')
})

watch(canSetCriticalPriority, (canSetCritical) => {
  if (!canSetCritical && prioridad.value === 'CRITICA') {
    prioridad.value = 'ALTA'
  }
}, { immediate: true })

const submitTicket = async () => {
  if (!titulo.value.trim() || !categoria.value || !descripcion.value.trim()) {
    toastWarning('Completa título, categoría y descripción')
    return
  }

  loading.value = true

  try {
    if (!canSetCriticalPriority.value && prioridad.value === 'CRITICA') {
      toastWarning('La prioridad CRITICA solo puede validarla soporte o administración.')
      return
    }

    await TicketsService.create({
      titulo: titulo.value.trim(),
      categoria: categoria.value,
      descripcion: descripcion.value.trim(),
      prioridad: prioridad.value,
      tipo_falla: 'OTRO'
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
  <div class="animate-fade-in-up">
    <div class="max-w-4xl mx-auto bg-white dark:bg-dark-card rounded-3xl shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden">
      <div class="p-6 sm:p-8 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-slate-50 to-white dark:from-dark-bg dark:to-dark-card">
        <div class="flex items-center gap-3 mb-4">
          <button @click="router.push({ name: 'tickets' })" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-bg flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
            <ArrowLeft :size="18" />
          </button>
          <div>
            <p class="text-xs uppercase tracking-[0.3em] font-black text-light-muted">Soporte TI</p>
            <h1 class="text-2xl font-black text-gray-900 dark:text-white">Nuevo Ticket</h1>
          </div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Crea una solicitud para cualquier tema de TI: accesos, software, red, equipos o cambios internos.
        </p>
      </div>

      <form @submit.prevent="submitTicket" class="p-6 sm:p-8 grid gap-5">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase tracking-wide text-gray-500">Título</label>
            <InputText v-model="titulo" class="w-full !rounded-xl !py-3" placeholder="Ej. No puedo acceder al sistema" />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black uppercase tracking-wide text-gray-500">Categoría</label>
            <Select v-model="categoria" :options="categoriaOptions" optionLabel="label" optionValue="value" placeholder="Selecciona una categoría" class="w-full !rounded-xl" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-black uppercase tracking-wide text-gray-500">Descripción</label>
          <textarea
            v-model="descripcion"
            rows="7"
            class="w-full rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-primary resize-none"
            placeholder="Describe el problema con el mayor detalle posible..."
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase tracking-wide text-gray-500">Prioridad</label>
            <Select v-model="prioridad" :options="availablePriorityOptions" optionLabel="label" optionValue="value" class="w-full !rounded-xl" />
          </div>

          <div class="flex items-end">
            <div class="w-full rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <span v-if="canSetCriticalPriority">No necesitas elegir equipo. Si aplica, el área de TI lo asignará después.</span>
              <span v-else>No necesitas elegir equipo. Puedes sugerir BAJA, MEDIA o ALTA; CRITICA la valida soporte.</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            @click="router.push({ name: 'tickets' })"
            class="px-5 py-3 rounded-xl border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-wide hover:bg-primary-hover disabled:opacity-60 transition-all"
          >
            <Loader2 v-if="loading" :size="18" class="animate-spin" />
            <ClipboardList v-else :size="18" />
            Crear Ticket
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
