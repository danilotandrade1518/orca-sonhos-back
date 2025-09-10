import { Either } from '@either';

import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { IGetGoalsByAccountRepository } from '../../../contracts/repositories/goal/IGetGoalsByAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetGoalsByAccountRepositoryStub
  implements IGetGoalsByAccountRepository
{
  public shouldFail = false;
  public executeCalls: string[] = [];
  private goalsByAccount: Record<string, Goal[]> = {};

  setGoalsForAccount(accountId: string, goals: Goal[]) {
    this.goalsByAccount[accountId] = goals;
  }

  async execute(accountId: string): Promise<Either<RepositoryError, Goal[]>> {
    this.executeCalls.push(accountId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    const goals = this.goalsByAccount[accountId] || [];
    return Either.success(goals);
  }
}
