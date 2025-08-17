import { Either } from '@either';

import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { ISaveTransactionRepository } from '../../../contracts/repositories/transaction/ISaveTransactionRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { TransactionUpdateFailedError } from '../../../shared/errors/TransactionUpdateFailedError';
import { IUseCase } from '../../../shared/IUseCase';
import { UpdateTransactionDto } from './UpdateTransactionDto';

export class UpdateTransactionUseCase
  implements IUseCase<UpdateTransactionDto>
{
  constructor(
    private getTransactionRepository: IGetTransactionRepository,
    private saveTransactionRepository: ISaveTransactionRepository,
    private getAccountRepository: IGetAccountRepository,
    private budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: UpdateTransactionDto,
  ): Promise<Either<ApplicationError, { id: string }>> {
    const transactionResult = await this.getTransactionRepository.execute(
      dto.id,
    );
    if (transactionResult.hasError) {
      return Either.error(new TransactionNotFoundError());
    }

    if (!transactionResult.data) {
      return Either.error(new TransactionNotFoundError());
    }

    const existingTransaction = transactionResult.data;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      existingTransaction.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, { id: string }>(authResult.errors);
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    if (dto.accountId && dto.accountId !== existingTransaction.accountId) {
      const accountResult = await this.getAccountRepository.execute(
        dto.accountId,
      );
      if (accountResult.hasError) {
        return Either.error(new AccountRepositoryError());
      }

      if (!accountResult.data) {
        return Either.error(new AccountNotFoundError());
      }
    }

    const updateResult = existingTransaction.update({
      description: dto.description ?? existingTransaction.description,
      amount: dto.amount ?? existingTransaction.amount,
      type: dto.type ?? existingTransaction.type,
      accountId: dto.accountId ?? existingTransaction.accountId,
      categoryId: dto.categoryId ?? existingTransaction.categoryId,
      transactionDate:
        dto.transactionDate ?? existingTransaction.transactionDate,
    });

    if (updateResult.hasError) {
      const errorMessage = updateResult.errors.map((e) => e.message).join('; ');
      return Either.error(new TransactionUpdateFailedError(errorMessage));
    }

    const updatedTransaction = updateResult.data!;

    const saveResult =
      await this.saveTransactionRepository.execute(updatedTransaction);
    if (saveResult.hasError) {
      return Either.error(new TransactionPersistenceFailedError());
    }

    return Either.success({ id: updatedTransaction.id });
  }
}
