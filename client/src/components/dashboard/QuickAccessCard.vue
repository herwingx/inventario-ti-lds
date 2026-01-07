<script setup>
/**
 * @fileoverview Tarjeta de Acceso Rápido.
 * Componente visual para navegar rápidamente a secciones importantes del dashboard.
 */
import { ArrowRight, Box } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: [String, Object, Function],
    default: Box
  },
  color: {
    type: String,
    default: 'blue' // blue, green, teal, orange, red, purple
  }
})

defineEmits(['click'])

// Configuración de colores
const colorConfig = {
  blue: 'from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800',
  green: 'from-green-500 to-green-700 hover:from-green-600 hover:to-green-800',
  teal: 'from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800',
  orange: 'from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700',
  red: 'from-red-500 to-red-700 hover:from-red-600 hover:to-red-800',
  purple: 'from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800'
}
</script>

<template>
  <div 
    class="quick-access-premium group"
    :class="['bg-gradient-to-br', colorConfig[color] || colorConfig.blue]"
    @click="$emit('click')"
  >
    <!-- Icono grande de fondo -->
    <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
      <component :is="icon" :size="80" />
    </div>

    <!-- Contenido -->
    <div class="relative z-10">
      <!-- Icono pequeño -->
      <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <component :is="icon" class="text-white" :size="24" stroke-width="2" />
      </div>

      <!-- Texto -->
      <h4 class="text-white font-bold text-lg mb-1">
        {{ title }}
      </h4>
      <p class="text-white/80 text-sm line-clamp-2">
        {{ description }}
      </p>
    </div>

    <!-- Flecha indicadora (esquina superior derecha) -->
    <div class="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
      <ArrowRight class="text-white" :size="16" />
    </div>
  </div>
</template>

<style scoped>
.quick-access-premium {
  @apply relative overflow-hidden;
  @apply rounded-2xl p-5;
  @apply cursor-pointer;
  @apply min-h-[140px];
  @apply shadow-card hover:shadow-card-hover;
  @apply transition-all duration-300;
  @apply hover:-translate-y-1;
}
</style>
