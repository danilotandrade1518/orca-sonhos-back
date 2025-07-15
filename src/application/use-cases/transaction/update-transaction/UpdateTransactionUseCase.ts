import { Either } from '@either';

import { IUseCase } from '../../../shared/IUseCase';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { TransactionUpdateFailedError } from '../../../shared/errors/TransactionUpdateFailedError';
import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IFindAccountByIdRepository } from '../../../contracts/repositories/account/IFindAccountByIdRepository';
import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { ISaveTransactionRepository } from '../../../contracts/repositories/transaction/ISaveTransactionRepository';
import { UpdateTransactionDto } from './UpdateTransactionDto';

export class UpdateTransactionUseCase
  implements IUseCase<UpdateTransactionDto>
{
  constructor(
    private getTransactionRepository: IGetTransactionRepository,
    private saveTransactionRepository: ISaveTransactionRepository,
    private findAccountByIdRepository: IFindAccountByIdRepository,
    private eventPublisher: IEventPublisher,
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

    if (dto.accountId && dto.accountId !== existingTransaction.accountId) {
      const accountResult = await this.findAccountByIdRepository.execute(
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

    const events = updatedTransaction.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        updatedTransaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success({ id: updatedTransaction.id });
  }
}
