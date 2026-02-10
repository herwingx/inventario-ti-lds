const { cleanEnv, str, num, port, url } = require('envalid');

// Validar que las variables de entorno cruciales existan.
// Si falta alguna, la aplicación fallará al inicio (Fail Fast).
const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
    PORT: port(),
    DB_HOST: str(),
    DB_USER: str(),
    DB_PASSWORD: str(), // Puede estar vacía en dev local, pero debe estar definida
    DB_NAME: str(),
    JWT_SECRET: str(),
    FRONTEND_URL: url({ default: 'http://localhost:5173' }),
  });
};

module.exports = validateEnv;
