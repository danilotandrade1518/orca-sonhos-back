import { CreditCard } from '../../../../domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { InvalidEntityIdError } from '../../../../domain/shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from '../../../../domain/shared/errors/InvalidEntityNameError';
import { InvalidCreditCardDayError } from '../../../../domain/aggregates/credit-card/errors/InvalidCreditCardDayError';
import { Either } from '../../../../shared/core/either';
import { IAddCreditCardRepository } from '../../../contracts/repositories/credit-card/IAddCreditCardRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { AddCreditCardRepositoryStub } from '../../../shared/tests/stubs/AddCreditCardRepositoryStub';
import { CreateCreditCardDto } from './CreateCreditCardDto';
import { CreateCreditCardUseCase } from './CreateCreditCardUseCase';

class AddCreditCardRepositoryFailureStub implements IAddCreditCardRepository {
  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _creditCard: CreditCard,
  ): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeSut = () => {
  const addCreditCardRepository = new AddCreditCardRepositoryStub();
  const sut = new CreateCreditCardUseCase(addCreditCardRepository);
  return { sut, addCreditCardRepository };
};

const makeValidDto = (): CreateCreditCardDto => ({
  name: 'Cartão Teste',
  limit: 5000,
  closingDay: 15,
  dueDay: 25,
  budgetId: '550e8400-e29b-41d4-a716-446655440001',
});

describe('CreateCreditCardUseCase', () => {
  describe('execute', () => {
    it('deve criar um cartão de crédito com sucesso', async () => {
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

    it('deve retornar erro se dia de fechamento for inválido', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.closingDay = 0;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCreditCardDayError);
    });

    it('deve retornar erro se dia de vencimento for inválido', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.dueDay = 32;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCreditCardDayError);
    });

    it('deve retornar erro se limite for negativo', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.limit = -1000;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve retornar erro se repository falhar', async () => {
      const addCreditCardRepository = new AddCreditCardRepositoryFailureStub();
      const sut = new CreateCreditCardUseCase(addCreditCardRepository);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('deve aceitar limite zero', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.limit = 0;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
    });

    it('deve aceitar dias válidos extremos', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.closingDay = 1;
      dto.dueDay = 31;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
    });
  });
});
