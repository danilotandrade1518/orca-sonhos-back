import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { ICheckAccountDependenciesRepository } from '../../../contracts/repositories/account/ICheckAccountDependenciesRepository';
import { IDeleteAccountRepository } from '../../../contracts/repositories/account/IDeleteAccountRepository';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountDeletionFailedError } from '../../../shared/errors/AccountDeletionFailedError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { CannotDeleteAccountWithTransactionsError } from '../../../shared/errors/CannotDeleteAccountWithTransactionsError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { DeleteAccountDto } from './DeleteAccountDto';

export class DeleteAccountUseCase implements IUseCase<DeleteAccountDto> {
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly deleteAccountRepository: IDeleteAccountRepository,
    private readonly checkAccountDependenciesRepository: ICheckAccountDependenciesRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: DeleteAccountDto,
  ): Promise<Either<ApplicationError, UseCaseResponse>> {
    const accountResult = await this.getAccountRepository.execute(
      dto.accountId,
    );

    if (accountResult.hasError) {
      return Either.error(new AccountRepositoryError());
    }

    if (!accountResult.data) {
      return Either.error(new AccountNotFoundError());
    }

    const account = accountResult.data;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      account.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const dependenciesResult =
      await this.checkAccountDependenciesRepository.hasTransactions(
        dto.accountId,
      );

    if (dependenciesResult.hasError) {
      return Either.error(new AccountRepositoryError());
    }

    if (dependenciesResult.data) {
      return Either.error(new CannotDeleteAccountWithTransactionsError());
    }

    account.delete();

    const deleteResult = await this.deleteAccountRepository.execute(
      dto.accountId,
    );

    if (deleteResult.hasError) {
      return Either.error(new AccountDeletionFailedError());
    }

    const events = account.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        account.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success({ id: account.id });
  }
}
