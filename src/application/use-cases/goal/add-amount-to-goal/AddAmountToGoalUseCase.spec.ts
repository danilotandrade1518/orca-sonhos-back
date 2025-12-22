import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '../../../../domain/aggregates/account/value-objects/account-type/AccountType';
import { GoalAlreadyDeletedError } from '../../../../domain/aggregates/goal/errors/GoalAlreadyDeletedError';
import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { GetGoalsByAccountRepositoryStub } from '../../../shared/tests/stubs/GetGoalsByAccountRepositoryStub';
import { SaveGoalRepositoryStub } from '../../../shared/tests/stubs/SaveGoalRepositoryStub';
import { AddAmountToGoalDto } from './AddAmountToGoalDto';
import { AddAmountToGoalUseCase } from './AddAmountToGoalUseCase';

class GetGoalByIdRepositoryStub implements IGetGoalRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public executeCalls: string[] = [];
  private goals: Record<string, Goal> = {};
  private _mockGoal: Goal | null = null;

  set mockGoal(goal: Goal | null) {
    this._mockGoal = goal;
    if (goal) {
      this.goals[goal.id] = goal;
    } else {
      this.goals = {};
    }
  }

  get mockGoal(): Goal | null {
    return this._mockGoal;
  }

  async execute(id: string): Promise<Either<RepositoryError, Goal | null>> {
    this.executeCalls.push(id);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    const goal = this.goals[id];
    return Either.success(goal || null);
  }
}

const makeSut = () => {
  const getGoalByIdRepository = new GetGoalByIdRepositoryStub();
  const getAccountByIdRepository = new GetAccountRepositoryStub();
  const getGoalsByAccountRepository = new GetGoalsByAccountRepositoryStub();
  const saveGoalRepository = new SaveGoalRepositoryStub();
  const budgetAuthorizationService = new BudgetAuthorizationServiceStub();

  const sut = new AddAmountToGoalUseCase(
    getGoalByIdRepository,
    getAccountByIdRepository,
    getGoalsByAccountRepository,
    saveGoalRepository,
    budgetAuthorizationService,
  );

  return {
    sut,
    getGoalByIdRepository,
    getAccountByIdRepository,
    getGoalsByAccountRepository,
    saveGoalRepository,
    budgetAuthorizationService,
  };
};

const makeValidDto = (): AddAmountToGoalDto => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  amount: 500,
  userId: '550e8400-e29b-41d4-a716-446655440003',
});

const makeValidGoal = (): Goal => {
  const goalResult = Goal.create({
    name: 'Meta Para Aporte',
    totalAmount: 5000,
    accumulatedAmount: 1000,
    budgetId: '550e8400-e29b-41d4-a716-446655440002',
    sourceAccountId: '550e8400-e29b-41d4-a716-446655440004',
  });
  return goalResult.data!;
};

const makeValidAccount = (): Account => {
  const accountResult = Account.create({
    name: 'Conta Corrente',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    initialBalance: 10000,
    budgetId: '550e8400-e29b-41d4-a716-446655440002',
  });
  return accountResult.data!;
};

