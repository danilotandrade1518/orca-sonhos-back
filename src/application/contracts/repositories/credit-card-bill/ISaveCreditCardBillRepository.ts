import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface ISaveCreditCardBillRepository {
  execute(bill: CreditCardBill): Promise<Either<RepositoryError, void>>;
}
