import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase } from '../../../shared/IUseCase';
import { ReconcileAccountDto } from './ReconcileAccountDto';

export class ReconcileAccountUseCase implements IUseCase<ReconcileAccountDto> {
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly reconcileAccountUnitOfWork: IReconcileAccountUnitOfWork,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
    private readonly adjustmentCategoryId: string,
  ) {}

  async execute(
    dto: ReconcileAccountDto,
  ): Promise<Either<DomainError | ApplicationError, { id: string }>> {
    const accountResult = await this.getAccountRepository.execute(
      dto.accountId,
    );

    if (accountResult.hasError) {
      return Either.errors([new AccountRepositoryError()]);
    }

    if (!accountResult.data) {
      return Either.errors([new AccountNotFoundError()]);
    }

    const account = accountResult.data as Account;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      account.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    if (!authResult.data) {
      return Either.errors([new InsufficientPermissionsError()]);
    }

    const diff = dto.realBalance - (account.balance ?? 0);

    const reconcileResult = account.reconcile(
      dto.realBalance,
      dto.justification,
    );

    if (reconcileResult.hasError) {
      return Either.errors(reconcileResult.errors);
    }

    const transactionResult = Transaction.create({
      description: 'Ajuste de Reconciliação',
      amount: Math.abs(diff),
      type: diff > 0 ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
      accountId: account.id,
      budgetId: account.budgetId!,
      categoryId: this.adjustmentCategoryId,
      transactionDate: new Date(),
      status: TransactionStatusEnum.COMPLETED,
    });

    if (transactionResult.hasError) {
      const msg = transactionResult.errors.map((e) => e.message).join('; ');
      return Either.errors([new TransactionCreationFailedError(msg)]);
    }

    const transaction = transactionResult.data!;

    const persistResult =
      await this.reconcileAccountUnitOfWork.executeReconciliation({
        account,
        transaction,
      });

    if (persistResult.hasError) {
      return Either.errors([new TransactionPersistenceFailedError()]);
    }

    const events = [...account.getEvents(), ...transaction.getEvents()];
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        account.clearEvents();
        transaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success({ id: account.id });
  }
}
