import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { DATABASE_UNAVAILABLE_MESSAGE, isPrismaConnectionError } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return sendError(res, error.message, error.errors, error.statusCode);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return sendError(res, 'Resource already exists', [error.meta], 409);
    }

    if (error.code === 'P2025') {
      return sendError(res, 'Resource not found', [error.meta], 404);
    }
  }

  if (isPrismaConnectionError(error)) {
    logger.error('Database connection unavailable', error);
    return sendError(res, DATABASE_UNAVAILABLE_MESSAGE, [], 503);
  }

  logger.error('Unhandled error', error);

  return sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    env.NODE_ENV === 'production' ? [] : [error.stack],
    500
  );
};
