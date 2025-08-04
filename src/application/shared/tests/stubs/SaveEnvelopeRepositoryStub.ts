import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';

import { ISaveEnvelopeRepository } from '../../../contracts/repositories/envelope/ISaveEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class SaveEnvelopeRepositoryStub implements ISaveEnvelopeRepository {
  public shouldFail = false;
  public executeCalls: Envelope[] = [];

  async execute(envelope: Envelope): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(envelope);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
