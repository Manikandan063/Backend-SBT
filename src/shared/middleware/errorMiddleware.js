import { handleError } from '../errorHandling/errorHandler.js';

export const errorMiddleware = (err, req, res, next) => {
  handleError(err, res);
};
