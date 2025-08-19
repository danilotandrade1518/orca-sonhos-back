import express, { Request, Response } from 'express';
import { getMutationCounters } from '@shared/observability/mutation-metrics';
import {
  HttpController,
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
} from '../http-types';
import { IHttpServerAdapter, RouteDefinition } from '../server-adapter';
import { requestIdMiddleware } from '../middlewares/request-id-middleware';
import { errorHandlerMiddleware } from '../middlewares/error-handler-middleware';
import { loggingMiddleware } from '../middlewares/logging-middleware';
import { contextLoggerMiddleware } from '../middlewares/context-logger-middleware';
import { createTimeoutMiddleware } from '../middlewares/timeout-middleware';

export class ExpressHttpServerAdapter implements IHttpServerAdapter {
  private app = express();
  private serverInstance: import('http').Server | null = null;
  private globalMiddlewares: HttpMiddleware[] = [
    requestIdMiddleware,
    contextLoggerMiddleware,
    createTimeoutMiddleware(Number(process.env.HTTP_TIMEOUT_MS || '5000')),
    loggingMiddleware,
  ];

  constructor() {
    this.app.use(express.json());
    // Lightweight metrics endpoint (internal use) - no auth for now; protect via network layer
    this.app.get('/internal/metrics/mutations', (_req, res) => {
      res.json({ mutations: getMutationCounters() });
    });
    // Configurable CORS (simple implementation, framework-agnostic behavior)
    if (process.env.CORS_ENABLED === 'true') {
      const originsRaw = process.env.CORS_ORIGINS || '*';
      const allowedOrigins = originsRaw.split(',').map((o) => o.trim());
      const allowMethods =
        process.env.CORS_METHODS || 'GET,POST,PUT,PATCH,DELETE';
      const allowHeaders =
        process.env.CORS_HEADERS || 'Content-Type,Authorization';
      const exposeHeaders =
        process.env.CORS_EXPOSE_HEADERS || 'X-Request-Id,TraceId';
      this.app.use((req, res, next) => {
        const origin = req.headers.origin as string | undefined;
        if (origin) {
          if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
          }
        }
        res.setHeader('Access-Control-Allow-Methods', allowMethods);
        res.setHeader('Access-Control-Allow-Headers', allowHeaders);
        res.setHeader('Access-Control-Expose-Headers', exposeHeaders);
        res.setHeader('Access-Control-Max-Age', '600');
        if (req.method === 'OPTIONS') {
          res.status(204).end();
          return;
        }
        next();
      });
    }
  }

  registerRoutes(routes: RouteDefinition[]) {
    routes.forEach((route) => {
      const handler = this.compose(
        [...this.globalMiddlewares, ...(route.middlewares || [])],
        route.controller,
      );

      const expressHandler = async (req: Request, res: Response) => {
        const httpReq: HttpRequest = {
          method: route.method,
          path: req.path,
          headers: req.headers as Record<string, string>,
          body: req.body,
          params: req.params,
          query: req.query as Record<string, string>,
          requestId: (req.headers['x-request-id'] as string) || '',
          raw: req,
        };
        try {
          const httpRes = await handler(httpReq);
          res.status(httpRes.status);
          if (httpRes.headers) {
            for (const [k, v] of Object.entries(httpRes.headers)) {
              if (v !== undefined) res.setHeader(k, String(v));
            }
          }
          if (httpRes.body !== undefined) {
            res.json(httpRes.body);
            return;
          }
          res.end();
        } catch (err) {
          const originalErr = err;
          const errorHandled = await errorHandlerMiddleware(
            httpReq,
            async () => {
              throw originalErr;
            },
          );
          res.status(errorHandled.status);
          if (errorHandled.body) {
            res.json(errorHandled.body);
            return;
          }
          res.end();
        }
      };

      switch (route.method) {
        case 'GET':
          this.app.get(route.path, expressHandler);
          break;
        case 'POST':
          this.app.post(route.path, expressHandler);
          break;
        case 'PUT':
          this.app.put(route.path, expressHandler);
          break;
        case 'PATCH':
          this.app.patch(route.path, expressHandler);
          break;
        case 'DELETE':
          this.app.delete(route.path, expressHandler);
          break;
        default:
          throw new Error(`Unsupported method ${route.method}`);
      }
    });
  }

  addGlobalMiddleware(mw: HttpMiddleware) {
    this.globalMiddlewares.push(mw);
  }

  listen(port: number, callback?: () => void) {
    this.serverInstance = this.app.listen(port, callback);
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.serverInstance) return resolve();
      this.serverInstance.close(() => resolve());
      this.serverInstance = null;
    });
  }

  // For test environments to drop references
  dispose() {
    this.globalMiddlewares = [];
  }

  private compose(
    middlewares: HttpMiddleware[],
    controller: HttpController,
  ): (req: HttpRequest) => Promise<HttpResponse> {
    return async (req: HttpRequest): Promise<HttpResponse> => {
      let idx = -1;
      const dispatch = async (i: number): Promise<HttpResponse> => {
        if (i <= idx) throw new Error('next() called multiple times');
        idx = i;
        const fn =
          i === middlewares.length
            ? controller.handle.bind(controller)
            : middlewares[i];
        return fn(req, () => dispatch(i + 1));
      };
      return dispatch(0);
    };
  }

  get rawApp() {
    return this.app;
  }
}
