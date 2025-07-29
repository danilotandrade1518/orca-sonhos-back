import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { TransferDirection } from '../../../shared/enums/TransferDirection';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { Transaction } from '../../transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '../../transaction/value-objects/transaction-type/TransactionType';
import { Account } from '../account-entity/Account';
import { AccountsFromDifferentBudgetsError } from '../errors/AccountsFromDifferentBudgetsError';
import { SameAccountTransferError } from '../errors/SameAccountTransferError';
import { AccountTransferredEvent } from '../events/AccountTransferredEvent';

export class TransferBetweenAccountsDomainService {
  createTransferOperation(
    fromAccount: Account,
    toAccount: Account,
    amount: number,
    transferCategoryId: string,
  ): Either<
    DomainError,
    {
      debitTransaction: Transaction;
      creditTransaction: Transaction;
      fromAccountEvent: AccountTransferredEvent;
      toAccountEvent: AccountTransferredEvent;
    }
  > {
    const validationResult = this.canTransfer(fromAccount, toAccount, amount);
    if (validationResult.hasError) {
      return Either.errors<
        DomainError,
        {
          debitTransaction: Transaction;
          creditTransaction: Transaction;
          fromAccountEvent: AccountTransferredEvent;
          toAccountEvent: AccountTransferredEvent;
        }
      >(validationResult.errors);
    }

    const transferCategoryIdVO = EntityId.fromString(transferCategoryId);

    if (transferCategoryIdVO.hasError) {
      return Either.errors<
        DomainError,
        {
          debitTransaction: Transaction;
          creditTransaction: Transaction;
          fromAccountEvent: AccountTransferredEvent;
          toAccountEvent: AccountTransferredEvent;
        }
      >(transferCategoryIdVO.errors);
    }

    const debitTransactionResult = Transaction.create({
      accountId: fromAccount.id,
      categoryId: transferCategoryIdVO.value!.id,
      budgetId: fromAccount.budgetId!,
      amount: amount,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(),
      description: `Transferência para ${toAccount.name}`,
    });

    if (debitTransactionResult.hasError) {
      return Either.errors<
        DomainError,
        {
          debitTransaction: Transaction;
          creditTransaction: Transaction;
          fromAccountEvent: AccountTransferredEvent;
          toAccountEvent: AccountTransferredEvent;
        }
      >(debitTransactionResult.errors);
    }

    const creditTransactionResult = Transaction.create({
      accountId: toAccount.id,
      categoryId: transferCategoryIdVO.value!.id,
      budgetId: toAccount.budgetId!,
      amount: amount,
      type: TransactionTypeEnum.INCOME,
      transactionDate: new Date(),
      description: `Transferência de ${fromAccount.name}`,
    });

    if (creditTransactionResult.hasError) {
      return Either.errors<
        DomainError,
        {
          debitTransaction: Transaction;
          creditTransaction: Transaction;
          fromAccountEvent: AccountTransferredEvent;
          toAccountEvent: AccountTransferredEvent;
        }
      >(creditTransactionResult.errors);
    }

    const fromAccountEvent = new AccountTransferredEvent(
      fromAccount.id,
      toAccount.id,
      amount,
      TransferDirection.DEBIT,
    );

    const toAccountEvent = new AccountTransferredEvent(
      toAccount.id,
      fromAccount.id,
      amount,
      TransferDirection.CREDIT,
    );

    return Either.success({
      debitTransaction: debitTransactionResult.data!,
      creditTransaction: creditTransactionResult.data!,
      fromAccountEvent,
      toAccountEvent,
    });
  }

  private canTransfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number,
  ): Either<DomainError, void> {
    if (fromAccount.budgetId !== toAccount.budgetId) {
      return Either.errors<DomainError, void>([
        new AccountsFromDifferentBudgetsError(),
      ]);
    }

    if (fromAccount.id === toAccount.id) {
      return Either.errors<DomainError, void>([new SameAccountTransferError()]);
    }

    const canTransferResult = fromAccount.canTransfer(amount);
    if (canTransferResult.hasError) {
      return canTransferResult;
    }

    const canReceiveResult = toAccount.canReceiveTransfer(amount);
    if (canReceiveResult.hasError) {
      return canReceiveResult;
    }

    return Either.success(undefined);
  }
}
