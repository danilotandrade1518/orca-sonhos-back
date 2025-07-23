import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { Either } from '../../../../shared/core/either';
import { IGetGoalByIdRepository } from '../../../contracts/repositories/goal/IGetGoalByIdRepository';
import { ISaveGoalRepository } from '../../../contracts/repositories/goal/ISaveGoalRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { AddAmountToGoalDto } from './AddAmountToGoalDto';
import { AddAmountToGoalUseCase } from './AddAmountToGoalUseCase';
import { GoalAlreadyDeletedError } from '../../../../domain/aggregates/goal/errors/GoalAlreadyDeletedError';
import { GoalAlreadyAchievedError } from '../../../../domain/aggregates/goal/errors/GoalAlreadyAchievedError';
import { InvalidGoalAmountError } from '../../../../domain/aggregates/goal/errors/InvalidGoalAmountError';

class GetGoalByIdRepositoryStub implements IGetGoalByIdRepository {
  private goal: Goal | null = null;

  setGoal(goal: Goal | null) {
    this.goal = goal;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_id: string): Promise<Either<RepositoryError, Goal | null>> {
    return Either.success<RepositoryError, Goal | null>(this.goal);
  }
}

class GetGoalByIdRepositoryFailureStub implements IGetGoalByIdRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_id: string): Promise<Either<RepositoryError, Goal | null>> {
    return Either.error<RepositoryError, Goal | null>(
      new RepositoryError('Repository error'),
    );
  }
}

class SaveGoalRepositoryStub implements ISaveGoalRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_goal: Goal): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

class SaveGoalRepositoryFailureStub implements ISaveGoalRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_goal: Goal): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeSut = () => {
  const getGoalByIdRepository = new GetGoalByIdRepositoryStub();
  const saveGoalRepository = new SaveGoalRepositoryStub();
  const sut = new AddAmountToGoalUseCase(
    getGoalByIdRepository,
    saveGoalRepository,
  );
  return { sut, getGoalByIdRepository, saveGoalRepository };
};

const makeValidDto = (): AddAmountToGoalDto => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  amount: 500,
});

const makeValidGoal = (): Goal => {
  const goalResult = Goal.create({
    name: 'Meta Para Aporte',
    totalAmount: 5000,
    accumulatedAmount: 1000,
    budgetId: '550e8400-e29b-41d4-a716-446655440002',
  });
  return goalResult.data!;
};

describe('AddAmountToGoalUseCase', () => {
  describe('execute', () => {
    it('deve adicionar valor à meta com sucesso', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', goal.id);
    });

    it('deve retornar erro se repository de busca falhar', async () => {
      const getGoalByIdRepository = new GetGoalByIdRepositoryFailureStub();
      const saveGoalRepository = new SaveGoalRepositoryStub();
      const sut = new AddAmountToGoalUseCase(
        getGoalByIdRepository,
        saveGoalRepository,
      );
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('deve retornar erro se meta não existir', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      getGoalByIdRepository.setGoal(null);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalNotFoundError);
    });

    it('deve retornar erro se meta estiver deletada', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      goal.delete(); // deleta a meta
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve retornar erro se meta já estiver atingida', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goalResult = Goal.create({
        name: 'Meta Atingida',
        totalAmount: 1000,
        accumulatedAmount: 1000, // já atingida
        budgetId: '550e8400-e29b-41d4-a716-446655440002',
      });
      const goal = goalResult.data!;
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyAchievedError);
    });

    it('deve retornar erro se valor ultrapassar o total', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto: AddAmountToGoalDto = {
        id: goal.id,
        amount: 5000, // acumulado (1000) + aporte (5000) = 6000 > total (5000)
      };

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidGoalAmountError);
    });

    it('deve aceitar aporte que completa exatamente a meta', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto: AddAmountToGoalDto = {
        id: goal.id,
        amount: 4000, // acumulado (1000) + aporte (4000) = 5000 (exato)
      };

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', goal.id);
    });

    it('deve retornar erro se valor for negativo', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto: AddAmountToGoalDto = {
        id: goal.id,
        amount: -100, // valor negativo
      };

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve retornar erro se repository de persistência falhar', async () => {
      const getGoalByIdRepository = new GetGoalByIdRepositoryStub();
      const saveGoalRepository = new SaveGoalRepositoryFailureStub();
      const sut = new AddAmountToGoalUseCase(
        getGoalByIdRepository,
        saveGoalRepository,
      );
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
