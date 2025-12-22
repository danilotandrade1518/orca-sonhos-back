import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { GoalDeletionFailedError } from '../../../shared/errors/GoalDeletionFailedError';
import { Either } from '../../../../shared/core/either';
import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { IDeleteGoalRepository } from '../../../contracts/repositories/goal/IDeleteGoalRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { DeleteGoalDto } from './DeleteGoalDto';
import { DeleteGoalUseCase } from './DeleteGoalUseCase';
import { GoalAlreadyDeletedError } from '../../../../domain/aggregates/goal/errors/GoalAlreadyDeletedError';

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

class DeleteGoalRepositoryStub implements IDeleteGoalRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_id: string): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

class DeleteGoalRepositoryFailureStub implements IDeleteGoalRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_id: string): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeSut = () => {
  const getGoalByIdRepository = new GetGoalByIdRepositoryStub();
  const deleteGoalRepository = new DeleteGoalRepositoryStub();
  const sut = new DeleteGoalUseCase(
    getGoalByIdRepository,
    deleteGoalRepository,
  );
  return { sut, getGoalByIdRepository, deleteGoalRepository };
};

const makeValidDto = (): DeleteGoalDto => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
});

const makeValidGoal = (): Goal => {
  const goalResult = Goal.create({
    name: 'Meta Para Deletar',
    totalAmount: 5000,
    accumulatedAmount: 1000,
    budgetId: '550e8400-e29b-41d4-a716-446655440002',
    sourceAccountId: '550e8400-e29b-41d4-a716-446655440004',
  });
  return goalResult.data!;
};

describe('DeleteGoalUseCase', () => {
  describe('execute', () => {
    it('deve deletar uma meta com sucesso', async () => {
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
      const deleteGoalRepository = new DeleteGoalRepositoryStub();
      const sut = new DeleteGoalUseCase(
        getGoalByIdRepository,
        deleteGoalRepository,
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

    it('deve retornar erro se tentar deletar meta já deletada', async () => {
      const { sut, getGoalByIdRepository } = makeSut();
      const goal = makeValidGoal();
      goal.delete();
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve retornar erro se repository de deleção falhar', async () => {
      const getGoalByIdRepository = new GetGoalByIdRepositoryStub();
      const deleteGoalRepository = new DeleteGoalRepositoryFailureStub();
      const sut = new DeleteGoalUseCase(
        getGoalByIdRepository,
        deleteGoalRepository,
      );
      const goal = makeValidGoal();
      getGoalByIdRepository.setGoal(goal);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalDeletionFailedError);
    });
  });
});
