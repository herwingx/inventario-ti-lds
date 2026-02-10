<script setup>
/**
 * @fileoverview Vista de Detalle de Equipo.
 * Provee una vista exhaustiva de las especificaciones de hardware, historial de asignaciones y mantenimientos de un equipo.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '../composables/useSwal'
import EquiposService from '../services/EquiposService'
import { getStatusSeverity } from '../utils/status'
import QrcodeVue from 'qrcode.vue'

// Componentes PrimeVue
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const route = useRoute()
const router = useRouter()
const { confirmDelete, success: toastSuccess, error: toastError, info: toastInfo } = useSwal()

const equipo = ref(null)
const loading = ref(true)

// Construir la URL pública del equipo para el QR
const publicUrl = computed(() => {
  if (!equipo.value?.qr_token) return ''
  // Forzamos el uso de la ubicación actual (ya sea IP o Dominio)
  const currentHost = window.location.host // Esto incluye el puerto (ej: 192.168.0.252:5173)
  const protocol = window.location.protocol
  return `${protocol}//${currentHost}/soporte/q/${equipo.value.qr_token}`
})

// Función para imprimir etiqueta de activo
const printLabel = () => {
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  const closeScript = '</' + 'script>'
  
  // Construir URL base de soporte (ej: erp.linea-digital.com/soporte/ayuda)
  // Eliminamos el protocolo http/https para que sea más corta y legible en la etiqueta
  const cleanOrigin = window.location.origin.replace(/^https?:\/\//, '')
  const supportUrl = `${cleanOrigin}/soporte/ayuda`
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Etiqueta de Activo - ${equipo.value.numero_serie}</title>
        <style>
          body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center; color: #000; }
          .label-container { border: 2px solid #000; padding: 15px; border-radius: 12px; width: 260px; background: white; }
          .header { border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px; }
          .company-name { font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .qr-container { margin: 10px 0; display: flex; justify-content: center; }
          .support-info { background: #f4f4f4; padding: 8px; border-radius: 6px; margin-bottom: 10px; }
          .code-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
          .token-code { font-family: monospace; font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #000; }
          .manual-link { font-size: 10px; font-weight: bold; color: #444; margin-top: 4px; border-top: 1px dashed #ccc; pt: 4px; }
          .footer-info { display: flex; justify-content: space-between; font-size: 9px; color: #333; font-weight: 600; padding-top: 5px; }
          .sn-box { text-align: left; }
          .type-box { text-align: right; text-transform: uppercase; }
          @media print { body { padding: 0; } .label-container { border: 1.5px solid #000; } }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="company-name">Línea Digital Del Sureste</div>
          </div>
          
          <div class="qr-container" id="qr-target"></div>
          
          <div class="support-info">
            <div class="code-label">Si el QR no funciona:</div>
            <div style="font-size: 10px; margin-bottom: 5px; color: #444;">
              1. Entre a: <strong>${supportUrl}</strong>
            </div>
            <div style="font-size: 10px; color: #444;">
              2. Escriba este código de ayuda:
            </div>
            <div class="token-code" style="margin-top: 2px;">${equipo.value.qr_token.toUpperCase()}</div>
          </div>

          <div class="footer-info">
            <div class="sn-box">SN: ${equipo.value.numero_serie}</div>
            <div class="type-box">${equipo.value.nombre_tipo_equipo}</div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js">${closeScript}
        <script>
          var qr = qrcode(0, 'M');
          qr.addData('${publicUrl.value}');
          qr.make();
          document.getElementById('qr-target').innerHTML = qr.createSvgTag(4);
          window.onload = function() { 
            setTimeout(function() {
              window.print(); 
              window.close(); 
            }, 500);
          }
        ${closeScript}
      </body>
    </html>
  `)
  printWindow.document.close()
}

// Cargar datos del equipo
const loadEquipo = async () => {
  loading.value = true
  try {
    const id = route.params.id
    equipo.value = await EquiposService.getById(id)
  } catch (error) {
    console.error('Error al cargar equipo:', error)
    toastError('No se pudo cargar el equipo')
    router.push({ name: 'equipos' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEquipo()
})

const getSeverity = getStatusSeverity

const goBack = () => {
  router.push({ name: 'equipos' })
}

const editEquipo = () => {
  router.push({ name: 'equipos-editar', params: { id: equipo.value.id } })
}

const confirmDeleteEquipo = async () => {
  const result = await confirmDelete({
    title: 'Confirmar Eliminación',
    text: `¿Estás seguro de que deseas eliminar permanentemente ${equipo.value.nombre_equipo}? Esta acción no se puede deshacer.`,
    confirmButtonText: 'Eliminar Equipo',
    cancelButtonText: 'Cancelar'
  })
  
  if (result.isConfirmed) {
    try {
      await EquiposService.delete(equipo.value.id)
      toastSuccess(`Equipo ${equipo.value.nombre_equipo} eliminado correctamente`)
      router.push({ name: 'equipos' })
    } catch (error) {
      console.error('Error al eliminar equipo:', error)
      toastError('No se pudo eliminar el equipo')
    }
  } else {
    toastInfo('Operación cancelada')
  }
}

const infoSections = computed(() => {
  if (!equipo.value) return []
  
  return [
    {
      title: 'Información General',
      icon: 'pi-info-circle',
      color: 'text-blue-500',
      fields: [
        { label: 'ID', value: `#${equipo.value.id}`, mono: true },
        { label: 'Nombre del Equipo', value: equipo.value.nombre_equipo },
        { label: 'Número de Serie', value: equipo.value.numero_serie, mono: true },
        { label: 'Tipo de Equipo', value: equipo.value.nombre_tipo_equipo },
        { label: 'Estado', value: equipo.value.status_nombre, isTag: true }
      ]
    },
    {
      title: 'Especificaciones',
      icon: 'pi-cog',
      color: 'text-purple-500',
      fields: [
        { label: 'Marca', value: equipo.value.marca },
        { label: 'Modelo', value: equipo.value.modelo },
        { label: 'Procesador', value: equipo.value.procesador || 'N/A' },
        { label: 'RAM', value: equipo.value.ram || 'N/A' },
        { label: 'Almacenamiento', value: equipo.value.almacenamiento || 'N/A' }
      ]
    },
    {
      title: 'Ubicación',
      icon: 'pi-map-marker',
      color: 'text-green-500',
      fields: [
        { label: 'Empresa', value: equipo.value.nombre_empresa },
        { label: 'Sucursal', value: equipo.value.nombre_sucursal_actual },
        { label: 'Área', value: equipo.value.nombre_area || 'N/A' }
      ]
    },
    {
      title: 'Mantenimiento Preventivo',
      icon: 'pi-calendar',
      color: 'text-cyan-500',
      fields: [
        { label: 'Frecuencia', value: equipo.value.frecuencia_mantenimiento_meses ? `${equipo.value.frecuencia_mantenimiento_meses} meses` : 'No definida' },
        { 
            label: 'Último Mantenimiento', 
            value: equipo.value.ultima_fecha_mantenimiento ? new Date(equipo.value.ultima_fecha_mantenimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Ninguno registrado' 
        },
        { 
            label: 'Próximo Mantenimiento', 
            value: equipo.value.proxima_fecha_mantenimiento ? new Date(equipo.value.proxima_fecha_mantenimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No programado',
            isWarning: equipo.value.proxima_fecha_mantenimiento && new Date(equipo.value.proxima_fecha_mantenimiento) < new Date()
        }
      ]
    },
    {
      title: 'Información Adicional',
      icon: 'pi-file',
      color: 'text-orange-500',
      fields: [
        { label: 'Observaciones', value: equipo.value.observaciones || 'Sin observaciones', fullWidth: true }
      ]
    }
  ]
})
</script>

<template>
  <div class="animate-fade-in-up">
    <!-- Header con acciones -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <Button 
          icon="pi pi-arrow-left" 
          text 
          rounded 
          class="!text-gray-600 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-dark-border"
          @click="goBack"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            <Skeleton v-if="loading" width="15rem" height="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>{{ equipo?.nombre_equipo }}</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
            <span v-else>Detalles del equipo</span>
          </p>
        </div>
      </div>

      <div v-if="!loading" class="flex gap-2">
        <Button 
          label="Editar" 
          icon="pi pi-pencil" 
          class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="editEquipo"
        />
        <Button 
          label="Eliminar" 
          icon="pi pi-trash" 
          severity="danger"
          class="!bg-red-500 !border-none hover:!bg-red-600 !font-bold !px-5 !py-2.5 !rounded-lg !text-white shadow-lg"
          @click="confirmDeleteEquipo"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Columna Izquierda: Información (2/3 de ancho) -->
      <div class="lg:col-span-2 space-y-6">
        <div 
          v-for="(section, index) in infoSections" 
          :key="index"
          class="detail-card"
        >
          <!-- Título de la sección -->
          <div class="detail-section-header">
            <div :class="['detail-section-icon', section.color]">
              <i :class="['pi', section.icon, section.color, 'text-lg']"></i>
            </div>
            <h2 class="detail-section-title">{{ section.title }}</h2>
          </div>

          <!-- Campos -->
          <div v-if="loading" class="space-y-6">
            <div v-for="i in 3" :key="i" class="flex justify-between">
              <Skeleton width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
              <Skeleton width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
            </div>
          </div>

          <div v-else class="space-y-6">
            <div 
              v-for="(field, fieldIndex) in section.fields" 
              :key="fieldIndex"
              :class="[
                'flex',
                field.fullWidth ? 'flex-col gap-2' : 'justify-between items-center',
              ]"
            >
              <span class="detail-label">
                {{ field.label }}
              </span>
              
              <!-- Tag para estado -->
              <Tag 
                v-if="field.isTag" 
                :value="field.value" 
                :severity="getSeverity(field.value)"
                class="!text-[10px] !font-bold px-3 py-1.5 !rounded-md tracking-wide"
              />
              
              <!-- Texto normal -->
              <span 
                v-else
                :class="[
                  field.mono ? 'detail-value-mono' : 'detail-value',
                  field.fullWidth ? 'detail-content-box' : '',
                  field.isWarning ? 'text-red-500 font-bold animate-pulse' : ''
                ]"
              >
                {{ field.value }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: QR y Soporte (1/3 de ancho) -->
      <div class="space-y-6">
        <!-- Card de Soporte QR -->
        <div class="detail-card !bg-primary/5 border-primary/20">
          <div class="detail-section-header border-primary/10">
            <div class="detail-section-icon text-primary bg-primary/10">
              <i class="pi pi-qrcode text-lg"></i>
            </div>
            <h2 class="detail-section-title">Ecosistema de Soporte</h2>
          </div>

          <div class="flex flex-col items-center py-6 text-center">
            <!-- QR Dinámico -->
            <div class="bg-white p-4 rounded-2xl shadow-xl mb-6 border border-gray-100">
              <Skeleton v-if="loading" width="150px" height="150px" />
              <qrcode-vue 
                v-else-if="equipo?.qr_token" 
                :value="publicUrl" 
                :size="150" 
                level="M" 
                render-as="svg"
              />
              <div v-else class="w-[150px] h-[150px] flex items-center justify-center text-gray-300 italic text-xs">
                No tiene token QR
              </div>
            </div>

            <h3 class="font-bold text-gray-900 dark:text-white mb-2">Escaneo para Reportes</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 px-4 mb-6 leading-relaxed">
              Pegue esta etiqueta en el equipo. Los empleados podrán reportar fallas y consultar el estado de soporte sin iniciar sesión.
            </p>

            <div class="flex flex-col w-full gap-3">
              <Button 
                label="Imprimir Etiqueta de Activo" 
                icon="pi pi-print" 
                class="!w-full !rounded-xl shadow-md"
                @click="printLabel"
                :disabled="!equipo?.qr_token"
              />
              <a 
                v-if="equipo?.qr_token"
                :href="publicUrl" 
                target="_blank"
                class="text-xs text-primary font-bold hover:underline flex items-center justify-center gap-2 py-2"
              >
                <i class="pi pi-external-link"></i>
                Ver Vista del Empleado
              </a>
            </div>
          </div>
        </div>

        <!-- Card de Estado de Red -->
        <div class="detail-card">
          <div class="detail-section-header">
            <div class="detail-section-icon text-emerald-500">
              <i class="pi pi-wifi text-lg"></i>
            </div>
            <h2 class="detail-section-title">Conectividad de Red</h2>
          </div>
          <div class="py-4">
            <div class="flex flex-col gap-4">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400 uppercase font-bold">Dirección IP</span>
                <span class="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">
                  {{ equipo?.id_asignado_a ? (equipo.ip_direccion || 'Asignada via Empleado') : 'Sin asignar' }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400 uppercase font-bold">MAC Address</span>
                <span class="font-mono text-xs text-gray-500">
                  {{ equipo?.mac_address || 'No registrada' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>