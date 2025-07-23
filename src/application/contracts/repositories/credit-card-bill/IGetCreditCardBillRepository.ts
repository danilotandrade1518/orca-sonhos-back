import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface IGetCreditCardBillRepository {
  execute(id: string): Promise<Either<RepositoryError, CreditCardBill | null>>;
}
