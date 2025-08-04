import { Account } from '@domain/aggregates/account/account-entity/Account';
import { FrequencyType } from '@domain/aggregates/goal/enums/FrequencyType';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { GoalNotActiveError } from '../../../shared/errors/GoalNotActiveError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { InvalidContributionAmountError } from '../../../shared/errors/InvalidContributionAmountError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { ConfigureAutomaticContributionRepositoryStub } from '../../../shared/tests/stubs/ConfigureAutomaticContributionRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { GetGoalByIdRepositoryStub } from '../../../shared/tests/stubs/GetGoalByIdRepositoryStub';
import { ConfigureAutomaticContributionDto } from './ConfigureAutomaticContributionDto';
import { ConfigureAutomaticContributionUseCase } from './ConfigureAutomaticContributionUseCase';

const makeGoal = (): Goal => {
  const goalResult = Goal.create({
    name: 'Meta Teste',
    totalAmount: 1000,
    budgetId: '550e8400-e29b-41d4-a716-446655440001',
  });
  return goalResult.data!;
};

describe('ConfigureAutomaticContributionUseCase', () => {
  let useCase: ConfigureAutomaticContributionUseCase;
  let getGoalRepository: GetGoalByIdRepositoryStub;
  let getAccountRepository: GetAccountRepositoryStub;
  let configureRepository: ConfigureAutomaticContributionRepositoryStub;
  let budgetAuthService: BudgetAuthorizationServiceStub;
  let eventPublisher: EventPublisherStub;
  let validGoal: Goal;
  const userId = 'user-1';
  const accountId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    getGoalRepository = new GetGoalByIdRepositoryStub();
    getAccountRepository = new GetAccountRepositoryStub();
    configureRepository = new ConfigureAutomaticContributionRepositoryStub();
    budgetAuthService = new BudgetAuthorizationServiceStub();
    eventPublisher = new EventPublisherStub();
    useCase = new ConfigureAutomaticContributionUseCase(
      getGoalRepository,
      getAccountRepository,
      configureRepository,
      budgetAuthService,
      eventPublisher,
    );

    validGoal = makeGoal();
    validGoal.clearEvents();
    getGoalRepository.mockGoal = validGoal;
    getAccountRepository.mockAccount = {
      id: accountId,
      budgetId: validGoal.budgetId,
    } as Account;
    budgetAuthService.mockHasAccess = true;
  });

  const makeDto = (): ConfigureAutomaticContributionDto => ({
    userId,
    budgetId: validGoal.budgetId,
    goalId: validGoal.id,
    contributionAmount: 100,
    frequencyType: FrequencyType.MONTHLY,
    executionDay: 10,
    sourceAccountId: accountId,
    startDate: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  });

  it('deve configurar aporte com sucesso', async () => {
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
  });

  it('deve falhar se meta não encontrada', async () => {
    getGoalRepository.setGoal(null);
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new GoalNotFoundError());
  });

  it('deve falhar se conta não encontrada', async () => {
    getAccountRepository.shouldReturnNull = true;
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountNotFoundError());
  });

  it('deve falhar se meta inativa', async () => {
    validGoal.delete();
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new GoalNotActiveError());
  });

  it('deve falhar se valor inválido', async () => {
    const dto = makeDto();
    dto.contributionAmount = 0;
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InvalidContributionAmountError);
  });
});
