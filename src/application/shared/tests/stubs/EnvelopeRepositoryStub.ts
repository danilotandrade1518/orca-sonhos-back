import { Either } from '@either';

import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { IEnvelopeRepository } from '@application/contracts/repositories/envelope/IEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class EnvelopeRepositoryStub implements IEnvelopeRepository {
  public envelope: Envelope | null = null;
  public shouldFail = false;
  public getByIdCalls: string[] = [];
  public saveCalls: Envelope[] = [];

  async getById(id: string): Promise<Either<RepositoryError, Envelope | null>> {
    this.getByIdCalls.push(id);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('fail'));
    }
    return Either.success(this.envelope && this.envelope.id === id ? this.envelope : null);
  }

  async save(_envelope: Envelope): Promise<Either<RepositoryError, void>> {
    this.saveCalls.push(_envelope);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('fail'));
    }
    return Either.success();
  }
}
