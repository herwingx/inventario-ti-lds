/**
 * @fileoverview Punto de entrada de la aplicación Vue.js.
 * Inicializa la aplicación, configura Pinia, Router y PrimeVue con Tailwind preset.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// PrimeVue Tailwind Preset
import TailwindPreset from './presets/tailwind'

// PrimeVue Icons
import 'primeicons/primeicons.css'

const app = createApp(App)

// Pinia para el estado global
app.use(createPinia())

// Vue Router
app.use(router)

// PrimeVue con Tailwind PassThrough preset
app.use(PrimeVue, {
  unstyled: true,
  pt: TailwindPreset
})

// Services
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app')
