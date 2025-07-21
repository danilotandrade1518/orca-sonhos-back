import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface IDeleteCreditCardRepository {
  execute(id: string): Promise<Either<RepositoryError, void>>;
}
