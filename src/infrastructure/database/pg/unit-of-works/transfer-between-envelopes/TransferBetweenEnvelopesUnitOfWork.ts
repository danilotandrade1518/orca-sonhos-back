import { ITransferBetweenEnvelopesUnitOfWork } from '@application/contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EnvelopeTransferExecutionError } from '@domain/aggregates/envelope/errors/EnvelopeTransferExecutionError';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveEnvelopeRepository } from '../../repositories/envelope/save-envelope-repository/SaveEnvelopeRepository';
import { logger } from '@shared/logging/logger';
import {
  logMutationStart,
  logMutationEnd,
} from '@shared/observability/mutation-logger';

export class TransferBetweenEnvelopesUnitOfWork
  implements ITransferBetweenEnvelopesUnitOfWork
{
  private readonly saveEnvelopeRepository: SaveEnvelopeRepository;

  constructor(
    private readonly postgresConnectionAdapter: IPostgresConnectionAdapter,
  ) {
    this.saveEnvelopeRepository = new SaveEnvelopeRepository(
      postgresConnectionAdapter,
    );
  }

  public async executeTransfer(params: {
    sourceEnvelope: Envelope;
    targetEnvelope: Envelope;
  }): Promise<Either<DomainError, void>> {
    const { sourceEnvelope, targetEnvelope } = params;
    const started = process.hrtime.bigint();
    logMutationStart(logger, {
      operation: 'transfer_between_envelopes',
      entityType: 'envelope',
      entityId: sourceEnvelope.id,
    });

    let client: IDatabaseClient | undefined;

    try {
      client = await this.postgresConnectionAdapter.getClient();
      await client.query('BEGIN');

      const saveSourceResult =
        await this.saveEnvelopeRepository.executeWithClient(
          client,
          sourceEnvelope,
        );

      if (saveSourceResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new EnvelopeTransferExecutionError(
            'Failed to save source envelope: ' +
              saveSourceResult.errors[0].message,
          ),
        );
      }

      const saveTargetResult =
        await this.saveEnvelopeRepository.executeWithClient(
          client,
          targetEnvelope,
        );

      if (saveTargetResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new EnvelopeTransferExecutionError(
            'Failed to save target envelope: ' +
              saveTargetResult.errors[0].message,
          ),
        );
      }

      await client.query('COMMIT');
      client.release();
      const ended = process.hrtime.bigint();
      logMutationEnd(logger, {
        operation: 'transfer_between_envelopes',
        entityType: 'envelope',
        entityId: sourceEnvelope.id,
        durationMs: Number(ended - started) / 1_000_000,
        outcome: 'success',
      });
      return Either.success<DomainError, void>(undefined);
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
          client.release();
        } catch (rollbackError) {
          logger.error({
            msg: 'rollback_failure',
            operation: 'transfer_between_envelopes',
            error: (rollbackError as Error).message,
          });
        }
      }
      const ended = process.hrtime.bigint();
      logMutationEnd(logger, {
        operation: 'transfer_between_envelopes',
        entityType: 'envelope',
        entityId: sourceEnvelope.id,
        durationMs: Number(ended - started) / 1_000_000,
        outcome: 'error',
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
      });
      return Either.error<DomainError, void>(
        new EnvelopeTransferExecutionError(
          'Unexpected error during envelope transfer execution: ' +
            (error as Error).message,
        ),
      );
    }
  }
}
