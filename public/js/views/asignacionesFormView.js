//public/js/views/asignacionFormView.js
//* Este módulo se encarga de la lógica para el formulario de creación y edición de Asignaciones.
//* Es uno de los formularios más complejos debido a las múltiples relaciones que maneja.

//? Funciones de API necesarias:
//? Para CRUD: 'createAsignacion', 'updateAsignacion', 'getAsignacionById'.
//? Para poblar selects: 'getEquipos', 'getEmpleados', 'getSucursales', 'getAreas', 'getDireccionesIp', 'getStatuses'.
import {
    createAsignacion, createAsignacionConComponentes, updateAsignacion, getAsignacionById,
    getEquipos, getEquiposDisponiblesParaComponentes, getComponentesAsignacion, updateComponentesAsignacion,
    getEmpleados, getSucursales, getAreas, getStatuses, getDireccionesIp,
    updateEquipo, updateDireccionIp
} from '../api.js';
//* Importo mis funciones de modales para una mejor UX.
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

//* Referencia al contenedor principal donde voy a renderizar este formulario.
const contentArea = document.getElementById('content-area');

//* Cache para los datos de los selects. Esto es para evitar pedir los mismos datos a la API repetidamente.
let equiposCache = null;
let componentesDisponiblesCache = null;
let empleadosCache = null;
let sucursalesCache = null;
let areasCache = null;
let ipsCache = null;
let statusesCache = null;  //* Para el estado de la asignación.

//* Función para limpiar cachés cuando sea necesario
function clearFormCaches() {
    equiposCache = null;
    componentesDisponiblesCache = null;
    empleadosCache = null;
    sucursalesCache = null;
    areasCache = null;
    ipsCache = null;
    statusesCache = null;
    console.log('Herwing - Cachés del formulario limpiados');
}

//* FUNCIONES DE RENDERIZADO DEL FORMULARIO

//* Muestra un mensaje de carga mientras preparo el formulario o cargo datos para los selects.
function showAsignacionFormLoading(action = 'Crear') {
    showFormLoading(action, 'asignación');
}

//* Muestra un mensaje de error si algo falla al cargar el formulario o al procesar el envío.
function showAsignacionFormError(message, action = 'procesar') {
    showFormError(action, 'asignación', message, () => showAsignacionForm());
}

