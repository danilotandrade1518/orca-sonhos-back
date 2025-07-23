import { Goal } from '../../../../domain/aggregates/goal/goal-entity/Goal';
import { InvalidEntityIdError } from '../../../../domain/shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from '../../../../domain/shared/errors/InvalidEntityNameError';
import { Either } from '../../../../shared/core/either';
import { IAddGoalRepository } from '../../../contracts/repositories/goal/IAddGoalRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { CreateGoalDto } from './CreateGoalDto';
import { CreateGoalUseCase } from './CreateGoalUseCase';

class AddGoalRepositoryStub implements IAddGoalRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_goal: Goal): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

class AddGoalRepositoryFailureStub implements IAddGoalRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_goal: Goal): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeSut = () => {
  const addGoalRepository = new AddGoalRepositoryStub();
  const sut = new CreateGoalUseCase(addGoalRepository);
  return { sut, addGoalRepository };
};

const makeValidDto = (): CreateGoalDto => ({
  name: 'Meta de Emergência',
  totalAmount: 5000,
  accumulatedAmount: 0,
  deadline: new Date('2024-12-31'),
  budgetId: '550e8400-e29b-41d4-a716-446655440001',
});

describe('CreateGoalUseCase', () => {
  describe('execute', () => {
    it('deve criar uma meta com sucesso', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
      expect(typeof result.data!.id).toBe('string');
    });

    it('deve retornar erro se nome for inválido', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.name = '';

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityNameError);
    });

    it('deve retornar erro se budgetId for inválido', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.budgetId = 'invalid-id';

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('deve criar meta sem valor acumulado inicial', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      delete dto.accumulatedAmount;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
    });

    it('deve criar meta sem deadline', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      delete dto.deadline;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
    });

    it('deve retornar erro se repository falhar', async () => {
      const addGoalRepository = new AddGoalRepositoryFailureStub();
      const sut = new CreateGoalUseCase(addGoalRepository);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('deve retornar erro se valor acumulado for maior que total', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.accumulatedAmount = 6000; // maior que totalAmount (5000)

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve aceitar valor acumulado igual ao total', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.accumulatedAmount = 5000; // igual ao totalAmount

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
    });
  });
});
