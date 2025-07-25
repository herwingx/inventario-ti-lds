//public/js/views/notasFormView.js
//* Este módulo se encarga de la lógica para el formulario de creación y edición de Notas.

import {
    createNota, updateNota, getNotaById,
    getEquipos, getMantenimientos, getCuentasEmail
} from '../api.js';
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

//* Referencia al contenedor principal donde voy a renderizar este formulario.
const contentArea = document.getElementById('content-area');

//* Cache para los datos de los selects.
let equiposCache = null;
let mantenimientosCache = null;
let cuentasEmailCache = null;

//* Función para limpiar cachés cuando sea necesario
function clearFormCaches() {
    equiposCache = null;
    mantenimientosCache = null;
    cuentasEmailCache = null;
    console.log('Cachés del formulario de notas limpiados');
}

//* FUNCIONES DE RENDERIZADO DEL FORMULARIO

function showNotaFormLoading(action = 'Crear') {
    showFormLoading(action, 'nota');
}

function showNotaFormError(message, action = 'procesar') {
    showFormError(action, 'nota', message, () => showNotaForm());
}

async function renderNotaForm(notaToEdit = null) {
    const notaId = typeof notaToEdit === 'string' ? notaToEdit : (notaToEdit && notaToEdit.id);
    const isEditing = notaId !== null;
    const formTitle = isEditing ? `Editar Nota (ID: ${notaId})` : 'Crear Nueva Nota';

    let currentNotaData = null;
    if (isEditing && (typeof notaToEdit === 'string' || !notaToEdit.titulo)) {
        try {
            currentNotaData = await getNotaById(notaId);
            if (currentNotaData && (currentNotaData.data || currentNotaData.nota)) {
                currentNotaData = currentNotaData.data || currentNotaData.nota;
            }
            if (!currentNotaData) {
                showNotaFormError(`No se encontró la nota con ID ${notaId} para editar.`, 'cargar');
                return;
            }
        } catch (error) {
            showNotaFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else if (isEditing) {
        currentNotaData = notaToEdit;
    }

    showNotaFormLoading(isEditing ? 'Editar' : 'Crear');

    try {
        // Cargar datos para los selects si no están en caché
        if (!equiposCache) {
            try {
                equiposCache = await getEquipos();
            } catch (error) {
                console.warn('No se pudieron cargar equipos:', error);
                equiposCache = [];
            }
        }

        if (!mantenimientosCache) {
            try {
                mantenimientosCache = await getMantenimientos();
            } catch (error) {
                console.warn('No se pudieron cargar mantenimientos:', error);
                mantenimientosCache = [];
            }
        }

        if (!cuentasEmailCache) {
            try {
                cuentasEmailCache = await getCuentasEmail();
            } catch (error) {
                console.warn('No se pudieron cargar cuentas de email:', error);
                cuentasEmailCache = [];
            }
        }

        // Renderizar el formulario
        contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">
                            <i class="fas fa-sticky-note me-2"></i>${formTitle}
                        </h4>
                    </div>
                    <div class="card-body">
                        <form id="notaForm" class="basic-form">
                            <div class="mb-3">
                                <label for="titulo" class="form-label">Título <span class="text-danger">*</span></label>
                                <input type="text" id="titulo" name="titulo" required class="form-control" 
                                       value="${isEditing && currentNotaData && currentNotaData.titulo ? currentNotaData.titulo : ''}" 
                                       placeholder="Ingrese el título de la nota">
                            </div>

                            <div class="mb-3">
                                <label for="contenido" class="form-label">Contenido <span class="text-danger">*</span></label>
                                <textarea id="contenido" name="contenido" required rows="8" class="form-control" 
                                          placeholder="Escriba el contenido de la nota...">${isEditing && currentNotaData && currentNotaData.contenido ? currentNotaData.contenido : ''}</textarea>
                            </div>

                            <hr class="my-4">
                            <h5 class="mb-3">
                                <i class="fas fa-link me-2"></i>Asociaciones (Opcional)
                            </h5>
                            <p class="text-muted mb-3">Puede asociar esta nota a un equipo, mantenimiento o cuenta de email específica.</p>

                            <div class="mb-3">
                                <label for="id_equipo" class="form-label">Equipo Asociado</label>
                                <select id="id_equipo" name="id_equipo" class="form-control select2">
                                    <option value="">NINGUNO</option>
                                    ${equiposCache.map(equipo => `
                                        <option value="${equipo.id}" ${isEditing && currentNotaData && currentNotaData.id_equipo === equipo.id ? 'selected' : ''}>
                                            ${equipo.numero_serie || 'Sin serie'} - ${equipo.nombre_equipo || 'Sin nombre'} (ID: ${equipo.id})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="id_mantenimiento" class="form-label">Mantenimiento Asociado</label>
                                <select id="id_mantenimiento" name="id_mantenimiento" class="form-control select2">
                                    <option value="">NINGUNO</option>
                                    ${mantenimientosCache.map(mant => `
                                        <option value="${mant.id}" ${isEditing && currentNotaData && currentNotaData.id_mantenimiento === mant.id ? 'selected' : ''}>
                                            Mantenimiento ID: ${mant.id} - ${mant.descripcion ? mant.descripcion.substring(0, 50) + '...' : 'Sin descripción'}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="id_cuenta_email" class="form-label">Cuenta Email Asociada</label>
                                <select id="id_cuenta_email" name="id_cuenta_email" class="form-control select2">
                                    <option value="">NINGUNA</option>
                                    ${cuentasEmailCache.map(cuenta => `
                                        <option value="${cuenta.id}" ${isEditing && currentNotaData && currentNotaData.id_cuenta_email === cuenta.id ? 'selected' : ''}>
                                            ${cuenta.email || 'Sin email'} (ID: ${cuenta.id})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelNotaForm" class="btn btn-danger light btn-sl-sm">
                                    <span class="me-2"><i class="fa fa-times"></i></span>Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary btn-sl-sm">
                                    <span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Crear Nota'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Inicializar select2
        setTimeout(() => {
            if (window.$ && $.fn.select2) {
                $('#id_equipo').select2({ width: '100%' });
                $('#id_mantenimiento').select2({ width: '100%' });
                $('#id_cuenta_email').select2({ width: '100%' });
            }
        }, 50);

        // Inicializar transformación a mayúsculas
        applyUppercaseToFields(['titulo']);

        // Event listeners
        document.getElementById('notaForm').addEventListener('submit', (event) => handleNotaFormSubmit(event, notaId));
        document.getElementById('cancelNotaForm').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de nota ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('notas-list');
            }
        });

    } catch (error) {
        console.error('Error al renderizar el formulario de Nota:', error);
        showNotaFormError(error.message, 'cargar');
    }
}

async function handleNotaFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const notaData = {};

    // Convertir FormData a objeto
    for (let [key, value] of formData.entries()) {
        if (['id_equipo', 'id_mantenimiento', 'id_cuenta_email'].includes(key)) {
            notaData[key] = value ? parseInt(value, 10) : null;
        } else {
            notaData[key] = value.trim() === '' ? null : value;
        }
    }

    // Validaciones básicas
    if (!notaData.titulo || !notaData.contenido) {
        document.getElementById('form-error-message').textContent = 'Título y contenido son obligatorios.';
        return;
    }

    document.getElementById('form-error-message').textContent = '';
    console.log('Enviando datos del formulario de Nota:', notaData, 'Editando ID:', editingId);

    try {
        let responseMessage = '';
        if (editingId) {
            await updateNota(editingId, notaData);
            responseMessage = `Nota con ID ${editingId} actualizada exitosamente.`;
        } else {
            const nuevaNota = await createNota(notaData);
            const notaId = nuevaNota.id || nuevaNota.insertId;
            responseMessage = `Nota creada exitosamente con ID ${notaId}.`;
        }

        // Limpiar cachés
        clearFormCaches();

        await Swal.fire({
            title: 'Operación Exitosa',
            text: responseMessage,
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        if (typeof window.navigateTo === 'function') {
            window.navigateTo('notas-list');
        }

    } catch (error) {
        console.error('Error al enviar el formulario de Nota:', error);
        const errorDiv = document.getElementById('form-error-message');
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Ocurrió un error desconocido.';
        } else {
            await Swal.fire({
                title: 'Error',
                text: error.message || 'Ocurrió un error desconocido al procesar el formulario.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}

async function showNotaForm(params = null) {
    // Limpiar cachés para asegurar datos actualizados
    clearFormCaches();
    
    const notaId = typeof params === 'string' ? params : (params && params.id);
    console.log('Mostrando el formulario de Nota. ID para editar:', notaId);

    let notaToEdit = null;
    if (notaId) {
        showNotaFormLoading('Editar');
        try {
            notaToEdit = await getNotaById(notaId);
            if (notaToEdit && (notaToEdit.data || notaToEdit.nota)) {
                notaToEdit = notaToEdit.data || notaToEdit.nota;
            }
            if (!notaToEdit) {
                showNotaFormError(`No se encontró la nota con ID ${notaId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showNotaFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else {
        showNotaFormLoading('Crear');
    }

    await renderNotaForm(notaToEdit);
}

export { showNotaForm, clearFormCaches };