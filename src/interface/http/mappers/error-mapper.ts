import { DomainError } from '@domain/shared/DomainError';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { HttpResponse } from '../http-types';

export function mapErrorsToHttp(
  errors: (DomainError | ApplicationError)[],
  traceId: string,
): HttpResponse {
  const status = determineStatus(errors);
  return {
    status,
    body: {
      errors: errors.map((e) => {
        const maybe: unknown = (e as { errorObj?: unknown }).errorObj;
        if (maybe && typeof maybe === 'object') {
          const record = maybe as Record<string, unknown>;
          if (
            typeof record.error === 'string' &&
            typeof record.message === 'string'
          ) {
            return { error: record.error, message: record.message };
          }
        }
        return { error: e.name, message: e.message };
      }),
      traceId,
    },
  };
}

function determineStatus(errors: (DomainError | ApplicationError)[]): number {
  if (errors.some((e) => /NotFound/i.test(e.name))) return 404;
  if (
    errors.some((e) =>
      /Unauthorized|Forbidden|Authorization|AuthToken|Permission/i.test(e.name),
    )
  )
    return 403;
  return 400;
}
