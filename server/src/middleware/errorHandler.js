const { errorResponse } = require('../utils/response');

function notFoundHandler(req, res) {
  return res.status(404).json(
    errorResponse('NOT_FOUND', `Route ${req.originalUrl} was not found.`)
  );
}

function generalErrorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json(
    errorResponse(err.code || 'SERVER_ERROR', message, process.env.NODE_ENV === 'development' ? err.stack : null)
  );
}

module.exports = { notFoundHandler, generalErrorHandler };
