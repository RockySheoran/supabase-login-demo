import { Request, Response, NextFunction } from 'express';
import { PostgrestError } from '@supabase/supabase-js';
import { ZodError } from 'zod'; // If using Zod for validation

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: string;
  errors?: any[];
}

export const errorHandler = (
  err: AppError | PostgrestError | ZodError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ERROR]', err);

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'server_error';
  let details = err.details || null;
  let errors = err.errors || null;

  // Handle specific error types
  if (err instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'validation_error';
    errors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
  } else if (err.code) {
    // Supabase PostgREST errors
    switch (err.code) {
      case '23505':
        statusCode = 409;
        message = 'Duplicate entry';
        errorCode = 'duplicate_entry';
        break;
      case '42501':
        statusCode = 403;
        message = 'Not authorized';
        errorCode = 'not_authorized';
        break;
      case 'PGRST204':
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'not_found';
        break;
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'invalid_token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'token_expired';
  }

  // Handle specific HTTP errors
  if (err.statusCode === 400) {
    message = err.message || 'Bad Request';
    errorCode = err.code || 'bad_request';
  }

  // Development vs production error response
  const response: Record<string, any> = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      ...(errors && { errors })
    }
  };

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
    response.error.fullError = err;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  next(error);
};

export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };