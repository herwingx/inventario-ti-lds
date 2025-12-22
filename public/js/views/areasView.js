//public/js/views/areasView.js
import { getAreas, deleteArea } from '../api.js';
import { showListError } from '../utils/error.js';
import { showListLoading } from '../utils/loading.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let areasDataTable = null;

function renderAreasListViewLayout() {
  contentArea.innerHTML = '';
  const cardContainer = document.createElement('div');
  cardContainer.classList.add('card');
  const cardHeader = document.createElement('div');
  cardHeader.classList.add('card-header');
  const cardTitle = document.createElement('h4');
  cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
  cardTitle.textContent = 'Lista de Áreas';
  cardHeader.appendChild(cardTitle);
  cardContainer.appendChild(cardHeader);
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  // Mostrar spinner aquí
  cardBody.innerHTML = `<div id="areas-list-loading"></div>`;
  cardContainer.appendChild(cardBody);
  contentArea.appendChild(cardContainer);
  return cardBody;
}

function showAreasError(message, container) {
  const target = container || contentArea;
  showListError(target, 'Áreas', message, 'areasList', () => loadAreasList());
}

// * Formatea la celda de acciones en DataTables
function formatAreasActionsCell(data, type, row) {
  if (type === 'display') {
    const areaId = row[0]; // ID es la primera columna
    // const nombreArea = row[1];

    return `
            <div class="d-flex gap-1 justify-content-center">
                <button type="button" class="action-btn edit-btn" 
                        title="Editar Área" data-action="edit" data-id="${areaId}"
                        style="background: #28a745; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-edit" style="color: white; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn delete-btn" 
                        title="Eliminar Área" data-action="delete" data-id="${areaId}"
                        style="background: #dc3545; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-trash-alt" style="color: white; font-size: 12px;"></i>
                </button>
            </div>
            
            <style>
                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
                    filter: brightness(1.1);
                }
                
                .edit-btn:hover {
                    background: #218838 !important;
                }
                
                .delete-btn:hover {
                    background: #c82333 !important;
                }
                
                .action-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                    filter: brightness(0.95);
                }
            </style>
        `;
  }
  return data;
}

// * Listener de eventos delegado para los botones de acción en la tabla
function handleAreasTableActions(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const areaId = button.dataset.id;

  console.log(`Acción detectada: ${action} para área ID: ${areaId}`);

  if (action === 'edit') {
    if (typeof window.navigateTo === 'function') {
      window.navigateTo('area-form', String(areaId));
    }
  } else if (action === 'delete') {
    (async () => {
      const confirmed = await Swal.fire({
        title: 'Confirmar Eliminación',
        text: `¿Está seguro de que desea eliminar esta área?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (confirmed.isConfirmed) {
        try {
          await deleteArea(areaId);
          await Swal.fire({
            title: 'Eliminado',
            text: `El área ha sido eliminada.`,
            icon: 'success',
            confirmButtonText: 'OK'
          });
          await reloadAreasTable();
        } catch (error) {
          await Swal.fire({
            title: 'Error',
            text: `No se pudo eliminar el área. ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    })();
  }
}

async function loadAreasList() {
  const cardBody = renderAreasListViewLayout();
  import('../utils/loading.js').then(({ showListLoading }) => {
    showListLoading(document.getElementById('areas-list-loading'), 'areas');
  });
  console.log('Cargando la vista de lista de áreas...');
  try {
    const areas = await getAreas();
    if (!areas || areas.length === 0) {
      showAreasError('No hay áreas registradas.', cardBody);
      return;
    }

    cardBody.innerHTML = '';
    const responsiveDiv = document.createElement('div');
    responsiveDiv.className = 'table-responsive';
    const tableContainer = document.createElement('table');
    tableContainer.id = 'areas-datatable';
    tableContainer.className = 'display';
    tableContainer.style.minWidth = '845px';
    responsiveDiv.appendChild(tableContainer);
    cardBody.appendChild(responsiveDiv);

    areasDataTable = $('#areas-datatable').DataTable({
      data: areas.map(area => [
        area.id,
        area.nombre,
        area.nombre_empresa,
        area.fecha_registro ? new Date(area.fecha_registro).toLocaleDateString() : 'N/A',
        area.status_nombre,
        null
      ]),
      columns: [
        { title: 'ID', data: 0, width: '50px' },
        { title: 'Nombre', data: 1 },
        { title: 'Empresa', data: 2 },
        { title: 'Fecha Registro', data: 3 },
        { title: 'Estado', data: 4, render: function (data) { return getStatusBadge(data); } },
        { title: 'Acciones', data: 5, width: '100px', render: formatAreasActionsCell }
      ],
      columnDefs: [
        {
          targets: -1,
          orderable: false,
          searchable: false
        }
      ],
      language: {
        decimal: ",",
        emptyTable: "No hay datos disponibles",
        info: "Mostrando _START_ a _END_ de _TOTAL_ áreas",
        infoEmpty: "Mostrando 0 a 0 de 0 áreas",
        infoFiltered: "(filtrado de _MAX_ áreas totales)",
        lengthMenu: "Mostrar _MENU_ áreas",
        loadingRecords: "Cargando...",
        search: "Buscar:",
        zeroRecords: "No se encontraron resultados",
        paginate: {
          first: "Primero",
          last: "Último",
          next: "Siguiente",
          previous: "Anterior"
        }
      },
      initComplete: function () {
        $('#areas-datatable').on('click', 'button[data-action]', handleAreasTableActions);
      }
    });
  } catch (error) {
    showAreasError(error.message, cardBody);
  }
}

async function reloadAreasTable() {
  if (areasDataTable) {
    try {
      const areas = await getAreas();
      const tableData = areas.map(area => [
        area.id,
        area.nombre,
        area.nombre_empresa,
        area.fecha_registro ? new Date(area.fecha_registro).toLocaleDateString() : 'N/A',
        area.status_nombre,
        null
      ]);
      areasDataTable.clear().rows.add(tableData).draw();
    } catch (error) {
      console.error('Error al recargar tabla de áreas:', error);
    }
  }
}

export { loadAreasList, reloadAreasTable };
