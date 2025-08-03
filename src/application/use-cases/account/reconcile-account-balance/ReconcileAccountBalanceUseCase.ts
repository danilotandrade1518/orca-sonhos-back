import { Account } from '@domain/aggregates/account/account-entity/Account';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { ISaveAccountRepository } from '../../../contracts/repositories/account/ISaveAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountPersistenceFailedError } from '../../../shared/errors/AccountPersistenceFailedError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { AccountUpdateFailedError } from '../../../shared/errors/AccountUpdateFailedError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { ReconcileAccountBalanceDto } from './ReconcileAccountBalanceDto';

export class ReconcileAccountBalanceUseCase
  implements IUseCase<ReconcileAccountBalanceDto>
{
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly saveAccountRepository: ISaveAccountRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: ReconcileAccountBalanceDto,
  ): Promise<Either<ApplicationError | DomainError, UseCaseResponse>> {
    const accountResult = await this.getAccountRepository.execute(dto.accountId);

    if (accountResult.hasError) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new AccountRepositoryError(),
      ]);
    }

    if (!accountResult.data) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new AccountNotFoundError(),
      ]);
    }

    const account = accountResult.data as Account;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      account.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new InsufficientPermissionsError(),
      ]);
    }

    const reconcileResult = account.reconcile(dto.newBalance, dto.justification);

    if (reconcileResult.hasError) {
      const message = reconcileResult.errors
        .map((e) => e.message)
        .join('; ');
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new AccountUpdateFailedError(message),
      ]);
    }

    const saveResult = await this.saveAccountRepository.execute(account);

    if (saveResult.hasError) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new AccountPersistenceFailedError(),
      ]);
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

    return Either.success<ApplicationError | DomainError, UseCaseResponse>({
      id: account.id,
    });
  }
}
