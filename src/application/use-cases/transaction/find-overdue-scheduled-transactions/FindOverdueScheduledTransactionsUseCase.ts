import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IFindOverdueScheduledTransactionsRepository } from '../../../contracts/repositories/transaction/IFindOverdueScheduledTransactionsRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { FindOverdueScheduledTransactionsDto } from './FindOverdueScheduledTransactionsDto';

export class FindOverdueScheduledTransactionsUseCase
  implements IUseCase<FindOverdueScheduledTransactionsDto>
{
  constructor(
    private readonly findOverdueRepository: IFindOverdueScheduledTransactionsRepository,
  ) {}

  async execute(
    dto: FindOverdueScheduledTransactionsDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const result = await this.findOverdueRepository.execute(dto.referenceDate);

    if (result.hasError) {
      return Either.errors<RepositoryError, UseCaseResponse>([
        result.errors[0],
      ]);
    }

    return Either.success<RepositoryError, UseCaseResponse>({
      id: `overdue-transactions-${Date.now()}`,
    });
  }
}
