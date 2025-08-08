import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { ITransferBetweenEnvelopesUnitOfWork } from '../../../contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork';
import { RepositoryError } from '../../errors/RepositoryError';

export class TransferBetweenEnvelopesUnitOfWorkStub
  implements ITransferBetweenEnvelopesUnitOfWork
{
  public shouldFail = false;
  public executeTransferCalls: Array<{
    sourceEnvelope: Envelope;
    targetEnvelope: Envelope;
  }> = [];

  async executeTransfer(params: {
    sourceEnvelope: Envelope;
    targetEnvelope: Envelope;
  }): Promise<Either<DomainError, void>> {
    this.executeTransferCalls.push(params);

    if (this.shouldFail) {
      return Either.error(
        new RepositoryError('Unit of work failure') as unknown as DomainError,
      );
    }

    return Either.success(undefined);
  }
}
