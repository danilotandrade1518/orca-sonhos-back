import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IAddTransactionRepository } from '../../../contracts/repositories/transaction/IAddTransactionRepository';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { AccountsFromDifferentBudgetsError } from '../../../shared/errors/AccountsFromDifferentBudgetsError';
import { InvalidTransferAmountError } from '../../../shared/errors/InvalidTransferAmountError';
import { SameAccountTransferError } from '../../../shared/errors/SameAccountTransferError';
import { TransferTransactionCreationFailedError } from '../../../shared/errors/TransferTransactionCreationFailedError';
import { TransferBetweenAccountsDto } from './TransferBetweenAccountsDto';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';

const TRANSFER_CATEGORY_ID = process.env.TRANSFER_CATEGORY_ID as string;

export class TransferBetweenAccountsUseCase
  implements IUseCase<TransferBetweenAccountsDto>
{
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly addTransactionRepository: IAddTransactionRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: TransferBetweenAccountsDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const fromAccountResult = await this.getAccountRepository.execute(
      dto.fromAccountId,
    );

    if (fromAccountResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountRepositoryError(),
      ]);
    }

    if (!fromAccountResult.data) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountNotFoundError(),
      ]);
    }

    const fromAccount = fromAccountResult.data as Account;

    const toAccountResult = await this.getAccountRepository.execute(
      dto.toAccountId,
    );

    if (toAccountResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountRepositoryError(),
      ]);
    }

    if (!toAccountResult.data) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountNotFoundError(),
      ]);
    }

    const toAccount = toAccountResult.data as Account;

    if (fromAccount.budgetId !== toAccount.budgetId) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountsFromDifferentBudgetsError(),
      ]);
    }

    if (dto.fromAccountId === dto.toAccountId) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new SameAccountTransferError(),
      ]);
    }

    if (dto.amount <= 0) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new InvalidTransferAmountError(),
      ]);
    }

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      fromAccount.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new InsufficientPermissionsError(),
      ]);
    }

    const outDescription = `Transferência para ${toAccount.name}`;
    const inDescription = `Transferência de ${fromAccount.name}`;
    const fullOutDescription = dto.description
      ? `${outDescription} - ${dto.description}`
      : outDescription;
    const fullInDescription = dto.description
      ? `${inDescription} - ${dto.description}`
      : inDescription;

    const outTransactionResult = Transaction.create({
      description: fullOutDescription,
      amount: dto.amount,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(),
      categoryId: TRANSFER_CATEGORY_ID,
      budgetId: fromAccount.budgetId!,
      accountId: dto.fromAccountId,
    });

    if (outTransactionResult.hasError) {
      const errorMessage = outTransactionResult.errors
        .map((e) => e.message)
        .join('; ');
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new TransferTransactionCreationFailedError(errorMessage),
      ]);
    }

    const inTransactionResult = Transaction.create({
      description: fullInDescription,
      amount: dto.amount,
      type: TransactionTypeEnum.INCOME,
      transactionDate: new Date(),
      categoryId: TRANSFER_CATEGORY_ID,
      budgetId: toAccount.budgetId!,
      accountId: dto.toAccountId,
    });

    if (inTransactionResult.hasError) {
      const errorMessage = inTransactionResult.errors
        .map((e) => e.message)
        .join('; ');
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new TransferTransactionCreationFailedError(errorMessage),
      ]);
    }

    const outTransaction = outTransactionResult.data!;
    const inTransaction = inTransactionResult.data!;

    const outTransactionSaveResult =
      await this.addTransactionRepository.execute(outTransaction);

    if (outTransactionSaveResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new TransactionPersistenceFailedError(),
      ]);
    }

    const inTransactionSaveResult =
      await this.addTransactionRepository.execute(inTransaction);

    if (inTransactionSaveResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new TransactionPersistenceFailedError(),
      ]);
    }

    const events = [
      ...outTransaction.getEvents(),
      ...inTransaction.getEvents(),
    ];
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        outTransaction.clearEvents();
        inTransaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: outTransaction.id,
    });
  }
}
