//public/js/views/direccionesIpView.js
// * Este módulo se encarga de la vista de listado de Direcciones IP con soporte para supernetting /20
// * Incluye filtros por segmento (0-15) y estado para manejar eficientemente ~4,000 IPs

import { getDireccionesIp, deleteDireccionIp, getSegmentosResumen } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let ipsGridInstance = null;
let gridContainerGlobal = null;
let direccionesIpDataTable = null;

// * Configuración de nombres de segmentos para el filtro
const SEGMENTOS_CONFIG = {
    0: { nombre: 'Seg. 0 - Infraestructura TI', color: '#6c757d' },
    1: { nombre: 'Seg. 1 - Dirección General TMT', color: '#007bff' },
    2: { nombre: 'Seg. 2 - Contabilidad TMT', color: '#28a745' },
    3: { nombre: 'Seg. 3 - Operaciones TMT', color: '#17a2b8' },
    4: { nombre: 'Seg. 4 - Almacén TMT', color: '#ffc107' },
    5: { nombre: 'Seg. 5 - Mesa de Control TMT', color: '#dc3545' },
    6: { nombre: 'Seg. 6 - Recursos Humanos TMT', color: '#6f42c1' },
    7: { nombre: 'Seg. 7 - Comercial Ventas', color: '#e83e8c' },
    8: { nombre: 'Seg. 8 - Comercial TAE', color: '#fd7e14' },
    9: { nombre: 'Seg. 9 - Comercial Tarifarios', color: '#20c997' },
    10: { nombre: 'Seg. 10 - Comercial Publicidad', color: '#6610f2' },
    11: { nombre: 'Seg. 11 - Comercial Plataformas', color: '#198754' },
    12: { nombre: 'Seg. 12 - Atención y Desarrollo', color: '#0dcaf0' },
    13: { nombre: 'Seg. 13 - Invitados/Móviles', color: '#adb5bd' },
    14: { nombre: 'Seg. 14 - Corporativo Lidifon', color: '#0d6efd' },
    15: { nombre: 'Seg. 15 - Reservado Expansión', color: '#212529' }
};

// * Estado actual de los filtros
let currentFilters = {
    segmento: '',
    status: ''
};

function renderDireccionesIpListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');

    // * Header con título y resumen de segmentos
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header', 'd-flex', 'flex-wrap', 'justify-content-between', 'align-items-center', 'gap-3');
    cardHeader.innerHTML = `
        <div>
            <h4 class="card-title fs-20 font-w700 mb-0">Gestión de Direcciones IP</h4>
            <small class="text-muted">Supernetting /20 (192.168.0.0 - 192.168.15.254)</small>
        </div>
        <div id="resumen-segmentos-mini" class="d-flex gap-2 flex-wrap"></div>
    `;
    cardContainer.appendChild(cardHeader);

    // * Barra de filtros
    const filterBar = document.createElement('div');
    filterBar.classList.add('card-body', 'border-bottom', 'py-3');
    filterBar.innerHTML = `
        <div class="row g-3 align-items-end">
            <div class="col-md-4">
                <label for="filter-segmento" class="form-label fw-bold">
                    <i class="fas fa-network-wired me-1"></i> Filtrar por Segmento
                </label>
                <select id="filter-segmento" class="form-select">
                    <option value="">Todos los segmentos</option>
                    ${Object.entries(SEGMENTOS_CONFIG).map(([seg, config]) =>
        `<option value="${seg}">${config.nombre}</option>`
    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <label for="filter-status" class="form-label fw-bold">
                    <i class="fas fa-toggle-on me-1"></i> Estado
                </label>
                <select id="filter-status" class="form-select">
                    <option value="">Todos los estados</option>
                    <option value="5">DISPONIBLE</option>
                    <option value="4">ASIGNADO</option>
                    <option value="8">RESERVADA</option>
                    <option value="3">EN MANTENIMIENTO</option>
                </select>
            </div>
            <div class="col-md-3">
                <button id="btn-apply-filters" class="btn btn-primary me-2">
                    <i class="fas fa-filter me-1"></i> Aplicar Filtros
                </button>
                <button id="btn-clear-filters" class="btn btn-outline-secondary">
                    <i class="fas fa-times me-1"></i> Limpiar
                </button>
            </div>
            <div class="col-md-2 text-end">
                <button id="btn-add-ip" class="btn btn-success" onclick="window.navigateTo('direccion-ip-form')">
                    <i class="fas fa-plus me-1"></i> Nueva IP
                </button>
            </div>
        </div>
        <div id="filter-info" class="mt-2 text-muted small"></div>
    `;
    cardContainer.appendChild(filterBar);

    // * Cuerpo de la tabla
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="direccionesip-list-loading"></div>`;
    cardContainer.appendChild(cardBody);

    contentArea.appendChild(cardContainer);

    // * Agregar event listeners a los filtros
    document.getElementById('btn-apply-filters').addEventListener('click', applyFilters);
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
    document.getElementById('filter-segmento').addEventListener('change', (e) => {
        currentFilters.segmento = e.target.value;
    });
    document.getElementById('filter-status').addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
    });

    return cardBody;
}

async function loadSegmentosResumen() {
    try {
        const segmentos = await getSegmentosResumen();
        const container = document.getElementById('resumen-segmentos-mini');
        if (!container || !segmentos || segmentos.length === 0) return;

        // * Mostrar solo resumen compacto de segmentos con IPs
        const totalDisponibles = segmentos.reduce((sum, s) => sum + parseInt(s.disponibles || 0), 0);
        const totalAsignadas = segmentos.reduce((sum, s) => sum + parseInt(s.asignadas || 0), 0);
        const totalIps = segmentos.reduce((sum, s) => sum + parseInt(s.total || 0), 0);

        container.innerHTML = `
            <span class="badge bg-secondary fs-12">
                <i class="fas fa-globe me-1"></i> Total: ${totalIps.toLocaleString()}
            </span>
            <span class="badge bg-success fs-12">
                <i class="fas fa-check-circle me-1"></i> Disponibles: ${totalDisponibles.toLocaleString()}
            </span>
            <span class="badge bg-primary fs-12">
                <i class="fas fa-link me-1"></i> Asignadas: ${totalAsignadas.toLocaleString()}
            </span>
        `;
    } catch (error) {
        console.error('Error al cargar resumen de segmentos:', error);
    }
}

async function applyFilters() {
    const filters = {};
    if (currentFilters.segmento !== '') {
        filters.segmento = currentFilters.segmento;
    }
    if (currentFilters.status !== '') {
        filters.status = currentFilters.status;
    }

    // * Actualizar info del filtro
    const filterInfo = document.getElementById('filter-info');
    if (Object.keys(filters).length > 0) {
        const parts = [];
        if (filters.segmento !== undefined) {
            parts.push(`Segmento: ${SEGMENTOS_CONFIG[filters.segmento]?.nombre || filters.segmento}`);
        }
        if (filters.status !== undefined) {
            const statusNames = { '4': 'ASIGNADO', '5': 'DISPONIBLE', '8': 'RESERVADA', '3': 'EN MANTENIMIENTO' };
            parts.push(`Estado: ${statusNames[filters.status] || filters.status}`);
        }
        filterInfo.innerHTML = `<i class="fas fa-info-circle me-1"></i> Filtros activos: ${parts.join(', ')}`;
    } else {
        filterInfo.innerHTML = '';
    }

    await loadDireccionesIpTable(filters);
}

async function clearFilters() {
    currentFilters = { segmento: '', status: '' };
    document.getElementById('filter-segmento').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-info').innerHTML = '';
    await loadDireccionesIpTable({});
}

function showDireccionesIpLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    showListLoading(target, 'Direcciones IP');
}

function showDireccionesIpError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Direcciones IP', message, 'direccionesIpList', () => loadDireccionesIpList());
}

function formatIpActionsCell(data, type, row) {
    if (type === 'display') {
        const ipId = row[0];
        const direccionIp = row[1];
        const statusNombre = row[6]; // El estado está en la columna 6 ahora
        const isAssigned = statusNombre && statusNombre.includes('ASIGNADO');

        const disabledStyle = 'opacity: 0.4; cursor: not-allowed; pointer-events: none;';
        const disabledClass = 'disabled';

        return `
            <div class="d-flex gap-1 justify-content-center">
                <button type="button" class="action-btn view-btn" 
                        title="Ver Detalles" data-action="view" data-id="${ipId}"
                        style="background: #17a2b8; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-eye" style="color: white; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn edit-btn ${isAssigned ? disabledClass : ''}" 
                        title="${isAssigned ? 'No se puede editar: IP gestionada por Asignaciones' : 'Editar Dirección IP'}" 
                        data-action="edit" data-id="${ipId}"
                        style="background: ${isAssigned ? '#e9ecef' : '#28a745'}; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); ${isAssigned ? disabledStyle : ''}">
                    <i class="fas fa-edit" style="color: ${isAssigned ? '#6c757d' : 'white'}; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn delete-btn ${isAssigned ? disabledClass : ''}" 
                        title="${isAssigned ? 'No se puede eliminar: IP tiene asignación activa' : 'Eliminar Dirección IP'}" 
                        data-action="delete" data-id="${ipId}" data-direccion-ip="${direccionIp}"
                        style="background: ${isAssigned ? '#e9ecef' : '#dc3545'}; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); ${isAssigned ? disabledStyle : ''}">
                    <i class="fas fa-trash-alt" style="color: ${isAssigned ? '#6c757d' : 'white'}; font-size: 12px;"></i>
                </button>
            </div>
        `;
    }
    return data;
}

function formatSegmentoBadge(segmento) {
    const config = SEGMENTOS_CONFIG[segmento];
    if (!config) return `<span class="badge bg-secondary">Seg. ${segmento}</span>`;
    return `<span class="badge" style="background-color: ${config.color}; font-size: 11px;">Seg. ${segmento}</span>`;
}

function handleIpTableActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    if (button.classList.contains('disabled')) {
        event.preventDefault();
        return;
    }

    const action = button.dataset.action;
    const ipId = button.dataset.id;
    const direccionIp = button.dataset.direccionIp;

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccion-ip-details', String(ipId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccion-ip-form', String(ipId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await Swal.fire({
                title: 'Confirmar Eliminación de Dirección IP',
                text: `¿Está seguro de que desea eliminar la dirección IP "${direccionIp}" del sistema? Esta acción eliminará permanentemente el registro y podría afectar asignaciones activas.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, Eliminar IP',
                cancelButtonText: 'Cancelar'
            });
            if (confirmed.value) {
                try {
                    await deleteDireccionIp(ipId);
                    await Swal.fire({
                        title: 'Dirección IP Eliminada Exitosamente',
                        text: `La dirección IP "${direccionIp}" ha sido eliminada del sistema de manera permanente.`,
                        icon: 'success',
                        confirmButtonText: 'Entendido'
                    });
                    await applyFilters(); // Recargar con filtros actuales
                } catch (error) {
                    await Swal.fire({
                        title: 'Error al Eliminar Dirección IP',
                        text: `No se pudo eliminar la dirección IP "${direccionIp}". Error: ${error.message}`,
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                }
            }
        })();
    }
}

