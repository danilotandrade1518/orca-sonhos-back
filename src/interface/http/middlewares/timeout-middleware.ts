import { HttpMiddleware } from '../http-types';

export function createTimeoutMiddleware(ms: number): HttpMiddleware {
  return async (req, next) => {
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    return await Promise.race<ReturnType<typeof next>>([
      (async () => {
        try {
          const res = await next();
          return res;
        } finally {
          finished = true;
          if (timer) clearTimeout(timer);
        }
      })(),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          if (finished) return;
          req.logger?.warn?.({ msg: 'request_timeout', timeout_ms: ms });
          resolve({
            status: 504,
            body: {
              errors: [
                { error: 'TIMEOUT', message: `Request exceeded ${ms}ms limit` },
              ],
              traceId: req.requestId,
            },
          });
        }, ms);
      }) as unknown as ReturnType<typeof next>,
    ]);
  };
}
