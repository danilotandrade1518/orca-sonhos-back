import { HttpMiddleware } from '../http-types';
import { logger } from '../../../shared/logging/logger';
import { DomainError } from '@domain/shared/DomainError';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { mapErrorsToHttp } from '../mappers/error-mapper';

export const errorHandlerMiddleware: HttpMiddleware = async (req, next) => {
  try {
    return await next();
  } catch (err) {
    const activeLogger = req.logger || logger;
    const errorObj = err instanceof Error ? err : new Error('Unknown error');
    // If it's an application or domain error, map properly to HTTP (403/404/400), else 500.
    if (
      errorObj instanceof DomainError ||
      errorObj instanceof ApplicationError
    ) {
      // Map known domain/application errors via mapper (403/404/400)
      return mapErrorsToHttp([errorObj], req.requestId);
    }
    activeLogger.error({
      msg: 'unhandled_error',
      path: req.path,
      requestId: req.requestId,
      stack: errorObj.stack,
      errorName: errorObj.name,
      errorType: 'INTERNAL_ERROR',
    });
    return {
      status: 500,
      body: {
        errors: [{ error: 'INTERNAL_ERROR', message: errorObj.message }],
        traceId: req.requestId,
      },
    };
  }
};
