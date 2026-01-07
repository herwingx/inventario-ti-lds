<script setup>
/**
 * @fileoverview Formulario de Documentación (Subir/Editar).
 * Facilita la carga de archivos o enlaces de documentación y su clasificación.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DocumentacionService from '../services/DocumentacionService'
import CatalogosService from '../services/CatalogosService'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown' // Select
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Documento #${route.params.id}` : 'Registrar Nuevo Documento')
const loading = ref(false)
const saving = ref(false)

const form = ref({
    titulo: '',
    descripcion: '',
    tipo_documento: null,
    url_archivo: '',
    id_status: null
})

const tipos = ref([
    { label: 'Manual de Usuario', value: 'Manual' },
    { label: 'Guía Técnica', value: 'Guía' },
    { label: 'Política / Normativa', value: 'Política' },
    { label: 'Factura / Comprobante', value: 'Factura' },
    { label: 'Otro', value: 'Otro' }
])

const statuses = ref([])

onMounted(async () => {
    loading.value = true
    try {
        statuses.value = await CatalogosService.getStatuses()
        
        if (isEditing.value) {
            await loadDocumento(route.params.id)
        } else {
             const activo = statuses.value.find(s => s.nombre_status.includes('ACTIVO'))
             if (activo) form.value.id_status = activo.id
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 })
    } finally {
        loading.value = false
    }
})

const loadDocumento = async (id) => {
    try {
        const data = await DocumentacionService.getById(id)
        form.value = { ...data }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Documento no encontrado', life: 3000 })
        router.push({ name: 'documentacion' })
    }
}

const save = async () => {
    if (!form.value.titulo) return showWarn('El título es obligatorio')
    if (!form.value.tipo_documento) return showWarn('El tipo de documento es obligatorio')
    if (!form.value.url_archivo) return showWarn('El enlace al archivo es obligatorio')

    saving.value = true
    try {
        if (isEditing.value) {
            await DocumentacionService.update(route.params.id, form.value)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Documento actualizado', life: 3000 })
        } else {
            await DocumentacionService.create(form.value)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Documento registrado', life: 3000 })
        }
        
        setTimeout(() => router.push({ name: 'documentacion' }), 1000)
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar', life: 3000 })
    } finally {
        saving.value = false
    }
}

const showWarn = (msg) => {
    toast.add({ severity: 'warn', summary: 'Atención', detail: msg, life: 3000 })
}

const goBack = () => {
    confirm.require({
        message: '¿Salir sin guardar?',
        header: 'Confirmar Salida',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Continuar',
        acceptLabel: 'Salir',
        acceptClass: 'p-button-warning !bg-orange-500 !border-none',
        accept: () => router.push({ name: 'documentacion' })
    })
}
</script>

<template>
    <div class="animate-fade-in-up max-w-4xl mx-auto">
        
        <!-- Loading -->
        <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
            <Skeleton width="10rem" height="2rem" class="mb-4" />
            <Skeleton height="10rem" />
        </div>

        <!-- Form -->
        <div v-else class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 dark:border-dark-border">
            
            <div class="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-dark-border pb-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestión de base de conocimiento y archivos.</p>
                </div>
                <Button icon="pi pi-times" text rounded severity="secondary" @click="goBack" class="!w-10 !h-10 hover:bg-gray-100 dark:hover:bg-gray-800" />
            </div>

            <Fluid>
                <form @submit.prevent="save" class="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-8">
                    
                    <div class="col-span-1 md:col-span-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Título del Documento *</label>
                        <InputText v-model="form.titulo" class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1" placeholder="Ej. Manual de Configuración VPN" />
                    </div>

                    <div class="col-span-1">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Tipo *</label>
                        <Dropdown v-model="form.tipo_documento" :options="tipos" optionLabel="label" optionValue="value" placeholder="Seleccione Tipo" class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1" />
                    </div>

                    <div class="col-span-1">
                         <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Estado</label>
                         <Dropdown v-model="form.id_status" :options="statuses" optionLabel="nombre_status" optionValue="id" placeholder="Estado" class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1" />
                    </div>

                    <div class="col-span-1 md:col-span-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Enlace o Ruta del Archivo *</label>
                        <div class="flex gap-2 mt-1">
                            <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">Valid URL</span>
                            <InputText v-model="form.url_archivo" class="!w-full !bg-gray-50 dark:!bg-dark-bg !rounded-l-none" placeholder="https://drive.google.com/..." />
                        </div>
                        <small class="text-gray-500">Pegue el enlace compartido (Google Drive, SharePoint, etc).</small>
                    </div>

                    <div class="col-span-1 md:col-span-2">
                        <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Descripción / Resumen</label>
                        <Textarea v-model="form.descripcion" rows="4" class="!w-full !bg-gray-50 dark:!bg-dark-bg mt-1" placeholder="Breve descripción del contenido..." />
                    </div>

                </form>
            </Fluid>

            <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="goBack" class="!px-6" />
                <Button label="Guardar Documento" icon="pi pi-save" :loading="saving" @click="save" class="!bg-primary !border-none hover:!bg-primary-hover !px-8 !py-3 !rounded-lg !font-bold" />
            </div>

        </div>
    </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
