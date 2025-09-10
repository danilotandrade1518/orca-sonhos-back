import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { GoalAlreadyDeletedError } from '../../../../domain/aggregates/goal/errors/GoalAlreadyDeletedError';
import { InvalidGoalAmountError } from '../../../../domain/aggregates/goal/errors/InvalidGoalAmountError';
import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { InvalidMoneyError } from '../../../../domain/shared/errors/InvalidMoneyError';
import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { SaveGoalRepositoryStub } from '../../../shared/tests/stubs/SaveGoalRepositoryStub';
import { RemoveAmountFromGoalDto } from './RemoveAmountFromGoalDto';
import { RemoveAmountFromGoalUseCase } from './RemoveAmountFromGoalUseCase';

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
  const saveGoalRepository = new SaveGoalRepositoryStub();
  const budgetAuthorizationService = new BudgetAuthorizationServiceStub();

  const sut = new RemoveAmountFromGoalUseCase(
    getGoalByIdRepository,
    getAccountByIdRepository,
    saveGoalRepository,
    budgetAuthorizationService,
  );

  return {
    sut,
    getGoalByIdRepository,
    getAccountByIdRepository,
    saveGoalRepository,
    budgetAuthorizationService,
  };
};

const makeValidDto = (): RemoveAmountFromGoalDto => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  amount: 300,
  userId: '550e8400-e29b-41d4-a716-446655440003',
});

const BUDGET_ID = '550e8400-e29b-41d4-a716-446655440002';
const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440004';

const makeValidGoal = (): Goal => {
  const goalResult = Goal.create({
    name: 'Meta Para Remoção',
    totalAmount: 5000,
    accumulatedAmount: 1000,
    budgetId: BUDGET_ID,
    sourceAccountId: ACCOUNT_ID,
  });
  return goalResult.data!;
};

const makeValidAccount = (): Account => {
  const accountResult = Account.create({
    name: 'Conta Corrente',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    initialBalance: 10000,
    budgetId: BUDGET_ID,
  });
  return accountResult.data!;
};

describe('RemoveAmountFromGoalUseCase', () => {
  describe('execute', () => {
    it('deve remover valor da meta com sucesso', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      const account = makeValidAccount();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;

      getAccountByIdRepository.accounts[ACCOUNT_ID] = account;

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
      expect(result.errors[0].message).toContain('not authorized');
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

      const goal = makeValidGoal();

      const DIFFERENT_BUDGET_ID = '550e8400-e29b-41d4-a716-446655440099';
      const accountResult = Account.create({
        name: 'Conta Corrente',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 10000,
        budgetId: DIFFERENT_BUDGET_ID,
      });
      const accountDifferentBudget = accountResult.data!;

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.accounts[goal.sourceAccountId] =
        accountDifferentBudget;

      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ApplicationError);
      expect(result.errors[0].message).toContain(
        'Goal and Account must belong to the same Budget',
      );
    });

    it('deve retornar erro se meta estiver deletada', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      const account = makeValidAccount();

      goal.delete();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getAccountByIdRepository.accounts[ACCOUNT_ID] = account;

      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve retornar erro se tentar remover mais que o valor atual', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      const account = makeValidAccount();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getAccountByIdRepository.accounts[ACCOUNT_ID] = account;

      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;
      dto.amount = 1500;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidGoalAmountError);
    });

    it('deve retornar erro se valor for negativo', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      const account = makeValidAccount();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;
      getAccountByIdRepository.accounts[ACCOUNT_ID] = account;

      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;
      dto.amount = -100;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidMoneyError);
    });

    it('deve retornar erro se Unit of Work falhar', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        saveGoalRepository,
        budgetAuthorizationService,
      } = makeSut();

      const goal = makeValidGoal();
      const account = makeValidAccount();

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;

      saveGoalRepository.shouldFail = true;
      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve calcular reservas incluindo o novo valor da Goal após remoção', async () => {
      const {
        sut,
        getGoalByIdRepository,
        getAccountByIdRepository,
        saveGoalRepository,
        budgetAuthorizationService,
      } = makeSut();

      const account = makeValidAccount();

      const goal = Goal.create({
        name: 'Meta Para Remoção',
        totalAmount: 5000,
        accumulatedAmount: 1000,
        budgetId: BUDGET_ID,
        sourceAccountId: account.id,
      }).data!;

      getGoalByIdRepository.mockGoal = goal;
      getAccountByIdRepository.mockAccount = account;

      getAccountByIdRepository.accounts[account.id] = account;

      budgetAuthorizationService.mockHasAccess = true;

      const dto = makeValidDto();
      dto.id = goal.id;
      dto.amount = 300;

      await sut.execute(dto);

      expect(saveGoalRepository.executeCalls).toHaveLength(1);

      const executedGoal = saveGoalRepository.executeCalls[0];
      expect(executedGoal.accumulatedAmount).toBe(700);
    });
  });
});
