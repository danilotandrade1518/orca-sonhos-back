import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { Account } from '../../account/account-entity/Account';
import { CreditCardBill } from '../credit-card-bill-entity/CreditCardBill';
import { Transaction } from '../../transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '../../transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { CreditCardBillPaidEvent } from '../events/CreditCardBillPaidEvent';
import { CreditCardBillAlreadyDeletedError } from '../errors/CreditCardBillAlreadyDeletedError';
import { BillStatusEnum } from '../value-objects/bill-status/BillStatus';
import { NotFoundError } from '../../../shared/errors/NotFoundError';

export class PayCreditCardBillDomainService {
  createPaymentOperation(
    bill: CreditCardBill,
    account: Account,
    budgetId: string,
    amount: number,
    paidBy: string,
    paidAt: Date = new Date(),
    paymentCategoryId: string,
  ): Either<
    DomainError,
    {
      debitTransaction: Transaction;
      billPaidEvent: CreditCardBillPaidEvent;
    }
  > {
    const validationResult = this.canPayBill(bill, account, budgetId, amount);
    if (validationResult.hasError) {
      return Either.errors(validationResult.errors);
    }

    const paymentCategoryIdVO = EntityId.fromString(paymentCategoryId);
    if (paymentCategoryIdVO.hasError) {
      return Either.errors(paymentCategoryIdVO.errors);
    }

    const debitTransactionResult = Transaction.create({
      accountId: account.id,
      categoryId: paymentCategoryIdVO.value!.id,
      budgetId: account.budgetId!,
      amount: amount,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: paidAt,
      description: `Pagamento fatura cartão - ${bill.id}`,
    });

    if (debitTransactionResult.hasError) {
      return Either.errors(debitTransactionResult.errors);
    }

    const billMarkResult = bill.markAsPaid();
    if (billMarkResult.hasError) {
      return Either.errors(billMarkResult.errors);
    }

    const billPaidEvent = new CreditCardBillPaidEvent(
      bill.id,
      bill.creditCardId,
      amount,
      paidAt,
    );

    return Either.success({
      debitTransaction: debitTransactionResult.data!,
      billPaidEvent,
    });
  }

  private canPayBill(
    bill: CreditCardBill,
    account: Account,
    budgetId: string,
    amount: number,
  ): Either<DomainError, void> {
    if (bill.isDeleted) {
      return Either.errors([new CreditCardBillAlreadyDeletedError()]);
    }

    if (bill.status === BillStatusEnum.PAID) {
      return Either.success(undefined);
    }

    if (account.budgetId !== budgetId) {
      return Either.errors([new NotFoundError('Account')]);
    }

    const accountTransferResult = account.canTransfer(amount);
    if (accountTransferResult.hasError) {
      return accountTransferResult;
    }

    return Either.success(undefined);
  }
}
