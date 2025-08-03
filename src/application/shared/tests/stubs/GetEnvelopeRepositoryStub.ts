import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';

import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetEnvelopeRepositoryStub implements IGetEnvelopeRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public mockEnvelope: Envelope | null = null;
  public executeCalls: string[] = [];

  async execute(id: string): Promise<Either<RepositoryError, Envelope | null>> {
    this.executeCalls.push(id);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    if (this.shouldReturnNull) {
      return Either.success(null);
    }
    return Either.success(this.mockEnvelope);
  }
}
