import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';

import { ISaveEnvelopeRepository } from '../../../contracts/repositories/envelope/ISaveEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';
import { DomainError } from '@domain/shared/DomainError';

export class SaveEnvelopeRepositoryStub implements ISaveEnvelopeRepository {
  public shouldFail = false;
  public executeCalls: Envelope[] = [];

  async execute(envelope: Envelope): Promise<Either<DomainError, void>> {
    this.executeCalls.push(envelope);

    if (this.shouldFail) {
      return Either.error(
        new RepositoryError('Repository failure') as unknown as DomainError,
      );
    }

    return Either.success(undefined);
  }
}
