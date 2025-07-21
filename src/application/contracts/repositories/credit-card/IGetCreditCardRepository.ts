import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface IGetCreditCardRepository {
  execute(id: string): Promise<Either<RepositoryError, CreditCard | null>>;
}
