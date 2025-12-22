import { ILogger } from 'shared/logging/logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Principal {
  userId: string;
}

export interface HttpRequest<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
> {
  method: HttpMethod;
  path: string;
  headers: Record<string, string | undefined>;
  body: TBody;
  params: TParams;
  query: TQuery;
  principal?: Principal;
  requestId: string;
  raw?: unknown;
  logger?: ILogger;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers?: Record<string, string>;
  body?: T;
}

export interface HttpController {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

export type HttpMiddleware = (
  request: HttpRequest,
  next: () => Promise<HttpResponse>,
) => Promise<HttpResponse>;
