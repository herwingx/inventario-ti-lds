/**
 * @module Config/DB
 * @description Configuración y utilidades para la conexión a la base de datos MySQL.
 * Facilita el uso de un pool de conexiones y una funcion 'query' helper.
 */
// ! Configuración y utilidades para la conexión a la base de datos MySQL

/**
 * @typedef {Object} DbConfig
 * @property {string} host - Host de la base de datos.
 * @property {string} user - Usuario de la base de datos.
 * @property {string} password - Contraseña de la base de datos.
 * @property {string} database - Nombre de la base de datos.
 * @property {number} port - Puerto de la base de datos.
 * @property {boolean} waitForConnections - Esperar conexiones libres.
 * @property {number} connectionLimit - Límite de conexiones.
 * @property {number} queueLimit - Límite de cola.
 */

// * Importo la librería mysql2 con soporte para Promesas (async/await)
const mysql = require('mysql2/promise');

// * Configuración del pool de conexiones usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST, // * Host de la base de datos (ej: localhost o IP del contenedor)
  user: process.env.DB_USER, // * Usuario de la base de datos
  password: process.env.DB_PASSWORD, // * Contraseña del usuario
  database: process.env.DB_NAME, // * Nombre de la base de datos
  port: process.env.DB_PORT, // * Puerto de la base de datos (asegúrate que sea número)
  waitForConnections: true, // * Espera si todas las conexiones están ocupadas
  connectionLimit: 10, // * Máximo de conexiones simultáneas en el pool
  queueLimit: 0 // * Sin límite de peticiones en cola
};

/**
 * Pool de conexiones MySQL.
 * Mantiene un grupo de conexiones listas para usar para mayor eficiencia.
 */
const pool = mysql.createPool(dbConfig);

/**
 * Ejecuta una consulta SQL usando el pool de conexiones.
 *
 * @param {string} sql - La consulta SQL a ejecutar.
 * @param {Array<any>} [params] - Parámetros para la consulta preparada.
 * @returns {Promise<Array<any>>} - Promesa con las filas resultantes.
 */
const query = async (sql, params) => {
  const [rows, fields] = await pool.execute(sql, params);
  return rows; // * Devuelvo solo las filas resultantes (ignoro metadatos)
};

/**
 * Obtiene una conexión del pool para transacciones manuales.
 *
 * @returns {Promise<import('mysql2/promise').PoolConnection>} - Conexión del pool.
 */
const getConnection = async () => {
  const connection = await pool.getConnection();
  console.log('Herwing obtuvo una conexión del pool.'); // ! Para depuración
  return connection;
};

// * Exporto el pool y la función query para usarlos en los controladores y otros módulos
module.exports = {
  pool,
  query,
  getConnection
};
// * Mensaje de depuración para saber que este archivo se ejecutó correctamente
console.log('Módulo de conexión a base de datos cargado.'); 