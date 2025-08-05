import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface IPayCreditCardBillUnitOfWork {
  executePayment(params: {
    debitTransaction: Transaction;
    bill: CreditCardBill;
  }): Promise<Either<DomainError, void>>;
}
