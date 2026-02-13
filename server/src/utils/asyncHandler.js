/**
 * @module Utils/asyncHandler
 * @description Wrapper to catch errors in async express routes and pass them to the next middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
