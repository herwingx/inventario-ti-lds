//public/js/views/direccionesIpView.js
// * Este módulo se encarga de la vista de listado de Direcciones IP, usando Grid.js.

//public/js/views/direccionesIpView.js
// * Este módulo se encarga de la vista de listado de Direcciones IP, usando Grid.js.

import { getDireccionesIp, deleteDireccionIp } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let ipsGridInstance = null;
let gridContainerGlobal = null;
let direccionesIpDataTable = null;

function renderDireccionesIpListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Direcciones IP';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="direccionesip-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
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
        const statusNombre = row[5]; // El estado está en la columna 5
        const isAssigned = statusNombre && statusNombre.includes('ASIGNADO');
        
        // Estilos para botones deshabilitados
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
            
            <style>
                .action-btn:not(.disabled):hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
                    filter: brightness(1.1);
                }
                
                .view-btn:not(.disabled):hover {
                    background: #138496 !important;
                }
                
                .edit-btn:not(.disabled):hover {
                    background: #218838 !important;
                }
                
                .delete-btn:not(.disabled):hover {
                    background: #c82333 !important;
                }
                
                .action-btn:active:not(.disabled) {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                    filter: brightness(0.95);
                }
            </style>
        `;
    }
    return data;
}

function handleIpTableActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    // Verificar si el botón está deshabilitado
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
                    await reloadDireccionesIpTable();
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

async function loadDireccionesIpList() {
    console.log('Herwing - Cargando vista de direcciones IP con datos frescos...');
    const cardBody = renderDireccionesIpListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('direccionesip-list-loading'), 'direcciones IP');
    });
    try {
        const direccionesIp = await getDireccionesIp();
        if (!direccionesIp || direccionesIp.length === 0) {
            showDireccionesIpError('No hay IPs registradas.', cardBody);
            return;
        }
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'direccionesip-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        direccionesIpDataTable = $('#direccionesip-datatable').DataTable({
            data: direccionesIp.map(ip => [
                ip.id,
                ip.direccion_ip,
                ip.nombre_empresa || 'N/A',
                ip.nombre_sucursal || 'N/A',
                ip.comentario || 'N/A',
                ip.status_nombre || 'N/A', // Estado sin formato para lógica
                null
            ]),
            columns: [
                { title: 'ID', data: 0, width: '80px' },
                { title: 'Dirección IP', data: 1 },
                { title: 'Empresa', data: 2 },
                { title: 'Sucursal', data: 3 },
                { title: 'Comentario', data: 4 },
                { title: 'Estado', data: 5, render: function(data, type, row) {
                    return getStatusBadge(data);
                }},
                { title: 'Acciones', data: 6, width: '120px', render: formatIpActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            initComplete: function() {
                $('#direccionesip-datatable').on('click', 'button[data-action]', handleIpTableActions);
            }
        });
    } catch (error) {
        showDireccionesIpError(error.message, cardBody);
    }
}

async function reloadDireccionesIpTable() {
    if (direccionesIpDataTable) {
        try {
            console.log('Herwing - Recargando tabla de direcciones IP...');
            const direccionesIp = await getDireccionesIp();
            const tableData = direccionesIp.map(ip => [
                ip.id,
                ip.direccion_ip,
                ip.nombre_empresa || 'N/A',
                ip.nombre_sucursal || 'N/A',
                ip.comentario || 'N/A',
                ip.status_nombre || 'N/A', // Estado sin formato para lógica
                null
            ]);
            direccionesIpDataTable.clear().rows.add(tableData).draw();
            console.log('Herwing - Tabla de direcciones IP recargada exitosamente');
        } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    } else {
        console.log('Herwing - DataTable no inicializada, recargando vista completa...');
        await loadDireccionesIpList();
    }
}

// Las vistas se actualizan automáticamente al cargar datos frescos de la API

export { loadDireccionesIpList, reloadDireccionesIpTable };