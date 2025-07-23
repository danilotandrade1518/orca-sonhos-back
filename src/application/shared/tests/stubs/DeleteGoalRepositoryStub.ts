import { Either } from '@either';

import { IDeleteGoalRepository } from '../../../contracts/repositories/goal/IDeleteGoalRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteGoalRepositoryStub implements IDeleteGoalRepository {
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(goalId: string): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(goalId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
