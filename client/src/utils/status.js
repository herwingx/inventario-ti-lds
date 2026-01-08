/**
 * @fileoverview Utilidades para manejo de estados y colores.
 */

/**
 * Obtiene la severidad (color) para un estado dado.
 * @param {string|null} status - Nombre del estado (ej: 'Activo', 'Baja', 'Disponible').
 * @returns {string} Severidad de PrimeVue ('success', 'info', 'warn', 'danger', 'secondary', 'contrast').
 */
export const getStatusSeverity = (status) => {
  if (!status) return 'secondary';

  // Normalizar a mayúsculas para comparación
  const s = String(status).toUpperCase().trim();

  // ESTADOS POSITIVOS / DISPONIBLES (Verde)
  // "Disponible" (Equipos), "Activa" (Asignaciones - Vigente/En curso), "Habilitado"
  if (
    s === 'DISPONIBLE' ||
    s === 'ACTIVO' ||
    s === 'ACTIVA' ||
    s === 'HABILITADO' ||
    s === 'EN LINEA'
  ) {
    return 'success';
  }

  // ESTADOS ACTIVOS / EN USO DE MANERA NORMAL (Azul)
  // "Asignado" (Equipos en uso), "Ocupado"
  if (
    s === 'ASIGNADO' ||
    s === 'OCUPADO' ||
    s === 'EN USO'
  ) {
    return 'info';
  }

  // ESTADOS DE ATENCIÓN / PROCESO (Naranja/Amarillo)
  // "Mantenimiento", "Pendiente", "Revision"
  if (
    s.includes('MANTENIMIENTO') ||
    s.includes('PENDIENTE') ||
    s.includes('REVISION') ||
    s.includes('ESPERA')
  ) {
    return 'warn';
  }

  // ESTADOS CRÍTICOS / NEGATIVOS (Rojo)
  // "Baja", "Dañado", "Robado", "Cancelada", "Eliminado"
  if (
    s === 'BAJA' ||
    s === 'INACTIVO' ||
    s === 'INACTIVA' ||
    s.includes('DAÑADO') ||
    s.includes('ROBADO') ||
    s.includes('CANCELADA') ||
    s.includes('ELIMINADO') ||
    s.includes('BLOQUEADO')
  ) {
    return 'danger';
  }

  // ESTADOS NEUTROS / HISTÓRICOS (Gris)
  // "Finalizada" (Asignación antigua), "Reservada"
  if (
    s === 'FINALIZADA' ||
    s === 'RESERVADA' ||
    s === 'ARCHIVADO'
  ) {
    return 'secondary';
  }

  // Fallback
  return 'secondary';
}
