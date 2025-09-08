import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

export interface IGetGoalsByAccountRepository {
  execute(accountId: string): Promise<Either<RepositoryError, Goal[]>>;
}
