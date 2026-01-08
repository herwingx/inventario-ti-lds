/**
 * @fileoverview Utilidades para manejo de estados y colores.
 */

/**
 * Obtiene la severidad (color) para un estado dado.
 * @param {string|null} status - Nombre del estado (ej: 'Activo', 'Baja', 'Disponible').
 * @returns {string} Severidad de PrimeVue ('success', 'info', 'warn', 'danger', 'secondary', 'contrast', 'purple', 'cyan', 'slate', 'pink', 'indigo').
 */
export const getStatusSeverity = (status) => {
  if (!status) return 'secondary';

  // Normalizar a mayúsculas para comparación
  const s = String(status).toUpperCase().trim();

  // ESTADOS POSITIVOS / DISPONIBLES (Verde Esmeralda)
  // "Disponible" (Equipos), "Activa" (Asignaciones - Vigente/En curso), "Habilitado"
  if (
    s === 'DISPONIBLE' ||
    s === 'ACTIVO' ||
    s === 'ACTIVA' ||
    s === 'HABILITADO' ||
    s === 'EN LINEA' ||
    s === 'OPERATIVO'
  ) {
    return 'success';
  }

  // ESTADOS ACTIVOS / EN USO DE MANERA NORMAL (Azul)
  // "Asignado" (Equipos en uso), "Ocupado"
  if (
    s === 'ASIGNADO' ||
    s === 'OCUPADO' ||
    s === 'EN USO' ||
    s === 'ASIGNADO A RECEPCION'
  ) {
    return 'info';
  }

  // ESTADOS DE ATENCIÓN / PROCESO (Naranja/Amarillo)
  // "Mantenimiento", "Pendiente", "Revision"
  if (
    s.includes('MANTENIMIENTO') ||
    s.includes('PENDIENTE') ||
    s.includes('REVISION') ||
    s.includes('ESPERA') ||
    s.includes('REPARACION')
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
    s.includes('BLOQUEADO') ||
    s.includes('PERDIDO')
  ) {
    return 'danger';
  }

  // ESTADOS COMPLETADOS (Púrpura) - Indica algo terminado exitosamente
  // "Finalizada" (Asignación antigua/completada)
  if (
    s === 'FINALIZADA' ||
    s === 'FINALIZADO' ||
    s === 'COMPLETADO' ||
    s === 'COMPLETADA' ||
    s === 'CERRADO' ||
    s === 'CERRADA'
  ) {
    return 'purple';
  }

  // ESTADOS RESERVADOS / APARTADOS (Cyan) - Indica algo especial/separado
  // "Reservada", "Apartado"
  if (
    s === 'RESERVADA' ||
    s === 'RESERVADO' ||
    s === 'APARTADO' ||
    s === 'APARTADA' ||
    s === 'PRESTAMO' ||
    s === 'PRESTADO'
  ) {
    return 'cyan';
  }

  // ESTADOS HISTÓRICOS / ARCHIVADOS (Índigo) - Material de archivo
  if (
    s === 'ARCHIVADO' ||
    s === 'ARCHIVADA' ||
    s === 'HISTORICO' ||
    s === 'HISTORICA'
  ) {
    return 'indigo';
  }

  // ESTADOS OFFLINE / DESCONECTADOS (Rosa/Pink)
  if (
    s === 'OFFLINE' ||
    s === 'DESCONECTADO' ||
    s === 'SIN CONEXION'
  ) {
    return 'pink';
  }

  // ESTADOS NUEVOS / EN GARANTÍA (Slate)
  if (
    s === 'NUEVO' ||
    s === 'NUEVA' ||
    s.includes('GARANTIA')
  ) {
    return 'slate';
  }

  // Fallback
  return 'secondary';
}

