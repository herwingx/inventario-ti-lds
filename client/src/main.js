import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// PrimeVue Icons
import 'primeicons/primeicons.css'

const app = createApp(App)

// Pinia para el estado global
app.use(createPinia())

// Vue Router
app.use(router)

// PrimeVue con tema Aura personalizado
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false,
    }
  }
})

// Services
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app')
