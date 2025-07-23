import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IAddGoalRepository } from '../../../contracts/repositories/goal/IAddGoalRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class AddGoalRepositoryStub implements IAddGoalRepository {
  public shouldFail = false;
  public executeCalls: Goal[] = [];

  async execute(goal: Goal): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(goal);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
