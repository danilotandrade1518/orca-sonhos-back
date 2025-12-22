import { HttpMiddleware } from '../http-types';
import { logger } from '../../../shared/logging/logger';

export const contextLoggerMiddleware: HttpMiddleware = async (req, next) => {
  if (!req.logger) {
    req.logger =
      logger.child?.({ requestId: req.requestId, path: req.path }) || logger;
  }
  return next();
};
