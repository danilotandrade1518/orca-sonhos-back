import { HttpMiddleware } from '../http-types';
import {
  ILogger,
  logger as defaultLogger,
} from '../../../shared/logging/logger';

export function createLoggingMiddleware(
  log: ILogger = defaultLogger,
): HttpMiddleware {
  return async (req, next) => {
    const start = process.hrtime.bigint();
    const response = await next();
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    log.info({
      msg: 'http_request',
      method: req.method,
      path: req.path,
      status: response.status,
      duration_ms: ms.toFixed(2),
      requestId: req.requestId,
    });
    return response;
  };
}

export const loggingMiddleware = createLoggingMiddleware();
