import { CreditCardBill } from '../../../../domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { InvalidEntityIdError } from '../../../../domain/shared/errors/InvalidEntityIdError';
import { InvalidCreditCardBillDateError } from '../../../../domain/aggregates/credit-card-bill/errors/InvalidCreditCardBillDateError';
import { Either } from '../../../../shared/core/either';
import { IAddCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IAddCreditCardBillRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { CreditCardBillCreationFailedError } from '../../../shared/errors/CreditCardBillCreationFailedError';
import { CreateCreditCardBillRequestDTO } from './CreateCreditCardBillRequestDTO';
import { CreateCreditCardBillUseCase } from './CreateCreditCardBillUseCase';

class AddCreditCardBillRepositoryStub implements IAddCreditCardBillRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_bill: CreditCardBill): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

class AddCreditCardBillRepositoryFailureStub
  implements IAddCreditCardBillRepository
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_bill: CreditCardBill): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeSut = () => {
  const addCreditCardBillRepository = new AddCreditCardBillRepositoryStub();
  const sut = new CreateCreditCardBillUseCase(addCreditCardBillRepository);
  return { sut, addCreditCardBillRepository };
};

const makeValidDto = (): CreateCreditCardBillRequestDTO => ({
  creditCardId: '550e8400-e29b-41d4-a716-446655440001',
  closingDate: new Date('2024-01-15'),
  dueDate: new Date('2024-01-25'),
  amount: 1500,
});

describe('CreateCreditCardBillUseCase', () => {
  describe('execute', () => {
    it('deve criar uma fatura com sucesso', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('creditCardId', dto.creditCardId);
      expect(result.data).toHaveProperty('amount', dto.amount);
      expect(result.data).toHaveProperty('status');
    });

    it('deve retornar erro se creditCardId for inválido', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.creditCardId = 'invalid-id';

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('deve retornar erro se data de fechamento for posterior à vencimento', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.closingDate = new Date('2024-01-25');
      dto.dueDate = new Date('2024-01-15');

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCreditCardBillDateError);
    });

    it('deve retornar erro se valor for negativo', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.amount = -100;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve aceitar valor zero', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.amount = 0;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('amount', 0);
    });

    it('deve retornar erro se repository falhar', async () => {
      const addCreditCardBillRepository =
        new AddCreditCardBillRepositoryFailureStub();
      const sut = new CreateCreditCardBillUseCase(addCreditCardBillRepository);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CreditCardBillCreationFailedError,
      );
    });

    it('deve criar fatura com data de fechamento anterior ao vencimento', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.closingDate = new Date('2024-01-20');
      dto.dueDate = new Date('2024-01-25');

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
    });

    it('deve criar fatura com valor de centavos', async () => {
      const { sut } = makeSut();
      const dto = makeValidDto();
      dto.amount = 1999.99;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('amount', 1999.99);
    });
  });
});
