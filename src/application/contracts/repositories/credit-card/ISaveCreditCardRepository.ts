import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface ISaveCreditCardRepository {
  execute(card: CreditCard): Promise<Either<RepositoryError, void>>;
}
