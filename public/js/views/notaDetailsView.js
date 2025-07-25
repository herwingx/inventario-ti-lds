//public/js/views/notasDetailsView.js
//* Este módulo maneja la lógica para mostrar los detalles de una Nota específica.

import { getNotaById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';

//* Referencia al contenedor principal.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

function showNotaDetailsLoading(notaId) {
    showDetailsLoading('Nota', notaId);
}

function showNotaDetailsError(message) {
    showDetailsError('Nota', null, message, 'notas-list', () => showNotaDetails());
}

function renderNotaDetails(nota) {
    contentArea.innerHTML = '';
    if (!nota) {
        showNotaDetailsError('No se encontraron datos para esta nota.');
        return;
    }

    // Card principal
    const card = document.createElement('div');
    card.className = 'card shadow-sm mb-4';

    // Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header d-flex justify-content-between align-items-center';
    
    const titleContainer = document.createElement('div');
    const title = document.createElement('h4');
    title.className = 'card-title mb-0';
    title.innerHTML = `<i class="fas fa-sticky-note me-2"></i>Detalles de la Nota (ID: ${nota.id})`;
    titleContainer.appendChild(title);
    
    cardHeader.appendChild(titleContainer);
    card.appendChild(cardHeader);

    // Body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Título de la nota
    if (nota.titulo) {
        const tituloSection = document.createElement('div');
        tituloSection.className = 'mb-4';
        tituloSection.innerHTML = `
            <h5 class="text-primary mb-2">
                <i class="fas fa-heading me-2"></i>Título
            </h5>
            <div class="p-3 rounded">
                <h6 class="mb-0">${nota.titulo}</h6>
            </div>
        `;
        cardBody.appendChild(tituloSection);
    }

    // Contenido de la nota
    if (nota.contenido) {
        const contenidoSection = document.createElement('div');
        contenidoSection.className = 'mb-4';
        contenidoSection.innerHTML = `
            <h5 class="text-primary mb-2">
                <i class="fas fa-file-text me-2"></i>Contenido
            </h5>
            <div class="p-3 rounded" style="max-height: 400px; overflow-y: auto;">
                <div style="white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">${nota.contenido}</div>
            </div>
        `;
        cardBody.appendChild(contenidoSection);
    }

    // Información de asociaciones
    const asociacionesSection = document.createElement('div');
    asociacionesSection.className = 'mb-4';
    asociacionesSection.innerHTML = `
        <h5 class="text-primary mb-3">
            <i class="fas fa-link me-2"></i>Asociaciones
        </h5>
    `;

    const asociacionesGrid = document.createElement('dl');
    asociacionesGrid.className = 'row mb-0';

    function addDetail(label, value, icon = '') {
        const dt = document.createElement('dt');
        dt.className = 'col-sm-4 text-sm-end text-muted';
        dt.innerHTML = icon ? `<i class="${icon} me-1"></i>${label}` : label;
        
        const dd = document.createElement('dd');
        dd.className = 'col-sm-8 mb-2';
        dd.textContent = value || 'N/A';
        
        asociacionesGrid.appendChild(dt);
        asociacionesGrid.appendChild(dd);
    }

    // Asociaciones
    const equipoInfo = nota.id_equipo ? 
        `${nota.equipo_numero_serie || 'Sin serie'} - ${nota.equipo_nombre || 'Sin nombre'} (ID: ${nota.id_equipo})` : 
        null;
    addDetail('Equipo Asociado', equipoInfo, 'fas fa-desktop');

    const mantenimientoInfo = nota.id_mantenimiento ? 
        `Mantenimiento ID: ${nota.id_mantenimiento}` : 
        null;
    addDetail('Mantenimiento Asociado', mantenimientoInfo, 'fas fa-tools');

    const emailInfo = nota.id_cuenta_email ? 
        `${nota.cuenta_email_email || 'Sin email'} (ID: ${nota.id_cuenta_email})` : 
        null;
    addDetail('Cuenta Email Asociada', emailInfo, 'fas fa-envelope');

    asociacionesSection.appendChild(asociacionesGrid);
    cardBody.appendChild(asociacionesSection);

    // Información del sistema
    const sistemaSection = document.createElement('div');
    sistemaSection.className = 'mb-4';
    sistemaSection.innerHTML = `
        <h5 class="text-primary mb-3">
            <i class="fas fa-info-circle me-2"></i>Información del Sistema
        </h5>
    `;

    const sistemaGrid = document.createElement('dl');
    sistemaGrid.className = 'row mb-0';

    const fechaCreacionF = nota.fecha_creacion ? 
        new Date(nota.fecha_creacion).toLocaleString() : 
        'N/A';
    const fechaActualizacionF = nota.fecha_actualizacion ? 
        new Date(nota.fecha_actualizacion).toLocaleString() : 
        'N/A';

    function addSistemaDetail(label, value, icon = '') {
        const dt = document.createElement('dt');
        dt.className = 'col-sm-4 text-sm-end text-muted';
        dt.innerHTML = icon ? `<i class="${icon} me-1"></i>${label}` : label;
        
        const dd = document.createElement('dd');
        dd.className = 'col-sm-8 mb-2';
        dd.textContent = value || 'N/A';
        
        sistemaGrid.appendChild(dt);
        sistemaGrid.appendChild(dd);
    }

    addSistemaDetail('ID de la Nota', nota.id, 'fas fa-hashtag');
    addSistemaDetail('Creado por Usuario', nota.id_usuario_sistema || 'Sistema', 'fas fa-user');
    addSistemaDetail('Fecha de Creación', fechaCreacionF, 'fas fa-calendar-plus');
    addSistemaDetail('Última Actualización', fechaActualizacionF, 'fas fa-calendar-edit');

    sistemaSection.appendChild(sistemaGrid);
    cardBody.appendChild(sistemaSection);

    card.appendChild(cardBody);

    // Botones de acción
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-footer d-flex justify-content-end gap-2';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-danger light btn-sl-sm';
    backBtn.innerHTML = '<i class="fa fa-arrow-left me-2"></i>Volver a la Lista';
    backBtn.onclick = () => { 
        if (typeof window.navigateTo === 'function') 
            window.navigateTo('notas-list'); 
    };

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Nota';
    editBtn.onclick = () => { 
        if (typeof window.navigateTo === 'function') 
            window.navigateTo('nota-form', String(nota.id)); 
    };

    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);

    contentArea.appendChild(card);
    console.log('Detalles de la nota renderizados correctamente.');
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
async function showNotaDetails(params) {
    const notaId = typeof params === 'string' ? params : (params && params.id);
    console.log('Mostrando los detalles de una Nota. ID:', notaId);

    if (!notaId) {
        showNotaDetailsError('No se proporcionó un ID de nota para mostrar los detalles.');
        return;
    }

    showNotaDetailsLoading(notaId);

    try {
        let nota = await getNotaById(notaId);
        
        // Si la API envuelve la respuesta, extraerla
        if (nota && (nota.data || nota.nota)) {
            nota = nota.data || nota.nota;
        }
        
        renderNotaDetails(nota);
    } catch (error) {
        showNotaDetailsError(error.message);
    }
}

export { showNotaDetails };