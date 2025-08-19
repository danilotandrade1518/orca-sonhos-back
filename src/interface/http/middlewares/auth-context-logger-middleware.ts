import { HttpMiddleware } from '../http-types';

export const authContextLoggerMiddleware: HttpMiddleware = async (
  req,
  next,
) => {
  if (req.principal && req.logger?.child) {
    req.logger = req.logger.child({ userId: req.principal.userId });
  }
  return next();
};
