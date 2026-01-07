<script setup>
/**
 * @fileoverview Vista de galería de Documentación.
 * Permite subir, visualizar y gestionar documentos (manuales, facturas, guías) asociados al inventario.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DocumentacionService from '../services/DocumentacionService'
import { Search, Plus, Eye, Pencil, Trash2, FileText, ExternalLink } from 'lucide-vue-next'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select' 

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const documentos = ref([])
const loading = ref(true)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    tipo_documento: { value: null, matchMode: FilterMatchMode.EQUALS }
})

const tipos = ref([
    { label: 'Manual', value: 'Manual' },
    { label: 'Guía', value: 'Guía' },
    { label: 'Política', value: 'Política' },
    { label: 'Factura', value: 'Factura' },
    { label: 'Otro', value: 'Otro' }
])

onMounted(async () => {
    loadDocumentos()
})

const loadDocumentos = async () => {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 600)) 
    try {
        documentos.value = await DocumentacionService.getAll()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los documentos', life: 3000 })
    } finally {
        loading.value = false
    }
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

const openNew = () => {
    router.push({ name: 'documentacion-nuevo' })
}

const editDocumento = (doc) => {
    router.push({ name: 'documentacion-editar', params: { id: doc.id } })
}

const deleteDocumento = (doc) => {
    confirm.require({
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar Documento',
        rejectClass: 'btn-secondary',
        acceptClass: 'btn-danger ml-2',
        accept: async () => {
            try {
                await DocumentacionService.delete(doc.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Documento eliminado', life: 3000 })
                loadDocumentos()
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el documento', life: 3000 })
            }
        }
    })
}

const openLink = (url) => {
    if (url) window.open(url, '_blank')
}

const skeletonRows = new Array(5).fill({})
</script>

<template>
    <div class="animate-fade-in-up">
        
        <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
            
            <!-- Toolbar -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                
                <!-- Filters -->
                <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                    <div class="relative w-full sm:w-72">
                         <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" :size="18" />
                         <InputText v-model="filters['global'].value" placeholder="Buscar documento..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
                    </div>

                    <Select v-model="filters['tipo_documento'].value" :options="tipos" optionLabel="label" optionValue="value" placeholder="Tipo" showClear class="w-full sm:w-40 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white custom-select" />
                </div>

                 <button class="btn-primary w-full md:w-auto" @click="openNew">
                    <Plus :size="18" />
                    <span>Registrar Documento</span>
                 </button>
            </div>

            <!-- Table -->
            <DataTable 
                :value="loading ? skeletonRows : documentos" 
                v-model:filters="filters" 
                dataKey="id"
                :paginator="true" 
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="{first}-{last} de {totalRecords}"
                class="custom-table"
                :rowHover="true"
                :loading="false"
                :globalFilterFields="['titulo', 'descripcion', 'tipo_documento']"
            >
                <template #empty>
                    <div class="flex flex-col items-center justify-center p-12 text-center">
                        <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                            <FileText class="text-gray-400 dark:text-gray-500" :size="40" />
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Galería Vacía</h3>
                        <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay documentación registrada.</p>
                        <Button label="Limpiar Filtros" text class="mt-4 !text-primary" @click="filters['global'].value = null; filters['tipo_documento'].value = null" />
                    </div>
                </template>

                <!-- ID -->
                <Column field="id" header="ID" sortable style="width: 5%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                         <span v-else class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
                    </template>
                </Column>

                <!-- Documents Info -->
                <Column field="titulo" header="Título/Descripción" sortable style="width: 35%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="10rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <div v-else>
                            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.titulo }}</div>
                            <span class="text-gray-500 dark:text-gray-400 text-xs truncate block max-w-xs">{{ data.descripcion }}</span>
                        </div>
                    </template>
                </Column>

                <!-- Type -->
                <Column field="tipo_documento" header="Tipo" sortable style="width: 15%">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <Tag v-else :value="data.tipo_documento" severity="info" class="!text-xs !font-bold px-3 py-1 !rounded-md" />
                    </template>
                </Column>

                <!-- Date -->
                <Column field="fecha_subida" header="Fecha" sortable style="width: 15%">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="6rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <span v-else class="text-gray-700 dark:text-gray-200 text-sm font-bold">{{ formatDate(data.fecha_subida) }}</span>
                    </template>
                </Column>

                <!-- Link Actions -->
                <Column header="Archivo" style="width: 10%; text-align: center">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border mx-auto" />
                        <button v-else class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-all mx-auto" @click="openLink(data.url_archivo)" title="Ver Archivo" v-if="data.url_archivo">
                            <ExternalLink :size="16" />
                        </button>
                    </template>
                </Column>

                <!-- Actions -->
                <Column header="Acciones" style="width: 12%; text-align: right">
                    <template #body="{ data }">
                         <div v-if="loading" class="flex gap-2 justify-start">
                             <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                             <Skeleton size="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                         </div>
                         <div v-else class="flex gap-1 justify-end">
                            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all" @click="editDocumento(data)" title="Editar">
                                <Pencil :size="16" />
                            </button>
                            <button class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center transition-all" @click="deleteDocumento(data)" title="Eliminar">
                                <Trash2 :size="16" />
                            </button>
                        </div>
                    </template>
                </Column>
            </DataTable>
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
