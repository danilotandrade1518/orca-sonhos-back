import { ILogger } from '../logging/logger';
import { incrementMutationCounter } from '@shared/observability/mutation-metrics';

export interface MutationLogContext {
  operation: string;
  entityType?: string;
  entityId?: string;
  requestId?: string;
  userId?: string;
}

export function logMutationStart(logger: ILogger, ctx: MutationLogContext) {
  logger.info({
    category: 'mutation.start',
    ...ctx,
  });
}

export function logMutationEnd(
  logger: ILogger,
  ctx: MutationLogContext & {
    durationMs: number;
    outcome: 'success' | 'error';
    errorName?: string;
    errorMessage?: string;
  },
) {
  logger.info({
    category: 'mutation.end',
    ...ctx,
  });
  incrementMutationCounter(ctx.operation, ctx.outcome);
}