//* Renderiza el formulario HTML para crear o editar una Asignación.
//* `asignacionToEdit` es opcional; si se proporciona (y no es solo un ID), el formulario se llena para edición.
async function renderAsignacionForm(asignacionToEdit = null) {
    //* Determino si estoy editando y cuál es el ID.
    //* `asignacionToEdit` puede ser el objeto completo o solo el ID (string/number) si se cargó previamente.
    const asignacionId = typeof asignacionToEdit === 'string' ? asignacionToEdit : (asignacionToEdit && asignacionToEdit.id);
    console.log('Herwing está renderizando el formulario de Asignación. Editando ID:', asignacionId || 'Nueva');
    const isEditing = asignacionId !== null;
    const formTitle = isEditing ? `Editar Asignación (ID: ${asignacionId})` : 'Registrar Nueva Asignación';

    //* Si estoy editando y `asignacionToEdit` es solo el ID (o no se pasó el objeto completo),
    //* necesito obtener los datos completos de la asignación para rellenar el formulario.
    let currentAsignacionData = null;
    if (isEditing && (typeof asignacionToEdit === 'string' || !asignacionToEdit.numero_serie)) {
        try {
            currentAsignacionData = await getAsignacionById(asignacionId);
            //* Si la API envuelve la respuesta, la extraigo.
            if (currentAsignacionData && (currentAsignacionData.data || currentAsignacionData.asignacion)) {
                currentAsignacionData = currentAsignacionData.data || currentAsignacionData.asignacion;
            }
            if (!currentAsignacionData) {
                showAsignacionFormError(`No se encontró la asignación con ID ${asignacionId} para editar.`, 'cargar');
                return;
            }
        } catch (error) {
            showAsignacionFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else if (isEditing) {
        currentAsignacionData = asignacionToEdit; //* Ya tengo el objeto completo.
    }


    showAsignacionFormLoading(isEditing ? 'Editar' : 'Crear'); //* Muestro carga mientras obtengo datos de los selects.

    try {
        //* Obtengo los datos para todos los selects si aún no los tengo en caché.
        // Recargar equipos solo si no están en caché o si se limpiaron
        if (!equiposCache) {
            equiposCache = await getEquipos();
            console.log('Herwing - Equipos cargados:', equiposCache.length, 'equipos');
            console.log('Herwing - Ejemplo de equipos:', equiposCache.slice(0, 5).map(eq => `${eq.numero_serie || 'Sin serie'} - Status: ${eq.status_nombre}`));
        }
        // Recargar componentes disponibles solo si no están en caché o si se limpiaron
        if (!componentesDisponiblesCache) {
            try {
                console.log('Herwing - Llamando a getEquiposDisponiblesParaComponentes()...');
                componentesDisponiblesCache = await getEquiposDisponiblesParaComponentes();
                console.log('Herwing - Componentes disponibles cargados:', componentesDisponiblesCache.length, 'componentes');
                console.log('Herwing - Respuesta completa de componentes:', componentesDisponiblesCache);
                if (componentesDisponiblesCache.length > 0) {
                    console.log('Herwing - Tipos de componentes:', componentesDisponiblesCache.map(c => c.nombre_tipo_equipo).filter((v, i, a) => a.indexOf(v) === i));
                    console.log('Herwing - Ejemplos de componentes:', componentesDisponiblesCache.slice(0, 5).map(c => `${c.numero_serie} (${c.nombre_tipo_equipo})`));
                } else {
                    console.warn('Herwing - ⚠️ API devolvió array vacío - probablemente no hay equipos con estado DISPONIBLE (5)');
                    console.warn('Herwing - 💡 Ejecuta fix_component_status.sql para corregir estados inconsistentes');
                }
            } catch (error) {
                console.error('Herwing - ❌ Error al cargar componentes disponibles:', error);
                componentesDisponiblesCache = [];
            }
        }
        if (!empleadosCache) empleadosCache = await getEmpleados();
        if (!sucursalesCache) sucursalesCache = await getSucursales();
        if (!areasCache) areasCache = await getAreas(); //* Podría filtrar por sucursal corporativa.
        if (!ipsCache) {
            ipsCache = await getDireccionesIp();
            console.log('Herwing - IPs cargadas:', ipsCache.length, 'IPs');
            console.log('Herwing - Ejemplo de IPs:', ipsCache.slice(0, 3).map(ip => `${ip.direccion_ip} - Status: ${ip.status_nombre}, Activa: ${ip.asignacion_activa}`));
        }
        if (!statusesCache) statusesCache = await getStatuses(); //* Para el status de la asignación.

        //* Lógica para filtrar los equipos para el select principal 'id_equipo':
        //* 1. Incluir siempre el equipo actualmente asignado si estamos editando.
        //* 2. Incluir todos los equipos cuyo status sea 'Disponible'.
        let equiposParaSelect = [];
        const currentAsignacionEquipoId = currentAsignacionData ? currentAsignacionData.id_equipo : null;

        if (isEditing && currentAsignacionEquipoId) {
            //* Si estamos editando y hay un equipo asignado, lo añadimos primero.
            const assignedEquipo = equiposCache.find(eq => eq.id === currentAsignacionEquipoId);
            if (assignedEquipo) {
                equiposParaSelect.push(assignedEquipo);
            }
        }

        //* Ahora, añade los equipos disponibles (asegúrate de no duplicar si el equipo asignado ya era disponible).
        //* Filtrar equipos disponibles para asignación (solo DISPONIBLE y que sean COMPUTADORA o LAPTOP)
        const availableEquipos = equiposCache.filter(eq =>
            eq.status_nombre === 'DISPONIBLE' && 
            [1, 2].includes(eq.id_tipo_equipo) // Solo COMPUTADORA y LAPTOP
        );
        console.log('Herwing - Equipos disponibles para asignación (solo COMPUTADORA/LAPTOP):', availableEquipos.length);
        console.log('Herwing - Tipos de equipos disponibles:', availableEquipos.map(eq => `${eq.numero_serie} (Tipo: ${eq.id_tipo_equipo})`));

        //* Combina y quita duplicados (en caso de que el equipo asignado también fuera "Disponible")
        availableEquipos.forEach(eq => {
            if (!equiposParaSelect.some(existingEq => existingEq.id === eq.id)) {
                equiposParaSelect.push(eq);
            }
        });

        //* Opcional: Ordenar los equipos para una mejor presentación (por número de serie o nombre)
        equiposParaSelect.sort((a, b) => (a.numero_serie || '').localeCompare(b.numero_serie || ''));
        console.log('Herwing - Equipos finales para select:', equiposParaSelect.length, equiposParaSelect.map(eq => `${eq.numero_serie} (Tipo: ${eq.id_tipo_equipo}, ${eq.status_nombre})`));


        //* Preparo la lista de equipos para el select de "Equipo Padre".
        //* Filtrar para que solo aparezcan equipos principales (COMPUTADORA y LAPTOP)
        let equiposParaPadre = equiposCache.filter(eq => 
            [1, 2].includes(eq.id_tipo_equipo) // Solo COMPUTADORA y LAPTOP
        );
        if (isEditing && currentAsignacionData && currentAsignacionData.id_equipo) {
            //* Si estoy editando, filtro para que el equipo padre no sea el mismo que el 'id_equipo' de esta asignación.
            equiposParaPadre = equiposParaPadre.filter(eq => eq.id !== currentAsignacionData.id_equipo);
        }
        //* Para el modo CREACIÓN, no puedo saber qué 'id_equipo' se seleccionará hasta que el usuario lo haga.
        //* Por ahora, en modo creación, el select de "Equipo Padre" mostrará todos los equipos.
        //TODO: Implementar un listener en el select 'id_equipo' para actualizar dinámicamente las opciones de 'id_equipo_padre'.

        //* Lógica para filtrar las IPs para el select 'id_ip':
        //* 1. Incluir siempre la IP actualmente asignada si estamos editando.
        //* 2. Incluir todas las IPs cuyo status sea 'Disponible' y que no tengan asignación activa.
        let ipsParaSelect = [];
        const currentAsignacionIpId = currentAsignacionData ? currentAsignacionData.id_ip : null;

        if (isEditing && currentAsignacionIpId) {
            //* Si estamos editando y hay una IP asignada, la añadimos primero.
            const assignedIp = ipsCache.find(ip => ip.id === currentAsignacionIpId);
            if (assignedIp) {
                ipsParaSelect.push(assignedIp);
            }
        }

        // Filtrar IPs disponibles y sin asignación activa
        const availableIps = ipsCache.filter(ip =>
            ip.status_nombre === 'DISPONIBLE' &&
            (!ip.asignacion_activa || ip.id === currentAsignacionIpId)
        );
        console.log('Herwing - IPs disponibles para asignación:', availableIps.length);

        availableIps.forEach(ip => {
            if (!ipsParaSelect.some(existingIp => existingIp.id === ip.id)) {
                ipsParaSelect.push(ip);
            }
        });

        //* Función de comparación personalizada para IPs
        //* Divide la IP en sus octetos y compara numéricamente cada parte.
        function compareIps(ipA, ipB) {
            const partsA = ipA.direccion_ip.split('.').map(Number);
            const partsB = ipB.direccion_ip.split('.').map(Number);

            for (let i = 0; i < 4; i++) {
                if (partsA[i] < partsB[i]) return -1;
                if (partsA[i] > partsB[i]) return 1;
            }
            return 0; //* IPs son iguales
        }

        //* Ordenar las IPs para una mejor presentación
        ipsParaSelect.sort(compareIps);
        console.log('Herwing - IPs finales para select:', ipsParaSelect.length, ipsParaSelect.map(ip => `${ip.direccion_ip} (${ip.status_nombre}, activa: ${ip.asignacion_activa})`));


        //* Limpio el área de contenido y construyo el HTML del formulario.
        contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="asignacionForm" class="basic-form">
                            <div class="mb-3">
                                <label for="id_equipo" class="form-label">Equipo (Número de Serie) <span class="text-danger">*</span></label>
                                <select id="id_equipo" name="id_equipo" required class="form-control select2">
                      <option value="">SELECCIONE UN EQUIPO...</option>
                      ${equiposParaSelect.map(eq => `<option value="${eq.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_equipo === eq.id ? 'selected' : ''}>${eq.numero_serie} - ${eq.nombre_equipo || 'Sin Nombre'}</option>`).join('')}
                  </select>
              </div>
                            <div class="mb-3">
                                <label for="fecha_asignacion" class="form-label">Fecha de Asignación <span class="text-danger">*</span></label>
                                <input type="text" id="fecha_asignacion" name="fecha_asignacion" required class="datepicker-default form-control input-default" value="${isEditing && currentAsignacionData && currentAsignacionData.fecha_asignacion ? new Date(currentAsignacionData.fecha_asignacion).toISOString().substring(0, 16) : ''}" placeholder="YYYY-MM-DD" autocomplete="off">
              </div>
                            <hr class="my-4">
              <p class="text-lg font-semibold text-body">Asignar A (Opcional, pero al menos uno para activas):</p>
                            <div class="mb-3">
                                <label for="id_empleado" class="form-label">Empleado Asignado</label>
                                <select id="id_empleado" name="id_empleado" class="form-control select2">
                      <option value="">NINGUNO</option>
                      ${empleadosCache.map(emp => `<option value="${emp.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_empleado === emp.id ? 'selected' : ''}>${emp.nombres} ${emp.apellidos} (ID: ${emp.id})</option>`).join('')}
                  </select>
              </div>
                            <div class="mb-3">
                                <label for="id_sucursal_asignado" class="form-label">Sucursal (para stock o ubicación general)</label>
                                <select id="id_sucursal_asignado" name="id_sucursal_asignado" class="form-control select2">
                      <option value="">NINGUNA</option>
                      ${sucursalesCache.map(suc => `<option value="${suc.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_sucursal_asignado === suc.id ? 'selected' : ''}>${suc.nombre}</option>`).join('')}
                  </select>
              </div>
                            <div class="mb-3">
                                <label for="id_area_asignado" class="form-label">Área (en sucursal corporativa)</label>
                                <select id="id_area_asignado" name="id_area_asignado" class="form-control select2">
                      <option value="">NINGUNA</option>
                      ${areasCache.map(area => `<option value="${area.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_area_asignado === area.id ? 'selected' : ''}>${area.nombre} (Suc ID: ${area.nombre_empresa})</option>`).join('')}
                  </select>
              </div>
                            <hr class="my-4">
              <p class="text-lg font-semibold text-body">Detalles Adicionales (Opcional):</p>
                            <div class="mb-3">
                                <label for="id_equipo_padre" class="form-label">Componente de (Equipo Padre)</label>
                                <select id="id_equipo_padre" name="id_equipo_padre" class="form-control select2">
                      <option value="">NINGUNO</option>
                                    ${equiposParaPadre.map(eq => `<option value="${eq.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_equipo_padre === eq.id ? 'selected' : ''}>${eq.numero_serie} - ${eq.nombre_equipo || 'Sin Nombre'}</option>`).join('')}
                  </select>
              </div>
                            <div class="mb-3">
                                <label for="id_ip" class="form-label">Dirección IP Asignada</label>
                                <select id="id_ip" name="id_ip" class="form-control select2">
                      <option value="">NINGUNA (O DHCP)</option>
                                    ${ipsParaSelect.map(ip => `<option value="${ip.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_ip === ip.id ? 'selected' : ''}>${ip.direccion_ip} (${ip.status_nombre || ip.nombre_status || 'N/A'})</option>`).join('')}
                  </select>
              </div>
                            <div class="mb-3">
                                <label for="id_status" class="form-label">Estado de la Asignación <span class="text-danger">*</span></label>
                                <select id="id_status" name="id_status" required class="form-control select2">
    <option value="">SELECCIONE UN ESTADO...</option>
                                    ${statusesCache
                .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                .map(status => `<option value="${status.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_status_asignacion === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`)
                .join('')}
</select>
              </div>
                            <hr class="my-4">
                            <p class="text-lg font-semibold text-body">Componentes (Opcional):</p>
                            <div class="mb-3">
                                <label class="form-label">Seleccionar Componentes ${isEditing ? 'Actuales y ' : ''}Disponibles</label>
                                <div id="componentes-container" class="border rounded p-3" style="max-height: 300px; overflow-y: auto;">
                                    <div id="componentes-loading" class="text-center">
                                        <div class="spinner-border spinner-border-sm" role="status">
                                            <span class="sr-only">Cargando componentes...</span>
                                        </div>
                                    </div>
                                </div>
                                <small class="form-text text-muted">
                                    ${isEditing ? 
                                        'Modifica los componentes de esta asignación. Los cambios se aplicarán al guardar.' :
                                        'Los componentes seleccionados se asignarán automáticamente junto con el equipo principal.'
                                    }
                                </small>
                            </div>
                            <div class="mb-3">
                                <label for="comentario" class="form-label">Comentario</label>
                                <textarea id="comentario" name="comentario" rows="3" class="form-control" placeholder="DESCRIBA DETALLES DE LA ASIGNACIÓN, UBICACIÓN ESPECÍFICA, PROPÓSITO, OBSERVACIONES, ETC.">${isEditing && currentAsignacionData && currentAsignacionData.comentario ? currentAsignacionData.comentario : ''}</textarea>
              </div>
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelAsignacionForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Asignación'}</button>
              </div>
          </form>
                    </div>
                </div>
            </div>
        `;

        // Inicializar select2 en los selects buscables
        setTimeout(() => {
            if (window.$ && $.fn.select2) {
                $('#id_equipo').select2({ width: '100%' });
                $('#id_empleado').select2({ width: '100%' });
                $('#id_sucursal_asignado').select2({ width: '100%' });
                $('#id_area_asignado').select2({ width: '100%' });
                $('#id_equipo_padre').select2({ width: '100%' });
                $('#id_ip').select2({ width: '100%' });
                $('#id_status').select2({ width: '100%' });
            }
        }, 50);

        // Configurar filtro dinámico de áreas según sucursal seleccionada
        function setupAreaFilter() {
            const sucursalSelect = document.getElementById('id_sucursal_asignado');
            const areaSelect = document.getElementById('id_area_asignado');

            if (!sucursalSelect || !areaSelect) {
                console.error('No se encontraron los elementos de sucursal o área en asignaciones');
                return;
            }

            async function updateAreasForSucursal(sucursalId) {
                try {
                    // Limpiar el select de áreas
                    areaSelect.innerHTML = '<option value="">NINGUNA</option>';
                    
                    if (sucursalId) {
                        // Obtener áreas filtradas por sucursal
                        const areasFiltered = await getAreas(sucursalId);
                        
                        // Poblar el select de áreas
                        areasFiltered.forEach(area => {
                            const option = document.createElement('option');
                            option.value = area.id;
                            option.textContent = `${area.nombre} (${area.nombre_empresa})`;
                            
                            // Mantener selección si estamos editando
                            if (isEditing && currentAsignacionData && currentAsignacionData.id_area_asignado === area.id) {
                                option.selected = true;
                            }
                            
                            areaSelect.appendChild(option);
                        });
                    }
                    
                    // Reinicializar Select2 para el área
                    if (window.$ && $.fn.select2) {
                        $('#id_area_asignado').select2('destroy').select2({ width: '100%' });
                    }
                } catch (error) {
                    console.error('Error al cargar áreas filtradas en asignaciones:', error);
                }
            }

            // Escuchar cambios en el select de sucursal
            sucursalSelect.addEventListener('change', function() {
                updateAreasForSucursal(this.value);
            });

            // También escuchar cambios en select2
            if (window.$ && $.fn.select2) {
                $('#id_sucursal_asignado').on('select2:select', function(e) {
                    setTimeout(() => updateAreasForSucursal(e.params.data.id), 10);
                });
                
                $('#id_sucursal_asignado').on('select2:clear', function() {
                    setTimeout(() => updateAreasForSucursal(''), 10);
                });
            }

            // Si estamos editando y ya hay una sucursal seleccionada, cargar sus áreas
            if (isEditing && currentAsignacionData && currentAsignacionData.id_sucursal_asignado) {
                setTimeout(() => updateAreasForSucursal(currentAsignacionData.id_sucursal_asignado), 100);
            }
        }

        // Configurar el filtro después de que todo esté inicializado
        setTimeout(setupAreaFilter, 150);

        // Cargar componentes después de renderizar
        setTimeout(() => loadComponentesForForm(isEditing, asignacionId), 200);

        // Función para cargar componentes en el formulario
        async function loadComponentesForForm(isEditing, asignacionId) {
            console.log('Herwing - Iniciando carga de componentes para formulario');
            const container = document.getElementById('componentes-container');
            if (!container) {
                console.error('Herwing - No se encontró el contenedor de componentes');
                return;
            }

            try {
                let componentesAsignados = [];
                
                // Si estamos editando, obtener componentes actuales
                if (isEditing && asignacionId) {
                    try {
                        componentesAsignados = await getComponentesAsignacion(asignacionId);
                        console.log('Herwing - Componentes asignados cargados:', componentesAsignados);
                        if (componentesAsignados.length > 0) {
                            console.log('Herwing - Ejemplo de componente asignado:', componentesAsignados[0]);
                        }
                    } catch (error) {
                        console.warn('No se pudieron cargar componentes asignados:', error);
                        componentesAsignados = [];
                    }
                }

                // Combinar componentes disponibles y asignados
                const componentesAsignadosIds = componentesAsignados.map(c => c.id_equipo);
                const todosComponentes = [...componentesAsignados];

                // Marcar componentes asignados y normalizar su estructura
                componentesAsignados.forEach(comp => {
                    comp.asignado = true;
                    // Normalizar nombres de campos del backend
                    comp.numero_serie = comp.equipo_numero_serie || comp.numero_serie;
                    comp.nombre_equipo = comp.equipo_nombre || comp.nombre_equipo;
                    comp.nombre_tipo_equipo = comp.tipo_equipo_nombre || comp.nombre_tipo_equipo;
                    comp.id_equipo = comp.id_equipo || comp.id;
                });
                
                console.log('Herwing - Componentes después de normalización:', componentesAsignados.map(c => ({
                    id: c.id_equipo,
                    serie: c.numero_serie,
                    nombre: c.nombre_equipo,
                    tipo: c.nombre_tipo_equipo
                })));

                // Añadir SOLO componentes disponibles (no asignados a ninguna asignación)
                console.log('Herwing - Componentes disponibles del cache:', componentesDisponiblesCache.length);
                console.log('Herwing - Cache de componentes:', componentesDisponiblesCache);
                console.log('Herwing - Componentes asignados a esta asignación:', componentesAsignadosIds);
                
                const componentesDisponiblesParaMostrar = componentesDisponiblesCache.filter(comp => 
                    !componentesAsignadosIds.includes(comp.id)
                );
                
                console.log('Herwing - Componentes disponibles para mostrar:', componentesDisponiblesParaMostrar.length);
                console.log('Herwing - Componentes filtrados:', componentesDisponiblesParaMostrar);
                
                componentesDisponiblesParaMostrar.forEach(comp => {
                    todosComponentes.push({
                        id: comp.id,
                        id_equipo: comp.id,
                        numero_serie: comp.numero_serie,
                        nombre_equipo: comp.nombre_equipo,
                        nombre_tipo_equipo: comp.nombre_tipo_equipo,
                        marca: comp.marca,
                        modelo: comp.modelo,
                        asignado: false
                    });
                });

                // Ordenar por tipo y serie
                todosComponentes.sort((a, b) => {
                    const tipoA = a.nombre_tipo_equipo || a.tipo_equipo_nombre || '';
                    const tipoB = b.nombre_tipo_equipo || b.tipo_equipo_nombre || '';
                    if (tipoA !== tipoB) return tipoA.localeCompare(tipoB);
                    return (a.numero_serie || '').localeCompare(b.numero_serie || '');
                });

                // Renderizar componentes
                if (todosComponentes.length === 0) {
                    container.innerHTML = '<p class="text-muted">No hay componentes disponibles</p>';
                } else {
                    container.innerHTML = todosComponentes.map(comp => {
                        const equipoId = comp.id_equipo || comp.id;
                        const isChecked = comp.asignado || componentesAsignadosIds.includes(equipoId);
                        
                        const numeroSerie = comp.numero_serie || comp.equipo_numero_serie || 'Sin serie';
                        const nombreEquipo = comp.nombre_equipo || comp.equipo_nombre || 'Sin nombre';
                        const tipoEquipo = comp.nombre_tipo_equipo || comp.tipo_equipo_nombre || 'Sin tipo';
                        const marca = comp.marca || 'N/A';
                        const modelo = comp.modelo || 'N/A';
                        
                        return `
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" value="${equipoId}" 
                                       id="componente_${equipoId}" name="componentes" ${isChecked ? 'checked' : ''}>
                                <label class="form-check-label" for="componente_${equipoId}">
                                    <strong>${numeroSerie}</strong> - ${nombreEquipo} 
                                    <small class="text-muted">(${tipoEquipo} - ${marca} ${modelo})</small>
                                    ${comp.asignado ? '<span class="badge badge-success ml-2">Asignado Actualmente</span>' : ''}
                                </label>
                            </div>
                        `;
                    }).join('');
                }

            } catch (error) {
                console.error('Error al cargar componentes para el formulario:', error);
                container.innerHTML = '<p class="text-danger">Error al cargar componentes</p>';
            }
        }
        // Inicializar Pickadate en español en el campo de fecha SIEMPRE después de renderizar
        if (window.$ && $.fn.pickadate) {
            if ($('#fecha_asignacion').data('pickadate')) $('#fecha_asignacion').pickadate('destroy');
            setTimeout(function () {
                var currentYear = new Date().getFullYear();
                var minYearAsignacion = 2000;
                var yearsAsignacion = currentYear - minYearAsignacion + 1;
                $('#fecha_asignacion').pickadate({
                    format: 'yyyy-mm-dd',
                    selectMonths: true,
                    selectYears: yearsAsignacion,
                    autoclose: true,
                    min: [minYearAsignacion, 0, 1],
                    max: [currentYear, 11, 31],
                    monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                    monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                    weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                    today: 'Hoy',
                    clear: 'Limpiar',
                    close: 'Cerrar',
                    labelMonthNext: 'Mes siguiente',
                    labelMonthPrev: 'Mes anterior',
                    labelMonthSelect: 'Selecciona un mes',
                    labelYearSelect: 'Selecciona un año',
                    firstDay: 1
                });
            }, 0);
        }

        // Inicializar transformación a mayúsculas en campos de texto
        applyUppercaseToFields(['comentario']);

        document.getElementById('asignacionForm').addEventListener('submit', (event) => handleAsignacionFormSubmit(event, asignacionId));
        document.getElementById('cancelAsignacionForm').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de asignación ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('asignaciones-list');
            } else {
                contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
            }
        });


        // Filtro dinámico de áreas implementado arriba

    } catch (error) {
        console.error('Error al renderizar el formulario de Asignación:', error);
        showAsignacionFormError(error.message, 'cargar');
    }
}

//* MANEJO DEL ENVÍO DEL FORMULARIO
async function handleAsignacionFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const asignacionData = {};

    //* Recolectar componentes seleccionados
    const componentesSeleccionados = [];
    const checkboxes = form.querySelectorAll('input[name="componentes"]:checked');
    checkboxes.forEach(checkbox => {
        componentesSeleccionados.push(parseInt(checkbox.value, 10));
    });

    //* Convierto FormData a un objeto, manejando valores vacíos y numéricos.
    for (let [key, value] of formData.entries()) {
        if ([
            'id_equipo', 'id_empleado', 'id_sucursal_asignado', 'id_area_asignado', 'id_equipo_padre', 'id_ip'
        ].includes(key)) {
            asignacionData[key] = value ? parseInt(value, 10) : null;
        } else if (key === 'id_status') {
            asignacionData['id_status_asignacion'] = value ? parseInt(value, 10) : null;
        } else if (key === 'fecha_asignacion' || key === 'fecha_fin_asignacion') {
            //* El input datetime-local devuelve "YYYY-MM-DDTHH:mm". MySQL espera "YYYY-MM-DD HH:mm:ss".
            //* Si el valor está vacío, lo mandamos como null.
            if (value) {
                let formattedDate = value.replace('T', ' ');
                //* Aseguro que tenga segundos si no los tiene el input.
                if (formattedDate.length === 16) formattedDate += ':00';
                asignacionData[key] = formattedDate;
            } else {
                asignacionData[key] = null;
            }
        } else if (key !== 'componentes') { // Ignorar checkboxes de componentes en el loop principal
            //* Para campos de texto como 'comentario', si está vacío, enviar null.
            asignacionData[key] = value.trim() === '' ? null : value;
        }
    }

    //* Añadir componentes al objeto de datos
    if (componentesSeleccionados.length > 0) {
        asignacionData.componentes = componentesSeleccionados;
    }

    //* Validaciones básicas en frontend (el backend también validará).
    if (!asignacionData.id_equipo || !asignacionData.fecha_asignacion || !asignacionData.id_status_asignacion) {
        document.getElementById('form-error-message').textContent = 'Equipo, Fecha de Asignación y Estado de Asignación son obligatorios.';
        return;
    }
    //* Validación de "al menos una asociación" para activas (fecha_fin_asignacion es null).
    const isCreatingOrUpdatingToActive = !asignacionData.fecha_fin_asignacion;
    if (isCreatingOrUpdatingToActive && !asignacionData.id_empleado && !asignacionData.id_sucursal_asignado && !asignacionData.id_area_asignado) {
        document.getElementById('form-error-message').textContent = 'Para una asignación activa, debe asociarse a un empleado, sucursal o área.';
        return;
    }

    document.getElementById('form-error-message').textContent = '';
    console.log('Herwing está enviando datos del formulario de Asignación:', asignacionData, 'Editando ID:', editingId);

    try {
        let responseMessage = '';
        let updatedAsignacion = null;
        if (editingId) {
            await updateAsignacion(editingId, asignacionData);
            
            // Si hay componentes seleccionados, actualizar componentes
            if (componentesSeleccionados.length >= 0) { // >= 0 para permitir eliminar todos los componentes
                await updateComponentesAsignacion(editingId, { componentes: componentesSeleccionados });
            }
            
            responseMessage = `Asignación con ID ${editingId} actualizada exitosamente.`;
            updatedAsignacion = { ...asignacionData, id: editingId };
        } else {
            let nuevaAsignacion;
            if (asignacionData.componentes && asignacionData.componentes.length > 0) {
                // Usar la nueva API para crear asignación con componentes
                nuevaAsignacion = await createAsignacionConComponentes(asignacionData);
                responseMessage = `Asignación (ID: ${nuevaAsignacion.id}) para el equipo ID ${nuevaAsignacion.id_equipo} registrada exitosamente con ${nuevaAsignacion.componentes_asignados} componentes.`;
            } else {
                // Usar la API tradicional
                nuevaAsignacion = await createAsignacion(asignacionData);
                responseMessage = `Asignación (ID: ${nuevaAsignacion.id}) para el equipo ID ${nuevaAsignacion.id_equipo} registrada exitosamente.`;
            }
            updatedAsignacion = nuevaAsignacion;
        }

        // --- NUEVO BLOQUE: Si el estado es "Finalizada", actualiza equipo e IP a "Disponible" ---
        // IDs de estado según tu base de datos
        const DISPONIBLE_ID = 5; // Disponible (coincide con backend)
        const ASIGNADO_ID = 4;   // Asignado
        const FINALIZADA_ID = 6; // Finalizada

        if (editingId) {
            // No actualices equipo/IP aquí, el backend lo hace automáticamente al finalizar la asignación
        } else {
            // Al crear una asignación, equipo e IP pasan a asignado
            if (asignacionData.id_equipo) {
                await updateEquipo(asignacionData.id_equipo, { id_status: ASIGNADO_ID });
            }
            if (asignacionData.id_ip) {
                await updateDireccionIp(asignacionData.id_ip, { id_status: ASIGNADO_ID });
            }
        }
        // --- FIN NUEVO BLOQUE ---

        // Los datos se actualizarán automáticamente la próxima vez que se carguen las vistas de IPs
        if (asignacionData.id_ip) {
            console.log(`Herwing - IP ${asignacionData.id_ip} actualizada. Los cambios se verán al recargar las vistas de IPs.`);
        }

        // Limpiar cachés después de operación exitosa para mantener datos actualizados
        clearFormCaches();

        await Swal.fire({
            title: 'Operación Exitosa',
            text: responseMessage,
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignaciones-list'); //* Navego a la lista después del éxito.
        }

    } catch (error) {
        console.error('Error al enviar el formulario de Asignación:', error);
        const errorDiv = document.getElementById('form-error-message');
        // Mejora el mensaje de error para duplicado de IP
        if (errorDiv) {
            if (error.message && error.message.includes('Duplicate entry') && error.message.includes('id_ip')) {
                errorDiv.textContent = 'La IP seleccionada ya está asignada a otra asignación activa. Por favor, elige otra IP o finaliza la asignación anterior.';
            } else {
                errorDiv.textContent = error.message || 'Ocurrió un error desconocido.';
            }
        } else {
            //* Fallback si el div de error no está, uso mi modal.
            let msg = error.message;
            if (msg && msg.includes('Duplicate entry') && msg.includes('id_ip')) {
                msg = 'La IP seleccionada ya está asignada a otra asignación activa. Por favor, elige otra IP o finaliza la asignación anterior.';
            }
            await Swal.fire({
                title: 'Error',
                text: msg || 'Ocurrió un error desconocido al procesar el formulario.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
//* Esta será llamada desde main.js. `params` puede ser el ID si se edita.
async function showAsignacionForm(params = null) {
    // Limpiar cachés críticos para asegurar datos actualizados en SPA
    equiposCache = null;
    componentesDisponiblesCache = null;
    console.log('Herwing - Cachés críticos limpiados para SPA');
    
    //* El ID de la asignación puede venir como string (de la URL) o como parte de un objeto.
    const asignacionId = typeof params === 'string' ? params : (params && params.id);
    console.log('Mostrando el formulario de Asignación. ID para editar:', asignacionId);

    let asignacionToEdit = null; //* Variable para los datos si estoy editando.
    if (asignacionId) {
        //* Si hay ID, estoy editando. Primero, obtengo los datos de la asignación.
        showAsignacionFormLoading('Editar');
        try {
            asignacionToEdit = await getAsignacionById(asignacionId);
            //* Si la API envuelve la respuesta (ej. { data: asignacion }), la extraigo.
            if (asignacionToEdit && (asignacionToEdit.data || asignacionToEdit.asignacion)) {
                asignacionToEdit = asignacionToEdit.data || asignacionToEdit.asignacion;
            }
            if (!asignacionToEdit) {
                showAsignacionFormError(`No se encontró la asignación con ID ${asignacionId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showAsignacionFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else {
        //* Si no hay ID, estoy creando una nueva asignación.
        showAsignacionFormLoading('Crear');
    }

    //* Limpiar caches para forzar recarga de datos actualizados.
    //* Especialmente importante para Equipos e IPs cuyos estados pueden cambiar.
    //* Generalmente los empleados no cambian de estado tan a menudo, pero para ser seguros.
    equiposCache = null;
    empleadosCache = null;
    sucursalesCache = null;
    areasCache = null;
    ipsCache = null;
    statusesCache = null;

    //* Renderizo el formulario (vacío o con datos para editar).
    //* Paso el objeto completo o null.
    await renderAsignacionForm(asignacionToEdit);
}

export { showAsignacionForm, clearFormCaches };