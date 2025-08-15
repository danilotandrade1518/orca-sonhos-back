import { HttpController, HttpMiddleware } from './http-types';

export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteDefinition {
  method: RouteMethod;
  path: string;
  controller: HttpController;
  middlewares?: HttpMiddleware[];
}

export interface IHttpServerAdapter {
  registerRoutes(routes: RouteDefinition[]): void;
  listen(port: number, callback?: () => void): void;
}
