import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { ContributionSource } from '@domain/aggregates/envelope/value-objects/ContributionSource';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '@application/contracts/events/IEventPublisher';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { ISaveAccountRepository } from '@application/contracts/repositories/account/ISaveAccountRepository';
import { IEnvelopeRepository } from '@application/contracts/repositories/envelope/IEnvelopeRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { AccountNotFoundError } from '@application/shared/errors/AccountNotFoundError';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { EnvelopeNotFoundError } from '@application/shared/errors/EnvelopeNotFoundError';
import { SourceAccountRequiredError } from '@application/shared/errors/SourceAccountRequiredError';
import { InsufficientBalanceError } from '@domain/aggregates/account/errors/InsufficientBalanceError';
import { IUseCase, UseCaseResponse } from '@application/shared/IUseCase';
import { MakeEnvelopeContributionDto } from './MakeEnvelopeContributionDto';

export class MakeEnvelopeContributionUseCase
  implements IUseCase<MakeEnvelopeContributionDto>
{
  constructor(
    private readonly envelopeRepository: IEnvelopeRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly saveAccountRepository: ISaveAccountRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: MakeEnvelopeContributionDto,
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

    const envelopeResult = await this.envelopeRepository.getById(dto.envelopeId);
    if (envelopeResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new RepositoryError('Envelope repository failure'),
      ]);
    }

    const envelope = envelopeResult.data;
    if (!envelope) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new EnvelopeNotFoundError(),
      );
    }

    let account: Account | null = null;
    if (dto.source === ContributionSource.MANUAL) {
      if (!dto.sourceAccountId) {
        return Either.error<DomainError | ApplicationError, UseCaseResponse>(
          new SourceAccountRequiredError(),
        );
      }
      const accountResult = await this.getAccountRepository.execute(
        dto.sourceAccountId,
      );
      if (accountResult.hasError) {
        return Either.errors(accountResult.errors);
      }
      account = accountResult.data ?? null;
      if (!account) {
        return Either.error(new AccountNotFoundError());
      }
      if (!account.canSubtract(dto.amount)) {
        return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
          new InsufficientBalanceError(),
        ]);
      }
      account.subtractAmount(dto.amount);
    }

    const contributionResult = envelope.makeContribution({
      amount: dto.amount,
      source: dto.source,
      description: dto.description,
    });
    if (contributionResult.hasError) {
      return Either.errors(contributionResult.errors);
    }

    const saveEnvelopeResult = await this.envelopeRepository.save(envelope);
    if (saveEnvelopeResult.hasError) {
      return Either.errors(saveEnvelopeResult.errors);
    }

    if (account) {
      const saveAccountResult = await this.saveAccountRepository.execute(account);
      if (saveAccountResult.hasError) {
        return Either.errors(saveAccountResult.errors);
      }
    }

    try {
      await this.eventPublisher.publishMany(envelope.getEvents());
      envelope.clearEvents();
    } catch (error) {
      console.error('Failed to publish events:', error);
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: contributionResult.data!.value!.contributionId,
    });
  }
}
