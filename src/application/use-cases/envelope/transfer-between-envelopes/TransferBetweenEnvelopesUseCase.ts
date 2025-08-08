import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { ITransferBetweenEnvelopesUnitOfWork } from '../../../contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { TransferBetweenEnvelopesService } from '../../../../domain/aggregates/envelope/services/TransferBetweenEnvelopesService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { TransferBetweenEnvelopesDto } from './TransferBetweenEnvelopesDto';

export class TransferBetweenEnvelopesUseCase
  implements IUseCase<TransferBetweenEnvelopesDto>
{
  constructor(
    private readonly getEnvelopeRepository: IGetEnvelopeRepository,
    private readonly transferService: TransferBetweenEnvelopesService,
    private readonly unitOfWork: ITransferBetweenEnvelopesUnitOfWork,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: TransferBetweenEnvelopesDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const sourceResult = await this.getEnvelopeRepository.execute(
      dto.sourceEnvelopeId,
    );
    if (sourceResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }
    const sourceEnvelope = sourceResult.data;
    if (!sourceEnvelope || sourceEnvelope.budgetId !== dto.budgetId) {
      return Either.error(new EnvelopeNotFoundError());
    }

    const targetResult = await this.getEnvelopeRepository.execute(
      dto.targetEnvelopeId,
    );
    if (targetResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }
    const targetEnvelope = targetResult.data;
    if (!targetEnvelope || targetEnvelope.budgetId !== dto.budgetId) {
      return Either.error(new EnvelopeNotFoundError());
    }

    const transferResult = this.transferService.createTransferOperation(
      sourceEnvelope,
      targetEnvelope,
      dto.amount,
      dto.budgetId,
    );
    if (transferResult.hasError) {
      return Either.errors(transferResult.errors);
    }

    const uowResult = await this.unitOfWork.executeTransfer({
      sourceEnvelope: transferResult.data!.sourceEnvelope,
      targetEnvelope: transferResult.data!.targetEnvelope,
    });
    if (uowResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }

    return Either.success({ id: sourceEnvelope.id });
  }
}
