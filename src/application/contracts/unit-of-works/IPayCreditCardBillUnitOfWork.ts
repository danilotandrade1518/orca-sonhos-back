import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { CreditCardBillPaidEvent } from '@domain/aggregates/credit-card-bill/events/CreditCardBillPaidEvent';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface IPayCreditCardBillUnitOfWork {
  executePayment(params: {
    debitTransaction: Transaction;
    bill: CreditCardBill;
    billPaidEvent: CreditCardBillPaidEvent;
  }): Promise<Either<DomainError, void>>;
}
