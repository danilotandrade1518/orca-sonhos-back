import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { Either } from '../../../../shared/core/either';
import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { ISaveGoalRepository } from '../../../contracts/repositories/goal/ISaveGoalRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { UpdateGoalDto } from './UpdateGoalDto';
import { UpdateGoalUseCase } from './UpdateGoalUseCase';
import { InvalidEntityNameError } from '../../../../domain/shared/errors/InvalidEntityNameError';
import { InvalidGoalAmountError } from '../../../../domain/aggregates/goal/errors/InvalidGoalAmountError';

class GetGoalByIdRepositoryStub implements IGetGoalRepository {
  private goal: Goal | null = null;

  setGoal(goal: Goal | null) {
    this.goal = goal;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_id: string): Promise<Either<RepositoryError, Goal | null>> {
    return Either.success<RepositoryError, Goal | null>(this.goal);
  }
}

class GetGoalByIdRepositoryFailureStub implements IGetGoalRepository {
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
  const sut = new UpdateGoalUseCase(getGoalByIdRepository, saveGoalRepository);
  return { sut, getGoalByIdRepository, saveGoalRepository };
};

const makeValidDto = (): UpdateGoalDto => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Meta Atualizada',
  totalAmount: 8000,
  deadline: new Date('2025-12-31'),
});

const makeValidGoal = (): Goal => {
  const goalResult = Goal.create({
    name: 'Meta Original',
    totalAmount: 5000,
    accumulatedAmount: 1000,
    budgetId: '550e8400-e29b-41d4-a716-446655440002',
  });
  return goalResult.data!;
};

describe('UpdateGoalUseCase', () => {
  describe('execute', () => {
    it('deve atualizar uma meta com sucesso', async () => {
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
      const sut = new UpdateGoalUseCase(
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

    it('deve retornar erro se nome for inválido', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();
      dto.name = '';

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityNameError);
    });

    it('deve retornar erro se valor total for menor que acumulado', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();
      dto.totalAmount = 500; // menor que o valor acumulado (1000)

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidGoalAmountError);
    });

    it('deve atualizar apenas o nome', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto: UpdateGoalDto = {
        id: goal.id,
        name: 'Novo Nome',
        totalAmount: goal.totalAmount, // mesmo valor
      };

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', goal.id);
    });

    it('deve atualizar deadline para undefined', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto: UpdateGoalDto = {
        id: goal.id,
        name: goal.name,
        totalAmount: goal.totalAmount,
        deadline: undefined,
      };

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', goal.id);
    });

    it('deve retornar erro se repository de persistência falhar', async () => {
      const getGoalByIdRepository = new GetGoalByIdRepositoryStub();
      const saveGoalRepository = new SaveGoalRepositoryFailureStub();
      const sut = new UpdateGoalUseCase(
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
