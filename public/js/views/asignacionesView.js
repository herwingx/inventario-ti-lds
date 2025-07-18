//public/js/views/asignacionesView.js
//* Este módulo se encarga de la vista de listado de Asignaciones, usando Grid.js.

import { getAsignaciones, deleteAsignacion } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let asignacionesGridInstance = null;
let gridContainerGlobal = null;
let asignacionesDataTable = null;

function renderAsignacionesListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Asignaciones';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="asignaciones-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function showAsignacionesLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    showListLoading(target, 'Asignaciones');
}

function showAsignacionesError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Asignaciones', message, 'asignaciones-list', () => loadAsignacionesList());
}

function formatAsignacionesActionsCell(data, type, row) {
    if (type === 'display') {
        const asignacionId = row[0];
        const equipoSerie = row[1];
        const fechaFin = row[5];
        const isActiva = !fechaFin;
        
        // Estilos para botones deshabilitados
        const disabledStyle = 'opacity: 0.4; cursor: not-allowed; pointer-events: none;';
        const disabledClass = 'disabled';
        
        return `
            <div class="d-flex gap-1 justify-content-center">
                <button type="button" class="action-btn view-btn" 
                        title="Ver Detalles" data-action="view" data-id="${asignacionId}"
                        style="background: #17a2b8; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-eye" style="color: white; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn edit-btn ${!isActiva ? disabledClass : ''}" 
                        title="${isActiva ? 'Editar o Finalizar Asignación' : 'Esta asignación histórica no se puede editar'}" 
                        data-action="edit" data-id="${asignacionId}"
                        style="background: ${!isActiva ? '#e9ecef' : '#28a745'}; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); ${!isActiva ? disabledStyle : ''}">
                    <i class="fas fa-edit" style="color: ${!isActiva ? '#6c757d' : 'white'}; font-size: 12px;"></i>
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

function handleAsignacionesTableActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    // Verificar si el botón está deshabilitado
    if (button.classList.contains('disabled')) {
        event.preventDefault();
        return;
    }

    const action = button.dataset.action;
    const asignacionId = button.dataset.id;
    const equipoSerie = button.dataset.equipoSerie;
    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacion-details', String(asignacionId));
        }
    } else if (action === 'edit' && !button.classList.contains('disabled')) {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacion-form', String(asignacionId));
        }
    }
}

async function loadAsignacionesList() {
    const cardBody = renderAsignacionesListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('asignaciones-list-loading'), 'asignaciones');
    });
    try {
        const asignaciones = await getAsignaciones();
        if (!asignaciones || asignaciones.length === 0) {
            showAsignacionesError('No hay asignaciones registradas.', cardBody);
            return;
        }
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'asignaciones-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        const tableData = asignaciones.map(asig => [
            asig.id,
            asig.equipo_numero_serie || 'N/A',
            `${asig.empleado_nombres || ''} ${asig.empleado_apellidos || ''}`.trim() || 'N/A',
            asig.ip_direccion || 'N/A',
            asig.fecha_asignacion ? new Date(asig.fecha_asignacion).toLocaleDateString() : 'N/A',
            asig.fecha_fin_asignacion ? new Date(asig.fecha_fin_asignacion).toLocaleDateString() : '',
            asig.status_nombre || 'N/A',
            null
        ]);
        asignacionesDataTable = $('#asignaciones-datatable').DataTable({
            data: tableData,
            columns: [
                { title: 'ID', data: 0, width: '70px' },
                { title: 'Equipo', data: 1 },
                { title: 'Asignado A', data: 2 },
                { title: 'IP', data: 3 },
                { title: 'Fecha Asignación', data: 4 },
                { title: 'Fecha Fin', data: 5 },
                { title: 'Estado Asign.', data: 6, render: function(data, type, row) {
                    return getStatusBadge(data);
                }},
                { title: 'Acciones', data: 7, width: '120px', render: formatAsignacionesActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            initComplete: function() {
                $('#asignaciones-datatable').on('click', 'button[data-action]', handleAsignacionesTableActions);
            }
        });
    } catch (error) {
        showAsignacionesError(error.message, cardBody);
    }
}

export { loadAsignacionesList };
