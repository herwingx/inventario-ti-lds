<script setup>
/**
 * @fileoverview Componente de Pad de Firma Digital Responsivo.
 * Ajusta automáticamente el buffer del canvas al tamaño del contenedor
 * y mapea las coordenadas para un dibujo preciso en móviles.
 */
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  height: { type: Number, default: 200 }
})

const emit = defineEmits(['save', 'clear'])

const containerRef = ref(null)
const canvasRef = ref(null)
let ctx = null
let drawing = false

// Ajustar el tamaño interno del canvas al tamaño visual real
const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas || !containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  // Establecer el buffer interno igual al tamaño visual para evitar distorsiones
  canvas.width = rect.width
  canvas.height = props.height
  
  // Re-inicializar contexto tras cambiar tamaño
  ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const getPos = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  // Coordenadas relativas al canvas
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startDrawing = (e) => {
  drawing = true
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

const draw = (e) => {
  if (!drawing) return
  // Evitar scroll mientras se firma
  if (e.cancelable) e.preventDefault()
  
  const pos = getPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

const stopDrawing = () => {
  drawing = false
}

const clear = () => {
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  emit('clear')
}

const save = () => {
  const dataURL = canvasRef.value.toDataURL('image/png')
  emit('save', dataURL)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('mouseup', stopDrawing)
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing)
  window.removeEventListener('resize', resizeCanvas)
})

defineExpose({ clear, save })
</script>

<template>
  <div ref="containerRef" class="signature-wrapper w-full">
    <div class="signature-container bg-white rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-inner">
      <canvas
        ref="canvasRef"
        class="w-full touch-none cursor-crosshair block"
        :style="{ height: height + 'px' }"
        @mousedown="startDrawing"
        @mousemove="draw"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
      ></canvas>
      
      <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700">
        <div class="flex items-center gap-2 text-gray-400">
          <i class="pi pi-pencil text-[10px]"></i>
          <span class="text-[10px] font-bold uppercase tracking-tighter italic">Área de Firma</span>
        </div>
        <div class="flex gap-2">
          <button class="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors" @click="clear">
            <i class="pi pi-trash"></i> Limpiar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signature-wrapper {
  max-width: 100%;
}
canvas {
  background-color: #ffffff;
  /* Evitar que el browser intente manejar gestos en el canvas */
  touch-action: none;
}
</style>
