//public/js/views/areaFormView.js
import {
  createArea,
  updateArea,
  getAreaById,
  getSucursales,
  getStatuses
} from '../api.js';

import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

const contentArea = document.getElementById('content-area');

let sucursalesCache = null;
let statusesCache = null;

function showAreaFormLoading(action = 'Crear') {
  showFormLoading(action, 'área');
}

function showAreaFormError(message, action = 'procesar') {
  showFormError(action, 'área', message, () => showAreaForm());
}

async function renderAreaForm(areaToEdit = null) {
  const areaId = typeof areaToEdit === 'string' ? areaToEdit : (areaToEdit && areaToEdit.id);
  const isEditing = areaId !== null;
  const formTitle = isEditing ? `Editar Área (ID: ${areaId})` : 'Registrar Nueva Área';

  let currentAreaData = null;
  if (isEditing && typeof areaToEdit === 'string') {
    try {
      currentAreaData = await getAreaById(areaId);
      if (!currentAreaData) {
        showAreaFormError(`No se encontró el área con ID ${areaId} para editar.`, 'cargar');
        return;
      }
    } catch (error) {
      showAreaFormError(error.message, 'cargar datos para edición');
      return;
    }
  } else if (isEditing) {
    currentAreaData = areaToEdit;
  }

  showAreaFormLoading(isEditing ? 'Editar' : 'Crear');

  try {
    if (!sucursalesCache) {
      sucursalesCache = await getSucursales();
    }
    if (!statusesCache) {
      statusesCache = await getStatuses();
    }

    // Filtrar sucursales que sean 'Corporativo' (búsqueda insensible a mayúsculas/minúsculas)
    const corporateSucursales = sucursalesCache.filter(s =>
      s.nombre_tipo_sucursal && s.nombre_tipo_sucursal.trim().toUpperCase() === 'CORPORATIVO'
    );

    console.log('Sucursales encontradas (Total):', sucursalesCache.length);
    console.log('Sucursales filtradas (Corporativo):', corporateSucursales.length);

    if (corporateSucursales.length === 0) {
      console.warn('Alerta: No se encontraron sucursales de tipo Corporativo. Mostrando todas para debug (o mensaje de error)');
      // Fallback opcional: si no hay corporativos, mostrar mensaje o todas? 
      // El usuario dijo "no me cargo las sucursales". Si el filtro mata todo, mejor avisar.
    }

    contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="area-form" class="basic-form">
                            <div class="mb-3">
                                <label for="nombre" class="form-label">Nombre del Área <span class="text-danger">*</span></label>
                                <input type="text" id="nombre" name="nombre" required class="form-control input-default uppercase-field" placeholder="Ej: RECURSOS HUMANOS" value="${isEditing && currentAreaData.nombre ? currentAreaData.nombre : ''}">
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="id_sucursal" class="form-label">Sucursal (Corporativo) <span class="text-danger">*</span></label>
                                    <select id="id_sucursal" name="id_sucursal" required class="form-control select2">
                                        <option value="">SELECCIONE SUCURSAL...</option>
                                        ${corporateSucursales.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentAreaData.id_sucursal === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')} 
                                    </select>
                                    <small class="form-text text-muted">Solo se pueden crear áreas para sucursales de tipo Corporativo.</small>
                                    ${corporateSucursales.length === 0 ? '<div class="text-danger mt-1">No se encontraron sucursales de tipo "Corporativo". Verifique la configuración de sucursales.</div>' : ''}
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="id_status" class="form-label">Estado <span class="text-danger">*</span></label>
                                    <select id="id_status" name="id_status" required class="form-control select2">
                                        <option value="">SELECCIONE ESTADO...</option>
                                        ${statusesCache.map(status => `<option value="${status.id}" ${isEditing && currentAreaData.id_status === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelAreaForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Área'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

    setTimeout(() => {
      if (window.$ && $.fn.select2) {
        $('#id_sucursal').select2({ width: '100%' });
        $('#id_status').select2({ width: '100%' });
      }
    }, 50);

    applyUppercaseToFields(['nombre']);

    document.getElementById('area-form').addEventListener('submit', (event) => handleAreaFormSubmit(event, areaId));
    document.getElementById('cancelAreaForm').addEventListener('click', async () => {
      if (typeof window.navigateTo === 'function') {
        window.navigateTo('areas-list');
      }
    });

  } catch (error) {
    console.error('Error al renderizar formulario área:', error);
    showAreaFormError(error.message, 'cargar');
  }
}

async function handleAreaFormSubmit(event, editingId = null) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const areaData = {};

  for (let [key, value] of formData.entries()) {
    if (['id_sucursal', 'id_status'].includes(key)) {
      areaData[key] = value ? parseInt(value, 10) : null;
    } else {
      areaData[key] = value;
    }
  }

  if (!areaData.nombre || !areaData.id_sucursal || !areaData.id_status) {
    document.getElementById('form-error-message').textContent = 'Todos los campos son obligatorios.';
    return;
  }

  try {
    if (editingId) {
      await updateArea(editingId, areaData);
      await Swal.fire({
        title: 'Área Actualizada',
        text: 'El área ha sido actualizada exitosamente.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } else {
      await createArea(areaData);
      await Swal.fire({
        title: 'Área Creada',
        text: 'Nueva área registrada exitosamente.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    }

    if (typeof window.navigateTo === 'function') {
      window.navigateTo('areas-list');
    }

  } catch (error) {
    document.getElementById('form-error-message').textContent = error.message;
  }
}

async function showAreaForm(params = null) {
  const areaId = typeof params === 'string' ? params : (params && params.id);
  await renderAreaForm(areaId);
}

export { showAreaForm };
