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

    if (
      errorObj instanceof DomainError ||
      errorObj instanceof ApplicationError
    ) {
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
