/**
 * @module Middleware/ErrorHandler
 * @description Centralized error handling middleware.
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';

    // Log the error
    if (statusCode >= 500) {
        logger.error(`[Internal Error] ${err.message}
${err.stack}`);
    } else {
        logger.warn(`[Client Error] ${statusCode} - ${err.message}`);
    }

    // Response object
    const response = {
        status: 'error',
        message: err.isOperational || !isProd ? err.message : 'Ocurrió un error interno en el servidor',
        ...(isProd ? {} : { stack: err.stack, details: err.details })
    };

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
