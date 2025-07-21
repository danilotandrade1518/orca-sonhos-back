import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface ICheckCreditCardDependenciesRepository {
  execute(creditCardId: string): Promise<Either<RepositoryError, boolean>>;
}
