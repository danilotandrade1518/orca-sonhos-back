import { Account } from '@domain/aggregates/account/account-entity/Account';
import { TransferBetweenAccountsDomainService } from '@domain/aggregates/account/services/TransferBetweenAccountsDomainService';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { ITransferBetweenAccountsUnitOfWork } from '../../../contracts/unit-of-works/ITransferBetweenAccountsUnitOfWork';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { TransferBetweenAccountsDto } from './TransferBetweenAccountsDto';

export class TransferBetweenAccountsUseCase
  implements IUseCase<TransferBetweenAccountsDto>
{
  private readonly transferBetweenAccountsDomainService: TransferBetweenAccountsDomainService;

  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly transferUnitOfWork: ITransferBetweenAccountsUnitOfWork,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
    private readonly transferCategoryId: string,
  ) {
    this.transferBetweenAccountsDomainService =
      new TransferBetweenAccountsDomainService();
  }

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

    const fromAccount = fromAccountResult.data as Account;
    const toAccount = toAccountResult.data as Account;

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

    const transferOperationResult =
      this.transferBetweenAccountsDomainService.createTransferOperation(
        fromAccount,
        toAccount,
        dto.amount,
        this.transferCategoryId,
      );

    if (transferOperationResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        transferOperationResult.errors,
      );
    }

    const {
      debitTransaction,
      creditTransaction,
      fromAccountEvent,
      toAccountEvent,
    } = transferOperationResult.data!;

    const executeResult = await this.transferUnitOfWork.executeTransfer({
      fromAccount,
      toAccount,
      debitTransaction,
      creditTransaction,
      fromAccountEvent,
      toAccountEvent,
    });

    if (executeResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        executeResult.errors,
      );
    }

    try {
      await this.eventPublisher.publishMany([fromAccountEvent, toAccountEvent]);
    } catch (error) {
      console.error('Failed to publish domain events:', error);
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: debitTransaction.id,
    });
  }
}
