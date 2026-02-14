import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Alias para imports más limpios
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    open: true,
    // Proxy para conectar con el backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // Base URL para producción (coincide con tu ruta /soporte/)
  base: '/soporte/',

  // Optimizaciones de build
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'primevue': ['primevue'],
          'vendor': ['vue', 'vue-router', 'pinia', 'axios']
        }
      }
    }
  }
})
