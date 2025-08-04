import { Account } from '@domain/aggregates/account/account-entity/Account';
import { ReconciliationAmount } from '@domain/aggregates/account/value-objects/reconciliation-amount/ReconciliationAmount';
import { ReconciliationJustification } from '@domain/aggregates/account/value-objects/reconciliation-justification/ReconciliationJustification';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IReconcileAccountRepository } from '../../../contracts/repositories/account/IReconcileAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { ReconcileAccountDto } from './ReconcileAccountDto';
import { IUseCase } from '../../../shared/IUseCase';

export class ReconcileAccountUseCase implements IUseCase<ReconcileAccountDto> {
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly reconcileAccountRepository: IReconcileAccountRepository,
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
    const diffVo = ReconciliationAmount.create(diff);
    const justificationVo = ReconciliationJustification.create(
      dto.justification,
    );

    const either = new Either<DomainError | ApplicationError, { id: string }>();
    if (diffVo.hasError) either.addManyErrors(diffVo.errors);
    if (justificationVo.hasError) either.addManyErrors(justificationVo.errors);
    if (either.hasError) return either;

    const reconcileResult = account.reconcile(
      dto.realBalance,
      justificationVo.value!.justification,
    );

    if (reconcileResult.hasError) {
      return Either.errors(reconcileResult.errors);
    }

    const transactionResult = Transaction.create({
      description: 'Ajuste de Reconciliação',
      amount: Math.abs(diffVo.value!.amount),
      type:
        diffVo.value!.amount > 0
          ? TransactionTypeEnum.INCOME
          : TransactionTypeEnum.EXPENSE,
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

    const persistResult = await this.reconcileAccountRepository.execute({
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
