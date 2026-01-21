<script setup>
/**
 * @fileoverview Componente de firma digital usando vue-signature-pad.
 * Permite capturar firmas táctiles/mouse y exportarlas como base64.
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Eraser, Check, X } from 'lucide-vue-next'

const props = defineProps({
  /** Ancho del canvas de firma */
  width: {
    type: String,
    default: '100%'
  },
  /** Alto del canvas de firma */
  height: {
    type: String,
    default: '200px'
  },
  /** Color de la línea de firma */
  penColor: {
    type: String,
    default: '#1f2937'
  },
  /** Grosor de la línea */
  penWidth: {
    type: Number,
    default: 2
  },
  /** Firma existente (base64) para mostrar */
  modelValue: {
    type: String,
    default: ''
  },
  /** Si está deshabilitado */
  disabled: {
    type: Boolean,
    default: false
  },
  /** Etiqueta del campo */
  label: {
    type: String,
    default: 'Firma'
  }
})

const emit = defineEmits(['update:modelValue', 'signed', 'cleared'])

const canvasRef = ref(null)
const signaturePad = ref(null)
const isEmpty = ref(true)
const isDrawing = ref(false)

// Inicializar SignaturePad cuando el componente se monta
onMounted(async () => {
  if (!canvasRef.value) return

  try {
    // Importar SignaturePad dinámicamente
    const SignaturePad = (await import('signature_pad')).default
    
    signaturePad.value = new SignaturePad(canvasRef.value, {
      penColor: props.penColor,
      minWidth: props.penWidth * 0.5,
      maxWidth: props.penWidth * 1.5,
      backgroundColor: 'rgba(255, 255, 255, 0)'
    })

    // Escuchar cambios
    signaturePad.value.addEventListener('endStroke', () => {
      isEmpty.value = signaturePad.value.isEmpty()
      if (!isEmpty.value) {
        const data = signaturePad.value.toDataURL('image/png')
        emit('update:modelValue', data)
        emit('signed', data)
      }
    })

    // Si hay una firma existente, cargarla
    if (props.modelValue) {
      await loadSignature(props.modelValue)
    }

    // Ajustar tamaño del canvas
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

  } catch (error) {
    console.error('Error al inicializar SignaturePad:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (signaturePad.value) {
    signaturePad.value.off()
  }
})

// Watch para cambios en modelValue externo
watch(() => props.modelValue, async (newVal) => {
  if (newVal && signaturePad.value) {
    await loadSignature(newVal)
  }
})

// Watch para cambios en disabled
watch(() => props.disabled, (disabled) => {
  if (signaturePad.value) {
    if (disabled) {
      signaturePad.value.off()
    } else {
      signaturePad.value.on()
    }
  }
})

const resizeCanvas = () => {
  if (!canvasRef.value || !signaturePad.value) return
  
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  const canvas = canvasRef.value
  const parent = canvas.parentElement
  
  canvas.width = parent.offsetWidth * ratio
  canvas.height = parent.offsetHeight * ratio
  canvas.getContext('2d').scale(ratio, ratio)
  
  // Mantener la firma si existe
  if (!signaturePad.value.isEmpty()) {
    const data = signaturePad.value.toData()
    signaturePad.value.clear()
    signaturePad.value.fromData(data)
  }
}

const loadSignature = async (dataUrl) => {
  if (!signaturePad.value) return
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      signaturePad.value.clear()
      const ctx = canvasRef.value.getContext('2d')
      ctx.drawImage(img, 0, 0)
      isEmpty.value = false
      resolve()
    }
    img.src = dataUrl
  })
}

const clear = () => {
  if (signaturePad.value && !props.disabled) {
    signaturePad.value.clear()
    isEmpty.value = true
    emit('update:modelValue', '')
    emit('cleared')
  }
}

const getSignature = () => {
  if (signaturePad.value && !signaturePad.value.isEmpty()) {
    return signaturePad.value.toDataURL('image/png')
  }
  return null
}

// Exponer métodos al componente padre
defineExpose({
  clear,
  getSignature,
  isEmpty: () => isEmpty.value
})
</script>

<template>
  <div class="signature-component">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-bold text-light-text dark:text-dark-text mb-2">
      {{ label }}
    </label>

    <!-- Canvas Container -->
    <div 
      class="signature-container relative rounded-xl border-2 border-dashed transition-colors"
      :class="[
        disabled 
          ? 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg cursor-not-allowed' 
          : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:border-primary dark:hover:border-primary',
        isEmpty ? '' : 'border-solid !border-primary'
      ]"
      :style="{ width, height }"
    >
      <!-- Canvas de firma -->
      <canvas
        ref="canvasRef"
        class="absolute inset-0 w-full h-full cursor-crosshair"
        :class="{ 'cursor-not-allowed': disabled }"
      />

      <!-- Placeholder -->
      <div 
        v-if="isEmpty && !disabled"
        class="absolute inset-0 flex items-center justify-center pointer-events-none text-light-muted dark:text-dark-muted"
      >
        <span class="text-sm">Firme aquí</span>
      </div>

      <!-- Badge de firmado -->
      <div 
        v-if="!isEmpty"
        class="absolute top-2 right-2 bg-success/20 text-success text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold"
      >
        <Check :size="12" />
        Firmado
      </div>
    </div>

    <!-- Acciones -->
    <div class="flex justify-end gap-2 mt-2" v-if="!disabled">
      <button
        type="button"
        @click="clear"
        class="btn-ghost text-sm"
        :disabled="isEmpty"
      >
        <Eraser :size="14" />
        Limpiar
      </button>
    </div>
  </div>
</template>

<style scoped>
.signature-container {
  touch-action: none;
}
</style>

