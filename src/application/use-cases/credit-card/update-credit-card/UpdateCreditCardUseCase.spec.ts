import { CreditCard } from '../../../../domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { CreditCardAlreadyDeletedError } from '../../../../domain/aggregates/credit-card/errors/CreditCardAlreadyDeletedError';
import { InvalidEntityNameError } from '../../../../domain/shared/errors/InvalidEntityNameError';
import { InvalidCreditCardDayError } from '../../../../domain/aggregates/credit-card/errors/InvalidCreditCardDayError';
import { Either } from '../../../../shared/core/either';
import { IGetCreditCardRepository } from '../../../contracts/repositories/credit-card/IGetCreditCardRepository';
import { ISaveCreditCardRepository } from '../../../contracts/repositories/credit-card/ISaveCreditCardRepository';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { CreditCardNotFoundError } from '../../../shared/errors/CreditCardNotFoundError';
import { GetCreditCardRepositoryStub } from '../../../shared/tests/stubs/GetCreditCardRepositoryStub';
import { SaveCreditCardRepositoryStub } from '../../../shared/tests/stubs/SaveCreditCardRepositoryStub';
import { UpdateCreditCardDto } from './UpdateCreditCardDto';
import { UpdateCreditCardUseCase } from './UpdateCreditCardUseCase';

class GetCreditCardRepositoryFailureStub implements IGetCreditCardRepository {
  async execute(): Promise<Either<RepositoryError, CreditCard | null>> {
    return Either.error<RepositoryError, CreditCard | null>(
      new RepositoryError('Repository error'),
    );
  }
}

class SaveCreditCardRepositoryFailureStub implements ISaveCreditCardRepository {
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeSut = () => {
  const getCreditCardRepository = new GetCreditCardRepositoryStub();
  const saveCreditCardRepository = new SaveCreditCardRepositoryStub();
  const sut = new UpdateCreditCardUseCase(
    getCreditCardRepository,
    saveCreditCardRepository,
  );
  return { sut, getCreditCardRepository, saveCreditCardRepository };
};

const makeValidDto = (id?: string): UpdateCreditCardDto => {
  const validId = id || EntityId.create().value!.id;
  return {
    id: validId,
    name: 'Cartão Atualizado',
    limit: 2000,
    closingDay: 10,
    dueDay: 15,
  };
};

const makeValidCreditCard = (): CreditCard => {
  const validId = EntityId.create().value!.id;
  const validBudgetId = EntityId.create().value!.id;

  const creditCardResult = CreditCard.restore({
    id: validId,
    name: 'Cartão Original',
    limit: 100000, // 1000.00 em centavos
    closingDay: 5,
    dueDay: 10,
    budgetId: validBudgetId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (creditCardResult.hasError) {
    throw new Error('Failed to create credit card for test');
  }
  return creditCardResult.data!;
};

describe('UpdateCreditCardUseCase', () => {
  describe('execute', () => {
    it('deve atualizar um cartão de crédito com sucesso', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);

      const dto: UpdateCreditCardDto = {
        id: creditCard.id,
        name: 'Cartão Atualizado',
        limit: 2000,
        closingDay: 10,
        dueDay: 15,
      };

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', creditCard.id);
    });

    it('deve retornar erro se repository de busca falhar', async () => {
      const getCreditCardRepository = new GetCreditCardRepositoryFailureStub();
      const saveCreditCardRepository = new SaveCreditCardRepositoryStub();
      const sut = new UpdateCreditCardUseCase(
        getCreditCardRepository,
        saveCreditCardRepository,
      );
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('deve retornar erro se cartão não existir', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      getCreditCardRepository.setCreditCard(null);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardNotFoundError);
    });

    it('deve retornar erro se nome for inválido', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();
      dto.name = '';

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityNameError);
    });

    it('deve retornar erro se dia de fechamento for inválido', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();
      dto.closingDay = 32;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCreditCardDayError);
    });

    it('deve retornar erro se dia de vencimento for inválido', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();
      dto.dueDay = 0;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCreditCardDayError);
    });

    it('deve retornar erro se limite for negativo', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();
      dto.limit = -100;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('deve aceitar limite zero', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();
      dto.limit = 0;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', creditCard.id);
    });

    it('deve retornar erro se tentar atualizar cartão deletado', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      creditCard.delete(); // deletar o cartão
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardAlreadyDeletedError);
    });

    it('deve retornar erro se repository de persistência falhar', async () => {
      const getCreditCardRepository = new GetCreditCardRepositoryStub();
      const saveCreditCardRepository =
        new SaveCreditCardRepositoryFailureStub();
      const sut = new UpdateCreditCardUseCase(
        getCreditCardRepository,
        saveCreditCardRepository,
      );
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('deve aceitar dias válidos extremos', async () => {
      const { sut, getCreditCardRepository } = makeSut();
      const creditCard = makeValidCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);
      const dto = makeValidDto();
      dto.closingDay = 31;
      dto.dueDay = 31;

      const result = await sut.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id', creditCard.id);
    });
  });
});
