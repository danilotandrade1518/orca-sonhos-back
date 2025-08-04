import { InvalidContributionAmountError as DomainInvalidContributionAmountError } from '@domain/aggregates/goal/errors/InvalidContributionAmountError';
import { InvalidStartDateError as DomainInvalidStartDateError } from '@domain/aggregates/goal/errors/InvalidStartDateError';
import { AutomaticContribution } from '@domain/aggregates/goal/value-objects/automatic-contribution/AutomaticContribution';
import { ContributionFrequency } from '@domain/aggregates/goal/value-objects/contribution-frequency/ContributionFrequency';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IConfigureAutomaticContributionRepository } from '../../../contracts/repositories/goal/IConfigureAutomaticContributionRepository';
import { IGetGoalByIdRepository } from '../../../contracts/repositories/goal/IGetGoalByIdRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AutomaticContributionAlreadyConfiguredError } from '../../../shared/errors/AutomaticContributionAlreadyConfiguredError';
import { GoalNotActiveError } from '../../../shared/errors/GoalNotActiveError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { InvalidContributionAmountError } from '../../../shared/errors/InvalidContributionAmountError';
import { InvalidFrequencyConfigurationError } from '../../../shared/errors/InvalidFrequencyConfigurationError';
import { InvalidStartDateError } from '../../../shared/errors/InvalidStartDateError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { ConfigureAutomaticContributionDto } from './ConfigureAutomaticContributionDto';

export class ConfigureAutomaticContributionUseCase
  implements IUseCase<ConfigureAutomaticContributionDto>
{
  constructor(
    private readonly getGoalRepository: IGetGoalByIdRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly configureRepository: IConfigureAutomaticContributionRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: ConfigureAutomaticContributionDto,
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

    const goalResult = await this.getGoalRepository.execute(dto.goalId);

    if (goalResult.hasError) {
      return Either.errors(goalResult.errors);
    }

    const goal = goalResult.data;
    if (!goal) {
      return Either.error(new GoalNotFoundError());
    }

    if (goal.isDeleted || goal.isAchieved()) {
      return Either.error(new GoalNotActiveError());
    }

    const accountResult = await this.getAccountRepository.execute(
      dto.sourceAccountId,
    );

    if (accountResult.hasError) {
      return Either.errors([new RepositoryError('account')]);
    }

    if (!accountResult.data) {
      return Either.error(new AccountNotFoundError());
    }

    const frequency = ContributionFrequency.create({
      type: dto.frequencyType,
      executionDay: dto.executionDay,
      interval: 1,
      startDate: new Date(dto.startDate),
    });

    if (frequency.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new InvalidFrequencyConfigurationError(),
      ]);
    }

    const contribution = AutomaticContribution.create({
      amount: dto.contributionAmount,
      frequency,
      sourceAccountId: dto.sourceAccountId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive,
    });

    if (contribution.hasError) {
      const err = contribution.errors[0];
      if (
        err instanceof DomainInvalidContributionAmountError ||
        err instanceof InvalidContributionAmountError
      )
        return Either.error(new InvalidContributionAmountError());
      if (
        err instanceof DomainInvalidStartDateError ||
        err instanceof InvalidStartDateError
      )
        return Either.error(new InvalidStartDateError());
      return Either.errors(contribution.errors);
    }

    const configResult = goal.configureAutomaticContribution(contribution);
    if (configResult.hasError) {
      const first = configResult.errors[0];
      if (first instanceof AutomaticContributionAlreadyConfiguredError)
        return Either.error(first);
      return Either.errors(configResult.errors);
    }

    const persistResult = await this.configureRepository.execute(goal);

    if (persistResult.hasError) {
      return Either.errors(persistResult.errors);
    }

    try {
      await this.eventPublisher.publishMany(goal.getEvents());
      goal.clearEvents();
    } catch (error) {
      console.error('Failed to publish events:', error);
    }

    return Either.success({ id: goal.id });
  }
}
