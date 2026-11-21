import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Occurred]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return sendError(res, 'Validation Error', 400, messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `A record with this ${field} already exists.`, 409, [`Duplicate value for ${field}`]);
  }

  // Multer upload error
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'Uploaded file exceeds the maximum limit (25MB).', 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, statusCode);
};

