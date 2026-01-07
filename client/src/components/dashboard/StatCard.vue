<script setup>
/**
 * @fileoverview Tarjeta de Estadística.
 * Muestra un valor numérico con título, subtítulo e icono, soportando animación de conteo.
 */
import { ref, watch, onMounted } from 'vue'
import Skeleton from 'primevue/skeleton'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  value: {
    type: [Number, String],
    default: 0
  },
  icon: {
    type: String,
    default: 'pi pi-chart-bar'
  },
  loading: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: 'primary' // primary, warning, success, info
  }
})

// Animación del número
const displayValue = ref(0)
const duration = 1500 // ms

function animateValue(start, end, duration) {
  const startTime = performance.now()
  
  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function para suavizar
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    displayValue.value = Math.floor(start + (end - start) * easeOutQuart)
    
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  
  requestAnimationFrame(update)
}

// Configuración de colores según el tipo
const colorConfig = {
  primary: {
    gradient: 'from-primary to-teal-600',
    bg: 'bg-primary/10',
    text: 'text-primary',
    iconBg: 'bg-gradient-to-br from-primary to-teal-600'
  },
  warning: {
    gradient: 'from-warning to-orange-500',
    bg: 'bg-warning/10',
    text: 'text-warning',
    iconBg: 'bg-gradient-to-br from-warning to-orange-500'
  },
  success: {
    gradient: 'from-success to-green-600',
    bg: 'bg-success/10',
    text: 'text-success',
    iconBg: 'bg-gradient-to-br from-success to-green-600'
  },
  info: {
    gradient: 'from-info to-blue-600',
    bg: 'bg-info/10',
    text: 'text-info',
    iconBg: 'bg-gradient-to-br from-info to-blue-600'
  }
}

const colors = colorConfig[props.color] || colorConfig.primary

watch(() => props.value, (newVal, oldVal) => {
  if (!props.loading && typeof newVal === 'number') {
    animateValue(oldVal || 0, newVal, duration)
  }
})

onMounted(() => {
  if (!props.loading && typeof props.value === 'number') {
    animateValue(0, props.value, duration)
  }
})
</script>

<template>
  <div class="stat-card-premium group">
    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div class="flex items-center gap-4">
        <Skeleton width="4rem" height="4rem" borderRadius="0.75rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
        <div class="flex-1">
          <Skeleton width="40%" height="2rem" class="mb-2 !bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton width="70%" height="1rem" class="mb-1 !bg-gray-200 dark:!bg-gray-700"></Skeleton>
          <Skeleton width="50%" height="0.75rem" class="!bg-gray-200 dark:!bg-gray-700"></Skeleton>
        </div>
      </div>
      <!-- Progress Bar Skeleton -->
      <Skeleton width="100%" height="0.375rem" borderRadius="1rem" class="mt-4 !bg-gray-200 dark:!bg-gray-700"></Skeleton>
    </template>

    <!-- Contenido real -->
    <template v-else>
      <div class="flex items-center gap-4">
        <!-- Icono con gradiente -->
        <div 
          :class="[colors.iconBg]"
          class="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
        >
          <i :class="icon" class="text-white text-2xl"></i>
        </div>

        <!-- Contenido -->
        <div class="flex-1">
          <h3 class="text-3xl font-bold text-light-text dark:text-dark-text mb-1 tabular-nums">
            {{ displayValue.toLocaleString() }}
          </h3>
          <p class="text-sm font-medium text-light-text dark:text-dark-text">
            {{ title }}
          </p>
          <small :class="colors.text" class="text-xs font-medium">
            {{ subtitle }}
          </small>
        </div>

        <!-- Mini indicador -->
        <div :class="[colors.bg]" class="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full">
          <i class="pi pi-arrow-up text-xs" :class="colors.text"></i>
          <span class="text-xs font-medium" :class="colors.text">+12%</span>
        </div>
      </div>

      <!-- Barra de progreso decorativa -->
      <div class="mt-4 w-full bg-light-border dark:bg-dark-border rounded-full h-1.5 overflow-hidden">
        <div 
          :class="['bg-gradient-to-r', colors.gradient]"
          class="h-full rounded-full transition-all duration-1000 ease-out"
          :style="{ width: '75%' }"
        ></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stat-card-premium {
  @apply bg-light-card dark:bg-dark-card;
  @apply border border-light-border dark:border-dark-border;
  @apply rounded-2xl p-5;
  @apply shadow-card hover:shadow-card-hover;
  @apply transition-all duration-300;
  @apply hover:-translate-y-1;
}
</style>
