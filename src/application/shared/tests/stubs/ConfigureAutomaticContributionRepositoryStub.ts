import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IConfigureAutomaticContributionRepository } from '../../../contracts/repositories/goal/IConfigureAutomaticContributionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class ConfigureAutomaticContributionRepositoryStub
  implements IConfigureAutomaticContributionRepository
{
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
