export function getStatusBadge(status) {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'ACTIVO') return '<span class="badge badge-success">' + status + '</span>';
    if (s === 'DISPONIBLE') return '<span class="badge badge-primary">' + status + '</span>';
    if (s === 'ASIGNADO') return '<span class="badge badge-secondary">' + status + '</span>';
    if (s === 'EN MANTENIMIENTO') return '<span class="badge badge-warning">' + status + '</span>';
    if (s === 'FINALIZADO') return '<span class="badge badge-danger">' + status + '</span>';
    if (s === 'CANCELADO' || s === 'BAJA' || s === 'BLOQUEADO') return '<span class="badge badge-dark">' + status + '</span>';
    if (s === 'INACTIVO') return '<span class="badge badge-light text-dark">' + status + '</span>';
    if (s === 'RESERVADA' || s === 'PENDIENTE') return '<span class="badge badge-info">' + status + '</span>';
    if (s === 'EN CURSO') return '<span class="badge badge-warning">' + status + '</span>';
    return '<span class="badge badge-info">' + status + '</span>';
} 