import { Either } from '@either';

import { IDeleteEnvelopeRepository } from '../../../contracts/repositories/envelope/IDeleteEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteEnvelopeRepositoryStub implements IDeleteEnvelopeRepository {
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(id: string): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(id);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
