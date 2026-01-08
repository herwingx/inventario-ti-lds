// src/controllers/auth.controller.js
const { query } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Autentica un usuario y genera un token JWT.
 * Valida credenciales contra el hash almacenado en la base de datos.
 *
 * @param {import('express').Request} req - Objeto de solicitud Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función middleware next.
 * @returns {Promise<void>}
 */
const login = async (req, res, next) => {
    // * Obtengo el username y password del cuerpo de la petición.
    const { username, password } = req.body;
    console.log(`Login para usuario: "${username}"`);

    try {
        // * 1. Validación de Entrada
        if (!username || !password) {
            return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios.' });
        }

        // * 2. Buscar al Usuario en la Base de Datos
        // * Busco al usuario por su username. Es importante seleccionar el password_hash para compararlo.
        const sql = `SELECT u.id, u.username, u.password_hash, u.id_rol, r.nombre_rol
                     FROM usuarios_sistema u
                     JOIN roles r ON u.id_rol = r.id
                     WHERE u.username = ? AND u.id_status = 1`;
        const [user] = await query(sql, [username]);

        // ! Si no se encuentra el usuario o no está activo, devuelvo un error 401.
        // ! Doy un mensaje genérico para no revelar si el usuario existe o no (buena práctica de seguridad).
        if (!user) {
            console.warn(`Login fallido para usuario inexistente o inactivo: "${username}"`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // * 3. Comparar la Contraseña
        // * Uso bcrypt.compare para comparar de forma segura la contraseña en texto plano
        // * enviada por el usuario con el hash almacenado en la base de datos.
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        // * Si la comparación falla, las contraseñas no coinciden.
        if (!isPasswordCorrect) {
            console.warn(`Contraseña incorrecta para usuario: "${username}"`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // * 4. Generar el Token JWT
        // * Si las credenciales son correctas, genero un token.
        // * El "payload" es la información que quiero guardar dentro del token.
        // * Es información pública (codificada, no cifrada), así que NO poner datos sensibles aquí.
        const payload = {
            userId: user.id,
            username: user.username,
            roleId: user.id_rol
        };

        // * Firmo el token usando el payload, mi clave secreta de .env, y opciones como la expiración.
        // * '1h' significa que el token expirará en 1 hora. Podemos usar '7d', '30m', etc.
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '30d' // 30 días para facilitar el proceso
        });

        console.log(`Login exitoso para usuario: "${username}". Token generado.`);

        // * 5. Enviar la Respuesta
        // * Envío el token al frontend. También puedo enviar información útil del usuario.
        // ! NUNCA envíar el password_hash en la respuesta.
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                roleId: user.id_rol,
                roleName: user.nombre_rol
            }
        });

    } catch (error) {
        // * Paso el error al manejador global.
        console.error(`Error durante el proceso de login: ${error}`);
        next(error);
    }
};

const crypto = require('crypto');
const sendEmail = require('../utils/email');

// ... (login existente) ...

/**
 * Inicia el proceso de recuperación de contraseña.
 * Verifica el email, genera un token y envía el correo.
 */
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'El correo electrónico es obligatorio.' });
    }

    try {
        const [user] = await query('SELECT * FROM usuarios_sistema WHERE email = ?', [email]);

        if (!user) {
            // Por seguridad, no decimos si el usuario existe o no
            return res.status(200).json({ message: 'Si el correo existe, se enviarán las instrucciones.' });
        }

        // Generar token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 10); // Opcional: hashear token en BD

        // Expiración en 1 hora
        const expires = new Date(Date.now() + 3600000); // 1 hora
        // Formato MySQL YYYY-MM-DD HH:MM:SS
        const expiresFormatted = expires.toISOString().slice(0, 19).replace('T', ' ');

        // Guardar en BD (Guardamos token plano para este ejemplo simple, idealmente hash)
        // Como la columna es VARCHAR(255), guardaremos el token tal cual para enviarlo en URL y comprobar igualdad
        await query('UPDATE usuarios_sistema SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [resetToken, expiresFormatted, user.id]);

        // URL de reset en Frontend
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `
            <h1>Recuperación de Contraseña</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para continuar:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, ignora este correo.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Solicitud de Restablecimiento de Contraseña - Inventario TI',
            html: message
        });

        res.status(200).json({ message: 'Si el correo existe, se enviarán las instrucciones.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        next(error);
    }
};

/**
 * Restablece la contraseña usando un token válido.
 */
const resetPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token y nueva contraseña requeridos.' });
    }

    try {
        // Buscar usuario por token y validar expiración
        // NOW() en MySQL vs Date.now JS -> Usaremos JS para comparar o query directa
        // Hacemos query directa
        const [user] = await query(
            'SELECT * FROM usuarios_sistema WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [token]
        );

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña y limpiar token
        await query(
            'UPDATE usuarios_sistema SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: 'Contraseña actualizada correctamente. Inicia sesión.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        next(error);
    }
};

module.exports = {
    login,
    forgotPassword,
    resetPassword
}; 