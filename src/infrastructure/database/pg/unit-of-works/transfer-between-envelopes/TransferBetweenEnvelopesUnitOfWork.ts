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

      return Either.success<DomainError, void>(undefined);
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
          client.release();
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }

      return Either.error<DomainError, void>(
        new EnvelopeTransferExecutionError(
          'Unexpected error during envelope transfer execution: ' +
            (error as Error).message,
        ),
      );
    }
  }
}
