import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface ITransferBetweenEnvelopesUnitOfWork {
  executeTransfer(params: {
    sourceEnvelope: Envelope;
    targetEnvelope: Envelope;
  }): Promise<Either<DomainError, void>>;
}
