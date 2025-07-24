//public/js/views/asignacionesHistoricasView.js
//* Este módulo se encarga de la vista de listado de Asignaciones Históricas (finalizadas).

import { getAsignaciones } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let asignacionesHistoricasDataTable = null;

function renderAsignacionesHistoricasListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.innerHTML = '<i class="fas fa-history me-2"></i>Asignaciones Históricas (Finalizadas)';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="asignaciones-historicas-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function showAsignacionesHistoricasLoading(container) {
    const target = container || contentArea;
    showListLoading(target, 'Asignaciones Históricas');
}

function showAsignacionesHistoricasError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Asignaciones Históricas', message, 'asignaciones-historicas', () => loadAsignacionesHistoricasList());
}

function formatAsignacionesHistoricasActionsCell(data, type, row) {
    if (type === 'display') {
        const asignacionId = row[0];
        
        return `
            <div class="d-flex gap-1 justify-content-center">
                <button type="button" class="action-btn view-btn" 
                        title="Ver Detalles" data-action="view" data-id="${asignacionId}"
                        style="background: #17a2b8; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-eye" style="color: white; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn disabled" 
                        title="Las asignaciones históricas no se pueden editar" 
                        style="background: #e9ecef; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; opacity: 0.4; cursor: not-allowed;">
                    <i class="fas fa-edit" style="color: #6c757d; font-size: 12px;"></i>
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

function handleAsignacionesHistoricasTableActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    // Verificar si el botón está deshabilitado
    if (button.classList.contains('disabled')) {
        event.preventDefault();
        return;
    }

    const action = button.dataset.action;
    const asignacionId = button.dataset.id;
    
    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacion-details', String(asignacionId));
        }
    }
    // No hay acción de editar para asignaciones históricas
}

async function loadAsignacionesHistoricasList() {
    const cardBody = renderAsignacionesHistoricasListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('asignaciones-historicas-loading'), 'asignaciones históricas');
    });
    
    try {
        const todasAsignaciones = await getAsignaciones();
        if (!todasAsignaciones || todasAsignaciones.length === 0) {
            showAsignacionesHistoricasError('No hay asignaciones registradas.', cardBody);
            return;
        }

        // Filtrar solo asignaciones finalizadas de COMPUTADORA (1) y LAPTOP (2)
        const asignacionesHistoricas = todasAsignaciones.filter(asig => 
            asig.fecha_fin_asignacion && // Debe tener fecha de finalización
            (asig.equipo_tipo_id === 1 || asig.equipo_tipo_id === 2) // Solo COMPUTADORA y LAPTOP
        );

        console.log('Herwing - Total asignaciones:', todasAsignaciones.length);
        console.log('Herwing - Asignaciones históricas (COMPUTADORA/LAPTOP finalizadas):', asignacionesHistoricas.length);

        if (asignacionesHistoricas.length === 0) {
            cardBody.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-history fa-4x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay asignaciones históricas</h5>
                    <p class="text-muted">Las asignaciones finalizadas aparecerán aquí una vez que se completen.</p>
                </div>
            `;
            return;
        }

        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'asignaciones-historicas-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);

        const tableData = asignacionesHistoricas.map(asig => [
            asig.id,
            asig.equipo_numero_serie || 'N/A',
            asig.equipo_tipo_nombre || 'N/A',
            `${asig.empleado_nombres || ''} ${asig.empleado_apellidos || ''}`.trim() || 'N/A',
            asig.ip_direccion || 'N/A',
            asig.fecha_asignacion ? new Date(asig.fecha_asignacion).toLocaleDateString() : 'N/A',
            asig.fecha_fin_asignacion ? new Date(asig.fecha_fin_asignacion).toLocaleDateString() : '',
            asig.status_nombre || 'N/A',
            null
        ]);

        asignacionesHistoricasDataTable = $('#asignaciones-historicas-datatable').DataTable({
            data: tableData,
            columns: [
                { title: 'ID', data: 0, width: '70px' },
                { title: 'Equipo', data: 1 },
                { title: 'Tipo', data: 2, width: '100px' },
                { title: 'Asignado A', data: 3 },
                { title: 'IP', data: 4 },
                { title: 'Fecha Asignación', data: 5 },
                { title: 'Fecha Finalización', data: 6 },
                { title: 'Estado', data: 7, render: function(data, type, row) {
                    return getStatusBadge(data);
                }},
                { title: 'Acciones', data: 8, width: '120px', render: formatAsignacionesHistoricasActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            order: [[6, 'desc']], // Ordenar por fecha de finalización descendente
            initComplete: function() {
                $('#asignaciones-historicas-datatable').on('click', 'button[data-action]', handleAsignacionesHistoricasTableActions);
            }
        });

        // Agregar información adicional
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info mt-3';
        infoDiv.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Información:</strong> Esta vista muestra únicamente las asignaciones de equipos principales (Computadoras y Laptops) que han sido finalizadas. 
            Las asignaciones históricas son de solo lectura y no pueden ser editadas ni eliminadas.
        `;
        cardBody.appendChild(infoDiv);

    } catch (error) {
        showAsignacionesHistoricasError(error.message, cardBody);
    }
}

export { loadAsignacionesHistoricasList };