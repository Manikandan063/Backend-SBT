import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err, res) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Handle Zod Validation Errors
  if (err instanceof ZodError || err.name === 'ZodError') {
    statusCode = 400;
    message = err.errors ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') : err.message;
  }

  // Handle Sequelize Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  // Log error for debugging
  const logMsg = `[${new Date().toISOString()}] [ERROR] ${statusCode} - ${message}\n${statusCode === 500 ? err.stack : ''}\n`;
  console.error(logMsg);
  import('fs').then(fs => {
    fs.appendFileSync('error_runtime.log', logMsg);
  });

  res.status(statusCode).json({
    status: statusCode === 500 ? 'error' : 'fail',
    statusCode,
    message,
  });
};
