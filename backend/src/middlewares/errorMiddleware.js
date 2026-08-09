import StatusCodes from 'http-status-codes';
import { errorResponse } from '../utils/common/responseObjects.js';

export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = StatusCodes.NOT_FOUND;
  next(err);
};

export const globalErrorHandler = (err, req, res, _next) => {
  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';
  console.error(`[${status}] ${message}`, err.stack?.split('\n')[1] || '');
  res.status(status).json(errorResponse(message));
};
