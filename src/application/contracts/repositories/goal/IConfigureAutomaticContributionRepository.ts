import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

export interface IConfigureAutomaticContributionRepository {
  execute(goal: Goal): Promise<Either<RepositoryError, void>>;
}
