import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';

import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';
import { DomainError } from '@domain/shared/DomainError';

export class GetEnvelopeRepositoryStub implements IGetEnvelopeRepository {
  public shouldFail = false;
  public mockEnvelopes: Record<string, Envelope> = {};
  public executeCalls: string[] = [];

  async execute(id: string): Promise<Either<DomainError, Envelope | null>> {
    this.executeCalls.push(id);

    if (this.shouldFail) {
      return Either.error(
        new RepositoryError('Repository failure') as unknown as DomainError,
      );
    }

    return Either.success(this.mockEnvelopes[id] ?? null);
  }
}
