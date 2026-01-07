// src/controllers/profile.controller.js
// ! Controlador para el perfil de usuario autenticado
// * Maneja obtención y actualización del perfil

const { query } = require('../config/db');
const bcrypt = require('bcrypt');

const saltRounds = 10;

/**
 * Obtiene el perfil del usuario autenticado.
 * 
 * @param {Object} req - Request con req.user (del middleware protect)
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const sql = `
            SELECT
                us.id,
                us.username,
                us.email,
                us.id_empleado,
                e.nombres AS nombre_empleado,
                e.apellidos AS apellido_empleado,
                e.puesto,
                us.id_rol,
                r.nombre_rol,
                us.fecha_registro,
                us.fecha_ultimo_login,
                us.fecha_actualizacion,
                us.id_status,
                st.nombre_status
            FROM usuarios_sistema AS us
            LEFT JOIN empleados AS e ON us.id_empleado = e.id
            JOIN roles AS r ON us.id_rol = r.id
            JOIN status AS st ON us.id_status = st.id
            WHERE us.id = ?
        `;

    const [user] = await query(sql, [userId]);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    next(error);
  }
};

/**
 * Actualiza el perfil del usuario autenticado.
 * Permite actualizar: email, password
 * 
 * @param {Object} req - Request con req.user y body con campos a actualizar
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { email, currentPassword, newPassword } = req.body;

    // * Validar que se envíe al menos un campo
    if (!email && !newPassword) {
      return res.status(400).json({ message: 'Debes proporcionar al menos un campo para actualizar.' });
    }

    const updates = [];
    const params = [];

    // * Validar y preparar email
    if (email !== undefined) {
      if (email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'El formato del email no es válido.' });
        }
      }
      updates.push('email = ?');
      params.push(email.trim() === '' ? null : email);
    }

    // * Validar y preparar cambio de contraseña
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Debes proporcionar tu contraseña actual para cambiarla.' });
      }

      // * Verificar contraseña actual
      const [currentUser] = await query('SELECT password_hash FROM usuarios_sistema WHERE id = ?', [userId]);
      if (!currentUser) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      const isPasswordCorrect = await bcrypt.compare(currentPassword, currentUser.password_hash);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
      }

      // * Hashear nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
    }

    // * Ejecutar actualización
    const sql = `UPDATE usuarios_sistema SET ${updates.join(', ')}, fecha_actualizacion = NOW() WHERE id = ?`;
    params.push(userId);

    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({ message: 'Perfil actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El email ya está en uso por otro usuario.' });
    }
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
