<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import NotasService from '../services/NotasService'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const notas = ref([])
const loading = ref(true)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

onMounted(async () => {
    loadNotas()
})

const loadNotas = async () => {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 600)) 
    try {
        notas.value = await NotasService.getAll()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las notas', life: 3000 })
    } finally {
        loading.value = false
    }
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const openNew = () => {
    router.push({ name: 'notas-nuevo' })
}

const editNota = (nota) => {
    router.push({ name: 'notas-editar', params: { id: nota.id } })
}

const deleteNota = (nota) => {
    confirm.require({
        message: '¿Está seguro de eliminar esta nota?',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger !bg-red-500 !border-none hover:!bg-red-600',
        accept: async () => {
            try {
                await NotasService.delete(nota.id)
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Nota eliminada', life: 3000 })
                loadNotas()
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la nota', life: 3000 })
            }
        }
    })
}

const truncate = (text, length) => {
    if (!text) return ''
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}

const skeletonRows = new Array(5).fill({})
</script>

<template>
    <div class="animate-fade-in-up">
        
        <div class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300">
            
            <!-- Toolbar -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                
                <!-- Search -->
                <div class="relative w-full md:w-96">
                        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
                        <InputText v-model="filters['global'].value" placeholder="Buscar en notas..." class="w-full !pl-10 !bg-gray-50 dark:!bg-dark-bg !border-gray-300 dark:!border-dark-border !text-gray-900 dark:!text-white !py-2.5 !rounded-lg focus:!border-primary" />
                </div>

                 <Button label="Crear Nota" icon="pi pi-plus" class="!bg-primary !border-none hover:!bg-primary-hover !font-bold !px-6 !py-2.5 !rounded-lg !text-white !text-sm shadow-lg shadow-emerald-900/20 w-full md:w-auto" @click="openNew" />
            </div>

            <!-- Table -->
            <DataTable 
                :value="loading ? skeletonRows : notas" 
                v-model:filters="filters" 
                dataKey="id"
                :paginator="true" 
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="{first}-{last} de {totalRecords}"
                class="custom-table"
                :rowHover="true"
                :loading="false"
                :globalFilterFields="['titulo', 'contenido', 'equipo_numero_serie', 'usuario_creador']"
            >
                <template #empty>
                    <div class="flex flex-col items-center justify-center p-12 text-center">
                        <div class="w-24 h-24 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4 transition-colors">
                            <i class="pi pi-book text-3xl text-gray-400 dark:text-gray-500"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-300 mb-1">Sin Notas</h3>
                        <p class="text-gray-500 text-sm max-w-xs mx-auto">No hay notas registradas aún.</p>
                    </div>
                </template>

                <!-- ID -->
                <Column field="id" header="ID" sortable style="width: 5%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="2rem" class="!bg-gray-200 dark:!bg-dark-border" />
                         <span v-else class="text-gray-700 dark:text-gray-200 font-mono text-sm font-bold">#{{ data.id }}</span>
                    </template>
                </Column>

                <!-- Contenido -->
                <Column field="titulo" header="Nota" sortable style="width: 40%">
                    <template #body="{ data }">
                         <Skeleton v-if="loading" width="15rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <div v-else>
                            <div class="text-gray-900 dark:text-white font-bold text-base">{{ data.titulo }}</div>
                            <span class="text-gray-500 dark:text-gray-400 text-sm block mt-1">{{ truncate(data.contenido, 100) }}</span>
                        </div>
                    </template>
                </Column>

                <!-- Relacionado -->
                <Column header="Relacionado a" style="width: 20%">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="8rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <div v-else class="flex flex-col gap-1">
                            <Tag v-if="data.equipo_numero_serie" icon="pi pi-desktop" :value="'Equipo: ' + data.equipo_numero_serie" severity="info" class="!text-xs w-fit" />
                            <Tag v-if="data.mantenimiento_fecha_inicio" icon="pi pi-cog" :value="'Mto: ' + formatDate(data.mantenimiento_fecha_inicio)" severity="warn" class="!text-xs w-fit" />
                            <span v-if="!data.equipo_numero_serie && !data.mantenimiento_fecha_inicio" class="text-gray-400 text-xs italic">General</span>
                        </div>
                    </template>
                </Column>

                <!-- Info -->
                <Column header="Detalles" sortable field="fecha_registro" style="width: 20%">
                    <template #body="{ data }">
                        <Skeleton v-if="loading" width="8rem" class="!bg-gray-200 dark:!bg-dark-border" />
                        <div v-else>
                             <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <i class="pi pi-user"></i> {{ data.usuario_creador || 'Sistema' }}
                             </div>
                             <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <i class="pi pi-calendar"></i> {{ formatDate(data.fecha_registro) }}
                             </div>
                        </div>
                    </template>
                </Column>

                <!-- Actions -->
                <Column header="Acciones" style="width: 15%; text-align: right">
                    <template #body="{ data }">
                         <div v-if="loading" class="flex gap-2 justify-start">
                             <Skeleton size="2rem" />
                             <Skeleton size="2rem" />
                         </div>
                         <div v-else class="flex gap-1 justify-start">
                            <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-border text-primary flex items-center justify-center transition-all border border-gray-200 dark:border-transparent" @click="editNota(data)" title="Editar">
                                <i class="pi pi-pencil text-xs"></i>
                            </button>
                            <button class="w-7 h-7 rounded bg-gray-100 dark:bg-dark-bg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center transition-all border border-gray-200 dark:border-transparent hover:border-red-500" @click="deleteNota(data)" title="Eliminar">
                                <i class="pi pi-trash text-xs"></i>
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
