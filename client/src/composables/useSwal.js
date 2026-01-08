/**
 * @fileoverview Composable para SweetAlert2 con estilos del sistema de diseño.
 * Proporciona modales de confirmación premium con soporte para dark mode.
 */
import Swal from 'sweetalert2'

/**
 * Composable que retorna instancias de SweetAlert2 preconfiguradas.
 * Usa las clases de Tailwind del proyecto para mantener consistencia visual.
 * 
 * @returns {Object} Métodos para mostrar diferentes tipos de alertas.
 */
export function useSwal() {

  // Detectar si estamos en dark mode
  const isDarkMode = () => document.documentElement.classList.contains('dark')

  // Configuración base que respeta el tema
  const getBaseConfig = () => ({
    background: isDarkMode() ? '#2f363e' : '#ffffff',
    color: isDarkMode() ? '#e4e6eb' : '#3d4465',
    confirmButtonColor: '#13B497', // Primary (Teal)
    cancelButtonColor: isDarkMode() ? '#3e454d' : '#e5e7eb',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border',
      title: 'text-xl font-bold',
      htmlContainer: 'text-sm',
      confirmButton: 'btn-primary px-6 py-2.5 rounded-xl font-bold text-sm',
      cancelButton: 'btn-secondary px-6 py-2.5 rounded-xl font-bold text-sm',
      denyButton: 'btn-danger px-6 py-2.5 rounded-xl font-bold text-sm'
    },
    buttonsStyling: false, // Desactivar estilos por defecto para usar nuestras clases
    showClass: {
      popup: 'animate__animated animate__fadeIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut animate__faster'
    }
  })

  /**
   * Muestra un modal de confirmación para acciones de riesgo (ej: salir sin guardar).
   * 
   * @param {Object} options - Opciones del modal.
   * @param {string} options.title - Título del modal.
   * @param {string} options.text - Mensaje del modal.
   * @param {string} [options.confirmButtonText='Confirmar'] - Texto del botón de confirmar.
   * @param {string} [options.cancelButtonText='Cancelar'] - Texto del botón de cancelar.
   * @param {string} [options.icon='warning'] - Icono a mostrar (warning, error, success, info, question).
   * @returns {Promise} Promesa que resuelve con el resultado del modal.
   */
  const confirmWarning = (options) => {
    return Swal.fire({
      ...getBaseConfig(),
      title: options.title || '¿Estás seguro?',
      text: options.text || '',
      icon: options.icon || 'warning',
      iconColor: '#FFAB2D', // Warning color del sistema
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Confirmar',
      cancelButtonText: options.cancelButtonText || 'Cancelar',
      reverseButtons: true,
      customClass: {
        ...getBaseConfig().customClass,
        popup: `rounded-2xl shadow-2xl ${isDarkMode() ? 'border-dark-border' : 'border-gray-100'} border`,
        confirmButton: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-danger text-white shadow-lg hover:bg-red-700 transition-all ml-3',
        cancelButton: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm ${isDarkMode() ? 'bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} shadow-sm transition-all`
      }
    })
  }

  /**
   * Muestra un modal de confirmación para eliminación (acción destructiva).
   * 
   * @param {Object} options - Opciones del modal.
   * @param {string} options.title - Título del modal.
   * @param {string} options.text - Mensaje del modal.
   * @param {string} [options.confirmButtonText='Eliminar'] - Texto del botón de confirmar.
   * @returns {Promise} Promesa que resuelve con el resultado del modal.
   */
  const confirmDelete = (options) => {
    return Swal.fire({
      ...getBaseConfig(),
      title: options.title || '¿Eliminar?',
      text: options.text || 'Esta acción no se puede deshacer.',
      icon: 'error',
      iconColor: '#B03636', // Danger color del sistema
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Eliminar',
      cancelButtonText: options.cancelButtonText || 'Cancelar',
      reverseButtons: true,
      customClass: {
        ...getBaseConfig().customClass,
        popup: `rounded-2xl shadow-2xl ${isDarkMode() ? 'border-dark-border' : 'border-gray-100'} border`,
        confirmButton: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-danger text-white shadow-lg hover:bg-red-700 transition-all ml-3',
        cancelButton: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm ${isDarkMode() ? 'bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} shadow-sm transition-all`
      }
    })
  }

  /**
   * Muestra un modal de confirmación positiva (ej: guardar, enviar).
   * 
   * @param {Object} options - Opciones del modal.
   * @param {string} options.title - Título del modal.
   * @param {string} options.text - Mensaje del modal.
   * @param {string} [options.confirmButtonText='Confirmar'] - Texto del botón de confirmar.
   * @returns {Promise} Promesa que resuelve con el resultado del modal.
   */
  const confirmSuccess = (options) => {
    return Swal.fire({
      ...getBaseConfig(),
      title: options.title || '¿Confirmar?',
      text: options.text || '',
      icon: 'question',
      iconColor: '#13B497', // Primary color del sistema
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Confirmar',
      cancelButtonText: options.cancelButtonText || 'Cancelar',
      reverseButtons: true,
      customClass: {
        ...getBaseConfig().customClass,
        popup: `rounded-2xl shadow-2xl ${isDarkMode() ? 'border-dark-border' : 'border-gray-100'} border`,
        confirmButton: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white shadow-lg hover:bg-primary-hover transition-all ml-3',
        cancelButton: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm ${isDarkMode() ? 'bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} shadow-sm transition-all`
      }
    })
  }

  /**
   * Muestra una notificación tipo toast (pequeña, esquina).
   * 
   * @param {Object} options - Opciones del toast.
   * @param {string} options.title - Título/mensaje del toast.
   * @param {string} [options.icon='success'] - Icono (success, error, warning, info).
   */
  const toast = (options) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: isDarkMode() ? '#2f363e' : '#ffffff',
      color: isDarkMode() ? '#e4e6eb' : '#3d4465',
      customClass: {
        popup: 'rounded-xl shadow-lg border text-sm',
      },
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer
        toast.onmouseleave = Swal.resumeTimer
      }
    })

    return Toast.fire({
      icon: options.icon || 'success',
      title: options.title || ''
    })
  }

  return {
    confirmWarning,
    confirmDelete,
    confirmSuccess,
    toast,
    // Exponer Swal directamente para casos personalizados
    Swal
  }
}

export default useSwal
