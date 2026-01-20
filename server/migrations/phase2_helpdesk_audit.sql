-- =============================================
-- FASE 2: HELPDESK, MANTENIMIENTO PROACTIVO & AUDITORÍA
-- Migración: phase2_helpdesk_audit.sql
-- Fecha: 2026-01-20
-- =============================================

-- 1. Modificar tabla equipos (agregar campos QR y mantenimiento)
-- Ejecutar cada ALTER por separado para compatibilidad con MariaDB
ALTER TABLE equipos ADD COLUMN qr_token VARCHAR(64) UNIQUE DEFAULT NULL;
ALTER TABLE equipos ADD COLUMN frecuencia_mant INT DEFAULT 6;
ALTER TABLE equipos ADD COLUMN proxima_fecha_mant DATE DEFAULT NULL;

-- 2. Tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT NOT NULL,
    id_usuario_reporta INT DEFAULT NULL COMMENT 'NULL si es reporte público',
    token_acceso VARCHAR(64) UNIQUE NOT NULL COMMENT 'Magic link para seguimiento',
    tipo_falla ENUM('HARDWARE', 'SOFTWARE', 'RED', 'IMPRESORA', 'OTRO') NOT NULL,
    descripcion TEXT NOT NULL,
    email_reporta VARCHAR(255) DEFAULT NULL COMMENT 'Email del usuario externo',
    nombre_reporta VARCHAR(100) DEFAULT NULL COMMENT 'Nombre del usuario externo',
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA') DEFAULT 'MEDIA',
    estatus ENUM('ABIERTO', 'EN_PROGRESO', 'PENDIENTE', 'RESUELTO', 'CERRADO') DEFAULT 'ABIERTO',
    evidencia_url VARCHAR(255) DEFAULT NULL,
    id_asignado_a INT DEFAULT NULL COMMENT 'Técnico asignado',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_cierre DATETIME DEFAULT NULL,
    FOREIGN KEY (id_equipo) REFERENCES equipos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_reporta) REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    FOREIGN KEY (id_asignado_a) REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    INDEX idx_ticket_token (token_acceso),
    INDEX idx_ticket_estatus (estatus),
    INDEX idx_ticket_equipo (id_equipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Comentarios/Chat de tickets
CREATE TABLE IF NOT EXISTS ticket_comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ticket INT NOT NULL,
    id_usuario INT DEFAULT NULL COMMENT 'NULL si es comentario público',
    contenido TEXT NOT NULL,
    es_interno TINYINT(1) DEFAULT 0 COMMENT 'Notas internas no visibles al usuario',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ticket) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios_sistema(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Evidencias de mantenimiento
CREATE TABLE IF NOT EXISTS mantenimiento_evidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_mantenimiento INT NOT NULL,
    url_archivo VARCHAR(255) NOT NULL,
    tipo ENUM('ANTES', 'DESPUES', 'DIAGNOSTICO') NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mantenimiento) REFERENCES mantenimientos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Logs de auditoría del sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT DEFAULT NULL,
    accion ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    valores_anteriores JSON DEFAULT NULL,
    valores_nuevos JSON DEFAULT NULL,
    ip_origen VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    INDEX idx_log_tabla (tabla_afectada),
    INDEX idx_log_fecha (fecha),
    INDEX idx_log_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Agregar rol SUPERVISOR si no existe
INSERT INTO roles (nombre_rol, descripcion) 
VALUES ('SUPERVISOR', 'Acceso limitado por sucursal asignada')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- 7. Agregar status para tickets en tabla status (si aplica)
INSERT INTO status (nombre_status, descripcion) VALUES
('Abierto', 'Ticket recién creado, pendiente de atención'),
('En Progreso', 'Ticket en proceso de resolución'),
('Pendiente', 'Ticket en espera de información o recurso'),
('Resuelto', 'Problema solucionado, pendiente de cierre'),
('Cerrado', 'Ticket finalizado')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
