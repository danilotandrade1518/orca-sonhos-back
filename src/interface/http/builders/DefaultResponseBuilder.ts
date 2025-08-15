import { HttpResponse } from '../http-types';
import { DomainError } from '@domain/shared/DomainError';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { mapErrorsToHttp } from '../mappers/error-mapper';

type SuccessPayload = { id?: string } & Record<string, unknown>;

export class DefaultResponseBuilder {
  static created(traceId: string, payload?: SuccessPayload): HttpResponse {
    return this.build(201, traceId, payload);
  }

  static ok(traceId: string, payload?: SuccessPayload): HttpResponse {
    return this.build(200, traceId, payload);
  }

  static noContent(): HttpResponse {
    return { status: 204 };
  }

  static errors(
    traceId: string,
    errors: (DomainError | ApplicationError)[],
  ): HttpResponse {
    return mapErrorsToHttp(errors, traceId);
  }

  private static build(
    status: number,
    traceId: string,
    payload?: SuccessPayload,
  ): HttpResponse {
    return {
      status,
      body: {
        ...(payload || {}),
        traceId,
      },
    };
  }
}
