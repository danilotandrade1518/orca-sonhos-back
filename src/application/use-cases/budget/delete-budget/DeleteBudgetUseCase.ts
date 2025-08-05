import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { ICheckBudgetDependenciesRepository } from '../../../contracts/repositories/budget/ICheckBudgetDependenciesRepository';
import { IDeleteBudgetRepository } from '../../../contracts/repositories/budget/IDeleteBudgetRepository';
import { IGetBudgetRepository } from '../../../contracts/repositories/budget/IGetBudgetRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { BudgetDeletionFailedError } from '../../../shared/errors/BudgetDeletionFailedError';
import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { CannotDeleteBudgetWithAccountsError } from '../../../shared/errors/CannotDeleteBudgetWithAccountsError';
import { CannotDeleteBudgetWithTransactionsError } from '../../../shared/errors/CannotDeleteBudgetWithTransactionsError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { OnlyOwnerCanDeleteBudgetError } from '../../../shared/errors/OnlyOwnerCanDeleteBudgetError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { DeleteBudgetDto } from './DeleteBudgetDto';

export class DeleteBudgetUseCase implements IUseCase<DeleteBudgetDto> {
  constructor(
    private readonly getBudgetRepository: IGetBudgetRepository,
    private readonly deleteBudgetRepository: IDeleteBudgetRepository,
    private readonly checkDependenciesRepository: ICheckBudgetDependenciesRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: DeleteBudgetDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const budgetResult = await this.getBudgetRepository.execute(dto.budgetId);

    if (budgetResult.hasError) {
      return Either.error(new BudgetRepositoryError());
    }

    if (!budgetResult.data) {
      return Either.error(new BudgetNotFoundError());
    }

    const budget = budgetResult.data;

    if (budget.ownerId !== dto.userId) {
      return Either.error(new OnlyOwnerCanDeleteBudgetError());
    }

    const accountsResult = await this.checkDependenciesRepository.hasAccounts(
      dto.budgetId,
    );

    if (accountsResult.hasError) {
      return Either.error(new BudgetDeletionFailedError());
    }

    if (accountsResult.data) {
      return Either.error(new CannotDeleteBudgetWithAccountsError());
    }

    const transactionsResult =
      await this.checkDependenciesRepository.hasTransactions(dto.budgetId);

    if (transactionsResult.hasError) {
      return Either.error(new BudgetDeletionFailedError());
    }

    if (transactionsResult.data) {
      return Either.error(new CannotDeleteBudgetWithTransactionsError());
    }

    const domainResult = budget.delete();

    if (domainResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        domainResult.errors,
      );
    }

    const deletedBudget = domainResult.data!;

    const deleteResult = await this.deleteBudgetRepository.execute(
      dto.budgetId,
    );

    if (deleteResult.hasError) {
      return Either.error(new BudgetDeletionFailedError());
    }

    return Either.success({ id: deletedBudget.id });
  }
}
