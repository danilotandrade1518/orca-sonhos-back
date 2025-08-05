import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { ISaveTransactionRepository } from '../../../contracts/repositories/transaction/ISaveTransactionRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { MarkTransactionLateDto } from './MarkTransactionLateDto';

export class MarkTransactionLateUseCase
  implements IUseCase<MarkTransactionLateDto>
{
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
  ) {}

  async execute(dto: MarkTransactionLateDto) {
    const txResult = await this.getTransactionRepository.execute(
      dto.transactionId,
    );
    if (txResult.hasError || !txResult.data) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new TransactionNotFoundError(),
      ]);
    }

    const transaction = txResult.data;
    const markResult = transaction.markAsLate();
    if (markResult.hasError) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>(
        markResult.errors,
      );
    }

    const saveResult =
      await this.saveTransactionRepository.execute(transaction);
    if (saveResult.hasError) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>([
        new TransactionPersistenceFailedError(),
      ]);
    }

    return Either.success<ApplicationError | DomainError, UseCaseResponse>({
      id: transaction.id,
    });
  }
}
