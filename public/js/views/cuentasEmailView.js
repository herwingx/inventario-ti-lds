//public/js/views/cuentasEmailView.js
//* Este módulo se encarga de toda la lógica para la vista de listado
//* de Cuentas de Email Corporativo.

//? Necesito importar más funciones de api.js a medida que añado funcionalidades (ej. delete).
import { getCuentasEmail, deleteCuentaEmail } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

//* Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

//* Muestra un mensaje de carga mientras se obtienen los datos de las cuentas de email.
function showCuentasEmailLoading() {
    //* Limpio el área y muestro el mensaje.
    showListLoading(contentArea, 'Cuentas de Email');
}

//* Muestra un mensaje de error si falla la carga de datos de las cuentas de email.
function showCuentasEmailError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Cuentas de Email', message, 'cuentasEmailList', () => loadCuentasEmailList());
}

function renderCuentasEmailListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Cuentas de Email';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="cuentasemail-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function formatCuentasEmailActionsCell(data, type, row) {
    if (type === 'display') {
        const cuentaId = row[0];
        
        return `
            <div class="d-flex gap-1 justify-content-center">
                <button type="button" class="action-btn view-btn" 
                        title="Ver Detalles" data-action="view" data-id="${cuentaId}"
                        style="background: #17a2b8; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-eye" style="color: white; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn edit-btn" 
                        title="Editar Cuenta" data-action="edit" data-id="${cuentaId}"
                        style="background: #28a745; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-edit" style="color: white; font-size: 12px;"></i>
                </button>
                
                <button type="button" class="action-btn delete-btn" 
                        title="Eliminar Cuenta" data-action="delete" data-id="${cuentaId}"
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
                
                .view-btn:hover {
                    background: #138496 !important;
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

function handleCuentasEmailTableActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const cuentaId = button.dataset.id;
    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('cuenta-email-details', String(cuentaId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('cuenta-email-form', String(cuentaId));
        }
    } else if (action === 'delete') {
        (async () => {
            const result = Swal.fire({
                title: '¿Eliminar Cuenta de Email?',
                text: `¿Estás seguro de eliminar la cuenta de email (ID: ${cuentaId})? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            });
            if (result.isConfirmed) {
                try {
                    await deleteCuentaEmail(cuentaId);
                    await reloadCuentasEmailTable();
                    Swal.fire({
                        title: 'Eliminada',
                        text: 'La cuenta de email ha sido eliminada exitosamente.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Error al eliminar la cuenta de email: ' + (error.message || 'Error desconocido.'),
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            }
        })();
    }
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
//* Esta es la función que será llamada desde main.js para mostrar esta vista.
let cuentasEmailDataTable = null;
async function loadCuentasEmailList() {
    const cardBody = renderCuentasEmailListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('cuentasemail-list-loading'), 'cuentas de email');
    });
    try {
        const cuentasEmail = await getCuentasEmail();
        if (!cuentasEmail || cuentasEmail.length === 0) {
            showCuentasEmailError('No hay cuentas de email corporativo registradas.', cardBody);
            return;
        }
        // Limpiar el spinner y agregar la tabla
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'cuentasemail-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        // Inicializar DataTable
        cuentasEmailDataTable = $('#cuentasemail-datatable').DataTable({
            data: cuentasEmail.map(cuenta => [
                cuenta.id,
                cuenta.email || 'N/A',
                cuenta.usuario_email || 'N/A',
                cuenta.password_data || 'N/A',
                (cuenta.nombre_empleado && cuenta.apellido_empleado) ? `${cuenta.nombre_empleado} ${cuenta.apellido_empleado}` : (cuenta.nombre_empleado || cuenta.apellido_empleado || 'N/A'),
                getStatusBadge(cuenta.status_nombre || 'N/A'),
                null
            ]),
            columns: [
                { title: 'ID', data: 0 },
                { title: 'Email', data: 1 },
                { title: 'Usuario Email', data: 2 },
                { title: 'Contraseña Email', data: 3 },
                { title: 'Empleado Asignado', data: 4 },
                { title: 'Estado', data: 5 },
                { title: 'Acciones', data: 6, width: '120px', render: formatCuentasEmailActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            initComplete: function() {
                $('#cuentasemail-datatable').on('click', 'button[data-action]', handleCuentasEmailTableActions);
            }
        });
    } catch (error) {
        showCuentasEmailError(error.message, cardBody);
    }
}

async function reloadCuentasEmailTable() {
    if (cuentasEmailDataTable) {
        try {
            const cuentasEmail = await getCuentasEmail();
            const tableData = cuentasEmail.map(cuenta => [
                cuenta.id,
                cuenta.email || 'N/A',
                cuenta.usuario_email || 'N/A',
                cuenta.password_data || 'N/A',
                (cuenta.nombre_empleado && cuenta.apellido_empleado) ? `${cuenta.nombre_empleado} ${cuenta.apellido_empleado}` : (cuenta.nombre_empleado || cuenta.apellido_empleado || 'N/A'),
                getStatusBadge(cuenta.status_nombre || 'N/A'),
                null
            ]);
            cuentasEmailDataTable.clear().rows.add(tableData).draw();
        } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    }
}

export { loadCuentasEmailList, reloadCuentasEmailTable };