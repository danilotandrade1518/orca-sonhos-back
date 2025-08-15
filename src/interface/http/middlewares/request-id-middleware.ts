import { randomUUID } from 'crypto';
import { HttpMiddleware, HttpResponse } from '../http-types';

export const requestIdMiddleware: HttpMiddleware = async (req, next) => {
  const incoming = req.headers['x-request-id'];
  req.requestId = (incoming as string) || req.requestId || randomUUID();
  const start = Date.now();
  const res: HttpResponse = await next();
  res.headers = {
    ...(res.headers || {}),
    'x-request-id': req.requestId,
    'x-response-time-ms': String(Date.now() - start),
  };
  return res;
};