describe('AddAmountToGoalUseCase', () => {
  describe('execute', () => {
    it('deve adicionar valor à meta com sucesso', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        getGoalsByAccountRepository,
        budgetAuthorizationService,
      } = makeSut();

      const account = makeValidAccount();

      const goalResult = Goal.create({
        name: 'Meta Para Aporte',
        totalAmount: 5000,
        accumulatedAmount: 1000,
        budgetId: account.budgetId!,
        sourceAccountId: account.id,
      });
      const goal = goalResult.data!;

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getGoalsByAccountRepository.setGoalsForAccount(account.id, []);
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', goal.id);
    });

    it('deve retornar erro se Goal não existir', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      getGoalByIdRepository.shouldReturnNull = true;
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalNotFoundError);
    });

    it('deve retornar erro se usuário não tiver acesso ao Budget', async () => {
      const { sut, getGoalByIdRepository, budgetAuthorizationService } =
        makeSut();

      const goal = makeValidGoal();
      getGoalByIdRepository.mockGoal = goal;
      budgetAuthorizationService.mockHasAccess = false;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ApplicationError);
      expect(result.errors[0].message).toContain('Insufficient permissions');
    });

    it('deve retornar erro se Account não existir', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.shouldReturnNull = true;
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountNotFoundError);
    });

    it('deve retornar erro se Goal e Account não pertencerem ao mesmo Budget', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        budgetAuthorizationService,
      } = makeSut();

      const accountResult = Account.create({
        name: 'Conta Corrente',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 10000,
        budgetId: '550e8400-e29b-41d4-a716-446655440099',
      });
      if (accountResult.hasError) {
        throw new Error(
          `Failed to create account: ${accountResult.errors[0].message}`,
        );
      }
      const accountDifferentBudget = accountResult.data!;

      const goalResult = Goal.create({
        name: 'Meta Para Aporte',
        totalAmount: 5000,
        accumulatedAmount: 1000,
        budgetId: '550e8400-e29b-41d4-a716-446655440088',
        sourceAccountId: accountDifferentBudget.id,
      });
      const goal = goalResult.data!;

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = accountDifferentBudget;
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].message).toContain('same budget');
    });

    it('deve retornar erro se meta estiver deletada', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        getGoalsByAccountRepository,
        budgetAuthorizationService,
      } = makeSut();

      const account = makeValidAccount();

      const goalResult = Goal.create({
        name: 'Meta Para Aporte',
        totalAmount: 5000,
        accumulatedAmount: 1000,
        budgetId: account.budgetId!,
        sourceAccountId: account.id,
      });
      const goal = goalResult.data!;
      goal.delete();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getGoalsByAccountRepository.setGoalsForAccount(account.id, []);
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve retornar erro se valor for negativo', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        getGoalsByAccountRepository,
        budgetAuthorizationService,
      } = makeSut();

      const account = makeValidAccount();

      const goalResult = Goal.create({
        name: 'Meta Para Aporte',
        totalAmount: 5000,
        accumulatedAmount: 1000,
        budgetId: account.budgetId!,
        sourceAccountId: account.id,
      });
      const goal = goalResult.data!;

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getGoalsByAccountRepository.setGoalsForAccount(account.id, []);
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;
      dto.amount = -100;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].message).toContain('valid money');
    });

    it('deve retornar erro se Unit of Work falhar', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        getGoalsByAccountRepository,
        saveGoalRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      const account = makeValidAccount();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getGoalsByAccountRepository.setGoalsForAccount(account.id, []);
      saveGoalRepository.shouldFail = true;
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve calcular reservas excluindo a Goal atual', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        getGoalsByAccountRepository,
        saveGoalRepository,
        budgetAuthorizationService,
      } = makeSut();

      const account = makeValidAccount();

      const goalResult = Goal.create({
        name: 'Meta Para Aporte',
        totalAmount: 5000,
        accumulatedAmount: 1000,
        budgetId: account.budgetId!,
        sourceAccountId: account.id,
      });
      const goal = goalResult.data!;

      const otherGoal1 = Goal.create({
        name: 'Outra Meta 1',
        totalAmount: 2000,
        accumulatedAmount: 300,
        budgetId: account.budgetId!,
        sourceAccountId: account.id,
      }).data!;

      const otherGoal2 = Goal.create({
        name: 'Outra Meta 2',
        totalAmount: 3000,
        accumulatedAmount: 700,
        budgetId: account.budgetId!,
        sourceAccountId: account.id,
      }).data!;

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getGoalsByAccountRepository.setGoalsForAccount(account.id, [
        goal,
        otherGoal1,
        otherGoal2,
      ]);
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      await sut.execute(dto);

      expect(saveGoalRepository.executeCalls).toHaveLength(1);

      const executedGoal = saveGoalRepository.executeCalls[0];
      expect(executedGoal.accumulatedAmount).toBe(1500);
    });
  });
});
