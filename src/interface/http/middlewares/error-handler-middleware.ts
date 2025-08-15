import { HttpMiddleware } from '../http-types';
import { logger } from '../../../shared/logging/logger';

export const errorHandlerMiddleware: HttpMiddleware = async (req, next) => {
  try {
    return await next();
  } catch (err) {
    const status = 500;
    const errorObj = err instanceof Error ? err : new Error('Unknown error');
    const activeLogger = req.logger || logger;
    activeLogger.error({
      msg: 'unhandled_error',
      path: req.path,
      requestId: req.requestId,
      stack: errorObj.stack,
      errorName: errorObj.name,
      errorType: 'INTERNAL_ERROR',
    });
    return {
      status,
      body: {
        errors: [
          {
            error: 'INTERNAL_ERROR',
            message: errorObj.message,
          },
        ],
        traceId: req.requestId,
      },
    };
  }
};