async function loadDireccionesIpTable(filters = {}) {
    const cardBody = document.querySelector('.card-body:last-child');
    if (!cardBody) return;

    cardBody.innerHTML = `<div id="direccionesip-list-loading"></div>`;
    showListLoading(document.getElementById('direccionesip-list-loading'), 'direcciones IP');

    try {
        const direccionesIp = await getDireccionesIp(filters);

        if (!direccionesIp || direccionesIp.length === 0) {
            cardBody.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-network-wired fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No se encontraron direcciones IP</h5>
                    <p class="text-muted">Intenta cambiar los filtros o agrega nuevas direcciones IP.</p>
                </div>
            `;
            return;
        }

        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'direccionesip-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '900px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);

        // * Destruir tabla anterior si existe
        if (direccionesIpDataTable) {
            direccionesIpDataTable.destroy();
            direccionesIpDataTable = null;
        }

        direccionesIpDataTable = $('#direccionesip-datatable').DataTable({
            data: direccionesIp.map(ip => [
                ip.id,
                ip.direccion_ip,
                ip.segmento, // Segmento calculado
                ip.nombre_empresa || 'N/A',
                ip.nombre_sucursal || 'N/A',
                ip.comentario || '',
                ip.status_nombre || 'N/A', // Estado para lógica
                null // Acciones
            ]),
            columns: [
                { title: 'ID', data: 0, width: '60px' },
                {
                    title: 'Dirección IP', data: 1, width: '130px', render: function (data) {
                        return `<code class="text-primary fw-bold">${data}</code>`;
                    }
                },
                {
                    title: 'Seg.', data: 2, width: '80px', render: function (data) {
                        return formatSegmentoBadge(data);
                    }
                },
                { title: 'Empresa', data: 3, width: '120px' },
                { title: 'Sucursal', data: 4, width: '120px' },
                {
                    title: 'Comentario', data: 5, width: '200px', render: function (data) {
                        if (!data) return '<span class="text-muted">-</span>';
                        return data.length > 40 ? data.substring(0, 40) + '...' : data;
                    }
                },
                {
                    title: 'Estado', data: 6, width: '100px', render: function (data, type, row) {
                        return getStatusBadge(data);
                    }
                },
                { title: 'Acciones', data: 7, width: '120px', render: formatIpActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
            language: {
                lengthMenu: "Mostrar _MENU_ registros",
                zeroRecords: "No se encontraron resultados",
                info: "Mostrando _START_ a _END_ de _TOTAL_ IPs",
                infoEmpty: "Mostrando 0 a 0 de 0 IPs",
                infoFiltered: "(filtrado de _MAX_ IPs totales)",
                search: "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior"
                }
            },
            order: [[2, 'asc'], [1, 'asc']], // Ordenar por segmento, luego por IP
            initComplete: function () {
                $('#direccionesip-datatable').on('click', 'button[data-action]', handleIpTableActions);
            }
        });

        // * Agregar estilos para hover en botones de acción
        if (!document.getElementById('ip-action-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'ip-action-styles';
            styleTag.textContent = `
                .action-btn:not(.disabled):hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
                    filter: brightness(1.1);
                }
                .view-btn:not(.disabled):hover { background: #138496 !important; }
                .edit-btn:not(.disabled):hover { background: #218838 !important; }
                .delete-btn:not(.disabled):hover { background: #c82333 !important; }
                .action-btn:active:not(.disabled) {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                    filter: brightness(0.95);
                }
            `;
            document.head.appendChild(styleTag);
        }

    } catch (error) {
        cardBody.innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h5>Error al cargar direcciones IP</h5>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="window.loadDireccionesIpList()">
                    <i class="fas fa-redo me-1"></i> Reintentar
                </button>
            </div>
        `;
    }
}

async function loadDireccionesIpList() {
    console.log('Herwing - Cargando vista de direcciones IP con soporte supernetting /20...');
    const cardBody = renderDireccionesIpListViewLayout();

    // * Cargar resumen de segmentos en paralelo
    loadSegmentosResumen();

    // * Cargar tabla con filtros actuales (o vacíos si es primera carga)
    await loadDireccionesIpTable(currentFilters);
}

async function reloadDireccionesIpTable() {
    await applyFilters();
}

// * Exponer función globalmente para el botón de error
window.loadDireccionesIpList = loadDireccionesIpList;

export { loadDireccionesIpList, reloadDireccionesIpTable };