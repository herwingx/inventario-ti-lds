import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  /**
   * Inicializa el tema basándose en localStorage o preferencia del sistema
   */
  function initTheme() {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // Detectar preferencia del sistema
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    applyTheme()
  }

  /**
   * Aplica el tema al documento
   */
  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * Alterna entre modo claro y oscuro
   */
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  /**
   * Establece un tema específico
   * @param {boolean} dark - true para modo oscuro
   */
  function setTheme(dark) {
    isDark.value = dark
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    applyTheme()
  }

  // Observar cambios en la preferencia del sistema
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        isDark.value = e.matches
        applyTheme()
      }
    })
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
    setTheme
  }
})
