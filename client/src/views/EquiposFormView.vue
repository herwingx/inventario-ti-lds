<script setup>
/**
 * @fileoverview Formulario de Equipo (Crear/Editar).
 * Formulario complejo para registrar hardware, especificando marca, modelo, serie y características técnicas.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import EquiposService from '../services/EquiposService'
import CatalogosService from '../services/CatalogosService'

// Componentes PrimeVue
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Skeleton from 'primevue/skeleton'
import Fluid from 'primevue/fluid'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Estados de Carga
const loading = ref(false)
const submitting = ref(false)

// Datos de Catálogos
const tiposEquipo = ref([])
const sucursales = ref([])
const statuses = ref([])

// Listas estáticas para "Otros"
const brandsList = ['DELL', 'HP', 'LENOVO', 'ASUS', 'ACER', 'APPLE', 'MSI', 'SAMSUNG', 'LG', 'OTRO']
const ramList = ['4GB DDR3', '4GB DDR4', '8GB DDR3', '8GB DDR4', '16GB DDR3', '16GB DDR4', '32GB DDR4', '64GB DDR4', '8GB DDR5', '16GB DDR5', '32GB DDR5', 'OTRO']
const diskList = ['120GB SSD', '240GB SSD', '256GB SSD', '480GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '500GB HDD', '1TB HDD', '2TB HDD', '4TB HDD', 'OTRO']
const osList = ['WINDOWS 10 HOME', 'WINDOWS 10 PRO', 'WINDOWS 11 HOME', 'WINDOWS 11 PRO', 'WINDOWS SERVER 2019', 'WINDOWS SERVER 2022', 'UBUNTU 20.04 LTS', 'UBUNTU 22.04 LTS', 'CENTOS 7', 'CENTOS 8', 'MACOS MONTEREY', 'MACOS VENTURA', 'SIN SO', 'OTRO']

// Modelo del Formulario
const form = ref({
    numero_serie: '',
    nombre_equipo: '', // Alias
    id_tipo_equipo: null,
    id_sucursal_actual: null,
    marca: '',
    marca_otro: '',
    modelo: '',
    procesador: '',
    ram: '',
    ram_otro: '',
    disco_duro: '',
    disco_duro_otro: '',
    sistema_operativo: '',
    sistema_operativo_otro: '',
    mac_address: '',
    fecha_compra: null,
    id_status: null,
    otras_caracteristicas: ''
})

const isEditing = computed(() => !!route.params.id)
const formTitle = computed(() => isEditing.value ? `Editar Equipo #${route.params.id}` : 'Registrar Nuevo Equipo')

// Validaciones simples
const errors = ref({})

// Lógica de Estado Protegido
const isStatusDisabled = ref(false)
const statusHelpText = ref('')

onMounted(async () => {
    loading.value = true
    try {
        // Cargar catálogos en paralelo
        const [tiposRes, sucursalesRes, statusRes] = await Promise.all([
            CatalogosService.getTiposEquipo(),
            CatalogosService.getSucursales(),
            CatalogosService.getStatuses()
        ])
        
        tiposEquipo.value = tiposRes
        sucursales.value = sucursalesRes
        statuses.value = statusRes

        // Si es edición, cargar datos del equipo
        if (isEditing.value) {
            const equipoData = await EquiposService.getById(route.params.id)
            populateForm(equipoData)
        } else {
            // Predetectar estado DISPONIBLE si existe
            const defaultStatus = statuses.value.find(s => s.nombre_status === 'DISPONIBLE')
            if (defaultStatus) form.value.id_status = defaultStatus.id
        }
    } catch (error) {
        console.error('Error cargando datos:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos necesarios.', life: 3000 })
    } finally {
        loading.value = false
    }
})

const populateForm = (data) => {
    // Mapeo directo de campos simples
    form.value.numero_serie = data.numero_serie
    form.value.nombre_equipo = data.nombre_equipo
    form.value.id_tipo_equipo = data.id_tipo_equipo
    form.value.id_sucursal_actual = data.id_sucursal_actual
    form.value.modelo = data.modelo
    form.value.procesador = data.procesador
    form.value.mac_address = data.mac_address
    form.value.fecha_compra = data.fecha_compra ? new Date(data.fecha_compra) : null
    form.value.id_status = data.id_status
    form.value.otras_caracteristicas = data.otras_caracteristicas

    // Lógica para campos con "OTRO"
    handlePopulateSelectWithOther('marca', data.marca, brandsList)
    handlePopulateSelectWithOther('ram', data.ram, ramList)
    handlePopulateSelectWithOther('disco_duro', data.disco_duro, diskList)
    handlePopulateSelectWithOther('sistema_operativo', data.sistema_operativo, osList)

    // Validar estado protegido
    const STATUS_ASIGNADO = 4
    const STATUS_EN_MANTENIMIENTO = 3
    if (data.id_status === STATUS_ASIGNADO) {
        isStatusDisabled.value = true
        statusHelpText.value = 'El equipo está Asignado. Libérelo desde Asignaciones.'
    } else if (data.id_status === STATUS_EN_MANTENIMIENTO) {
        isStatusDisabled.value = true
        statusHelpText.value = 'El equipo está en Mantenimiento. Finalice el mantenimiento para editar.'
    }
}

const handlePopulateSelectWithOther = (fieldName, value, list) => {
    if (!value) return
    if (list.includes(value)) {
        form.value[fieldName] = value
    } else {
        form.value[fieldName] = 'OTRO'
        form.value[`${fieldName}_otro`] = value
    }
}

// Helpers Texto
const toUpperCase = (field) => {
    if (form.value[field]) {
        form.value[field] = form.value[field].toUpperCase()
    }
}

// Submit
const handleSubmit = async () => {
    // Validaciones
    errors.value = {}
    if (!form.value.numero_serie) errors.value.numero_serie = 'El número de serie es obligatorio'
    if (!form.value.id_tipo_equipo) errors.value.id_tipo_equipo = 'El tipo es obligatorio'
    if (!form.value.id_sucursal_actual) errors.value.id_sucursal_actual = 'La sucursal es obligatoria'
    if (!form.value.id_status) errors.value.id_status = 'El estado es obligatorio'

    if (Object.keys(errors.value).length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Por favor complete los campos obligatorios.', life: 3000 })
        return
    }

    submitting.value = true
    try {
        // Construir payload
        const payload = { ...form.value }
        
        // Resolver campos OTRO
        if (payload.marca === 'OTRO') payload.marca = payload.marca_otro
        if (payload.ram === 'OTRO') payload.ram = payload.ram_otro
        if (payload.disco_duro === 'OTRO') payload.disco_duro = payload.disco_duro_otro
        if (payload.sistema_operativo === 'OTRO') payload.sistema_operativo = payload.sistema_operativo_otro
        
        // Limpiar campos auxiliares _otro
        delete payload.marca_otro
        delete payload.ram_otro
        delete payload.disco_duro_otro
        delete payload.sistema_operativo_otro

        // Formato fecha (YYYY-MM-DD) para enviar backend
        if (payload.fecha_compra) {
            payload.fecha_compra = payload.fecha_compra.toISOString().split('T')[0]
        }

        if (isEditing.value) {
            await EquiposService.update(route.params.id, payload)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Equipo actualizado correctamente', life: 3000 })
        } else {
            await EquiposService.create(payload)
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Equipo registrado correctamente', life: 3000 })
        }

        // Navegar de vuelta tras un breve delay
        setTimeout(() => {
            router.push({ name: 'equipos' })
        }, 1000)

    } catch (error) {
        console.error('Error submit:', error)
        const msg = error.response?.data?.message || 'Error al guardar el equipo'
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
    } finally {
        submitting.value = false
    }
}

const confirm = useConfirm()

const goBack = () => {
    // Si el formulario tiene datos (opcional: podrías validar si hubo cambios reales)
    confirm.require({
        message: '¿Está seguro de que desea salir? Los cambios no guardados se perderán.',
        header: 'Confirmar Salida',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Continuar Editando',
        acceptLabel: 'Salir sin Guardar',
        rejectClass: 'p-button-secondary p-button-text',
        acceptClass: 'p-button-warning !bg-orange-500 !border-none hover:!bg-orange-600',
        accept: () => {
            toast.add({ severity: 'info', summary: 'Cancelado', detail: 'Operación cancelada', life: 3000 })
            router.push({ name: 'equipos' })
        }
    })
}
</script>

<template>
  <div class="animate-fade-in-up max-w-7xl mx-auto">
    
    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
        <div class="flex flex-col gap-6">
            <Skeleton width="10rem" height="2rem" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
            </div>
        </div>
    </div>

    <!-- Form Container -->
    <div v-else class="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 dark:border-dark-border transition-colors duration-300">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-dark-border pb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ formTitle }}</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Complete la información del activo informático</p>
            </div>
            <Button icon="pi pi-times" label="Cancelar" text @click="goBack" class="!text-gray-500 hover:!text-gray-700 dark:!text-gray-400 dark:hover:!text-white" />
        </div>

        <form @submit.prevent="handleSubmit">
            <Fluid>
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-8">
                     
                     <!-- SERIAL & NAME -->
                     <div class="md:col-span-1">
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Número de Serie <span class="text-red-500">*</span></label>
                         <InputText v-model="form.numero_serie" @input="toUpperCase('numero_serie')" placeholder="EJ: SN12345678" :invalid="!!errors.numero_serie" class="!bg-gray-50 dark:!bg-dark-bg" />
                         <small class="text-red-500" v-if="errors.numero_serie">{{ errors.numero_serie }}</small>
                     </div>
                     <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre Equipo (Alias)</label>
                        <InputText v-model="form.nombre_equipo" @input="toUpperCase('nombre_equipo')" placeholder="EJ: PC-RRHH-01" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>

                    <!-- TYPE & BRANCH -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Equipo <span class="text-red-500">*</span></label>
                        <Select v-model="form.id_tipo_equipo" :options="tiposEquipo" optionLabel="nombre_tipo" optionValue="id" placeholder="Seleccione un tipo" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" :invalid="!!errors.id_tipo_equipo" />
                        <small class="text-red-500" v-if="errors.id_tipo_equipo">{{ errors.id_tipo_equipo }}</small>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sucursal Actual <span class="text-red-500">*</span></label>
                        <Select v-model="form.id_sucursal_actual" :options="sucursales" optionLabel="nombre" optionValue="id" placeholder="Seleccione sucursal" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" :invalid="!!errors.id_sucursal_actual" />
                         <small class="text-red-500" v-if="errors.id_sucursal_actual">{{ errors.id_sucursal_actual }}</small>
                    </div>

                    <!-- BRAND & MODEL -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Marca</label>
                        <div class="flex flex-col gap-3">
                            <Select v-model="form.marca" :options="brandsList" placeholder="Seleccione marca" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                            <InputText v-if="form.marca === 'OTRO'" v-model="form.marca_otro" @input="toUpperCase('marca_otro')" placeholder="Especifique la marca" class="!bg-white dark:!bg-dark-bg" autofocus />
                        </div>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Modelo</label>
                        <InputText v-model="form.modelo" @input="toUpperCase('modelo')" placeholder="EJ: OPTIPLEX 3080" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>

                    <!-- CPU & RAM -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Procesador</label>
                        <InputText v-model="form.procesador" @input="toUpperCase('procesador')" placeholder="EJ: INTEL I5 10TH GEN" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Memoria RAM</label>
                        <div class="flex flex-col gap-3">
                            <Select v-model="form.ram" :options="ramList" placeholder="Seleccione RAM" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                            <InputText v-if="form.ram === 'OTRO'" v-model="form.ram_otro" @input="toUpperCase('ram_otro')" placeholder="Especifique RAM" class="!bg-white dark:!bg-dark-bg" autofocus />
                        </div>
                    </div>

                    <!-- DISK & OS -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Disco Duro</label>
                        <div class="flex flex-col gap-3">
                            <Select v-model="form.disco_duro" :options="diskList" placeholder="Seleccione Disco" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                            <InputText v-if="form.disco_duro === 'OTRO'" v-model="form.disco_duro_otro" @input="toUpperCase('disco_duro_otro')" placeholder="Especifique Disco" class="!bg-white dark:!bg-dark-bg" autofocus />
                        </div>
                    </div>
                    <div class="md:col-span-1">
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sistema Operativo</label>
                         <div class="flex flex-col gap-3">
                             <Select v-model="form.sistema_operativo" :options="osList" placeholder="Seleccione SO" filter class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                             <InputText v-if="form.sistema_operativo === 'OTRO'" v-model="form.sistema_operativo_otro" @input="toUpperCase('sistema_operativo_otro')" placeholder="Especifique SO" class="!bg-white dark:!bg-dark-bg" autofocus />
                         </div>
                    </div>

                    <!-- MAC & DATE -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección MAC</label>
                        <InputText v-model="form.mac_address" @input="toUpperCase('mac_address')" placeholder="EJ: 00:1B:44:11:3A:B7" class="!bg-gray-50 dark:!bg-dark-bg" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fecha de Compra</label>
                        <DatePicker v-model="form.fecha_compra" dateFormat="yy-mm-dd" showIcon iconDisplay="input" placeholder="YYYY-MM-DD" class="w-full" :inputClass="'!bg-gray-50 dark:!bg-dark-bg'" />
                    </div>

                    <!-- STATUS -->
                    <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Estado <span class="text-red-500">*</span></label>
                        <Select v-model="form.id_status" :options="statuses" optionLabel="nombre_status" optionValue="id" placeholder="Seleccione Estado" class="!bg-gray-50 dark:!bg-dark-bg w-full" :disabled="isStatusDisabled" :invalid="!!errors.id_status" />
                        <small v-if="isStatusDisabled" class="text-orange-500 flex items-center gap-1 mt-1 font-medium"><i class="pi pi-lock text-xs"></i> {{ statusHelpText }}</small>
                        <small class="text-red-500" v-if="errors.id_status">{{ errors.id_status }}</small>
                    </div>

                    <!-- OTHER NOTES -->
                    <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Otras Características / Notas</label>
                        <Textarea v-model="form.otras_caracteristicas" @input="toUpperCase('otras_caracteristicas')" rows="4" placeholder="Describa características adicionales..." class="!bg-gray-50 dark:!bg-dark-bg w-full" />
                    </div>

                 </div>

                 <!-- Footer Actions -->
                 <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
                     <Button label="Cancelar" severity="secondary" text class="!px-6" @click="goBack" />
                     <Button type="submit" :label="isEditing ? 'Guardar Cambios' : 'Registrar Equipo'" icon="pi pi-check" :loading="submitting" class="!bg-primary !border-none hover:!bg-primary-hover !px-8" />
                 </div>
            </Fluid>
        </form>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom primevue inputs overrides if needed */
:deep(.p-inputtext), :deep(.p-textarea), :deep(.p-select) {
    transition: all 0.2s;
}
</style>
