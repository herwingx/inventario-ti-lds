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

// PrimeVue con Tailwind PassThrough preset y locale en español
app.use(PrimeVue, {
  unstyled: true,
  pt: TailwindPreset,
  locale: {
    // Password strength labels
    weak: 'Débil',
    medium: 'Media',
    strong: 'Fuerte',
    passwordPrompt: 'Ingresa una contraseña',
    // Otros textos comunes
    accept: 'Aceptar',
    reject: 'Cancelar',
    choose: 'Elegir',
    upload: 'Subir',
    cancel: 'Cancelar',
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    today: 'Hoy',
    clear: 'Limpiar',
    firstDayOfWeek: 1,
    dateFormat: 'dd/mm/yy',
    emptyFilterMessage: 'Sin resultados',
    emptyMessage: 'No hay opciones disponibles',
    emptySearchMessage: 'Sin resultados',
    emptySelectionMessage: 'Sin selección',
    searchMessage: '{0} resultados disponibles',
    selectionMessage: '{0} elementos seleccionados',
    aria: {
      trueLabel: 'Verdadero',
      falseLabel: 'Falso',
      nullLabel: 'Sin selección',
      star: '1 estrella',
      stars: '{star} estrellas',
      selectAll: 'Todos los elementos seleccionados',
      unselectAll: 'Todos los elementos deseleccionados',
      close: 'Cerrar',
      previous: 'Anterior',
      next: 'Siguiente',
      navigation: 'Navegación',
      scrollTop: 'Ir arriba',
      moveTop: 'Mover al inicio',
      moveUp: 'Mover arriba',
      moveDown: 'Mover abajo',
      moveBottom: 'Mover al final',
      moveToTarget: 'Mover al destino',
      moveToSource: 'Mover al origen',
      moveAllToTarget: 'Mover todo al destino',
      moveAllToSource: 'Mover todo al origen',
      pageLabel: 'Página {page}',
      firstPageLabel: 'Primera página',
      lastPageLabel: 'Última página',
      nextPageLabel: 'Siguiente página',
      prevPageLabel: 'Página anterior',
      rowsPerPageLabel: 'Filas por página'
    }
  }
})

// Services
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app')
