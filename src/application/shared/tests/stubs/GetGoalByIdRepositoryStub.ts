import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IGetGoalByIdRepository } from '../../../contracts/repositories/goal/IGetGoalByIdRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetGoalByIdRepositoryStub implements IGetGoalByIdRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public executeCalls: string[] = [];
  private goals: Record<string, Goal> = {};
  private _mockGoal: Goal | null = null;

  set mockGoal(goal: Goal | null) {
    this._mockGoal = goal;
    if (goal) {
      this.goals[goal.id] = goal;
    } else {
      this.goals = {};
    }
  }

  setGoal(goal: Goal | null) {
    this.mockGoal = goal;
  }

  async execute(goalId: string): Promise<Either<RepositoryError, Goal | null>> {
    this.executeCalls.push(goalId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    const goal = this.goals[goalId] || this._mockGoal;
    return Either.success(goal);
  }
}
