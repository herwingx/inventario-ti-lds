// public/js/utils/selectTheme.js
// * Utilidad para manejar el color del texto en selects según el tema oscuro

/**
 * Actualiza las clases de los selects para el tema oscuro
 * Agrega la clase 'has-value' cuando el select tiene una opción válida seleccionada
 */
function updateSelectThemeClasses() {
    // Actualizar selects nativos
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        if (select.value && select.value !== '') {
            select.classList.add('has-value');
        } else {
            select.classList.remove('has-value');
        }
    });

    // Actualizar select2
    const select2Containers = document.querySelectorAll('.select2-container');
    select2Containers.forEach(container => {
        const originalSelect = container.previousElementSibling;
        if (originalSelect && originalSelect.tagName === 'SELECT') {
            if (originalSelect.value && originalSelect.value !== '') {
                container.classList.add('has-value');
            } else {
                container.classList.remove('has-value');
            }
        }
    });
}

/**
 * Inicializa los listeners para los selects
 */
function initSelectThemeHandlers() {
    // Listener para selects nativos
    document.addEventListener('change', function(event) {
        if (event.target.tagName === 'SELECT') {
            updateSelectThemeClasses();
        }
    });

    // Listener para select2
    if (window.$ && $.fn.select2) {
        $(document).on('select2:select select2:unselect', function() {
            setTimeout(updateSelectThemeClasses, 10);
        });
    }

    // Actualizar al cargar la página
    document.addEventListener('DOMContentLoaded', updateSelectThemeClasses);
    
    // Actualizar cuando se rendericen nuevos formularios
    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'SELECT' || node.querySelector('select') || node.classList.contains('select2-container')) {
                            shouldUpdate = true;
                        }
                    }
                });
            }
        });
        if (shouldUpdate) {
            setTimeout(updateSelectThemeClasses, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Exportar funciones
export { updateSelectThemeClasses, initSelectThemeHandlers };