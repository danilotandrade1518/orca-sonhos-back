import {
  CreditCard,
  RestoreCreditCardDTO,
} from '../../../../domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { Either } from '../../../../shared/core/either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { CreditCardNotFoundError } from '../../../shared/errors/CreditCardNotFoundError';
import { CreditCardDeletionFailedError } from '../../../shared/errors/CreditCardDeletionFailedError';

import { IGetCreditCardRepository } from '../../../contracts/repositories/credit-card/IGetCreditCardRepository';
import { IDeleteCreditCardRepository } from '../../../contracts/repositories/credit-card/IDeleteCreditCardRepository';
import { GetCreditCardRepositoryStub } from '../../../shared/tests/stubs/GetCreditCardRepositoryStub';
import { DeleteCreditCardRepositoryStub } from '../../../shared/tests/stubs/DeleteCreditCardRepositoryStub';
import { DeleteCreditCardUseCase } from './DeleteCreditCardUseCase';
import { DeleteCreditCardDto } from './DeleteCreditCardDto';

class GetCreditCardRepositoryFailureStub implements IGetCreditCardRepository {
  async execute(): Promise<Either<RepositoryError, CreditCard | null>> {
    return Either.error<RepositoryError, CreditCard | null>(
      new RepositoryError('Repository error'),
    );
  }
}

class DeleteCreditCardRepositoryFailureStub
  implements IDeleteCreditCardRepository
{
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeCreditCard = (isDeleted = false): CreditCard => {
  const validId = EntityId.create().value!.id;
  const validBudgetId = EntityId.create().value!.id;

  const data: RestoreCreditCardDTO = {
    id: validId,
    name: 'Valid Card',
    limit: 500000, // 5000.00 em centavos
    closingDay: 15,
    dueDay: 25,
    budgetId: validBudgetId,
    isDeleted,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = CreditCard.restore(data);
  return result.data!;
};

describe('DeleteCreditCardUseCase', () => {
  let deleteCreditCardUseCase: DeleteCreditCardUseCase;
  let getCreditCardRepository: GetCreditCardRepositoryStub;
  let deleteCreditCardRepository: DeleteCreditCardRepositoryStub;

  beforeEach(() => {
    getCreditCardRepository = new GetCreditCardRepositoryStub();
    deleteCreditCardRepository = new DeleteCreditCardRepositoryStub();

    deleteCreditCardUseCase = new DeleteCreditCardUseCase(
      getCreditCardRepository,
      deleteCreditCardRepository,
    );
  });

  describe('Success Cases', () => {
    it('should delete a credit card successfully', async () => {
      const creditCard = makeCreditCard();
      getCreditCardRepository.setCreditCard(creditCard);

      const dto: DeleteCreditCardDto = {
        id: creditCard.id,
      };

      const result = await deleteCreditCardUseCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual({
        id: creditCard.id,
      });
    });
  });

  describe('Error Cases', () => {
    it('should return error when credit card is not found', async () => {
      getCreditCardRepository.setCreditCard(null);

      const dto: DeleteCreditCardDto = {
        id: 'invalid-id',
      };

      const result = await deleteCreditCardUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardNotFoundError);
    });

    it('should return error when get credit card repository fails', async () => {
      const getCreditCardRepositoryFailure =
        new GetCreditCardRepositoryFailureStub();
      const deleteCreditCardRepository = new DeleteCreditCardRepositoryStub();

      const deleteCreditCardUseCase = new DeleteCreditCardUseCase(
        getCreditCardRepositoryFailure,
        deleteCreditCardRepository,
      );

      const validId = EntityId.create().value!.id;
      const dto: DeleteCreditCardDto = {
        id: validId,
      };

      const result = await deleteCreditCardUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error when credit card is already deleted', async () => {
      const creditCard = makeCreditCard(true); // already deleted
      getCreditCardRepository.setCreditCard(creditCard);

      const dto: DeleteCreditCardDto = {
        id: creditCard.id,
      };

      const result = await deleteCreditCardUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors).toBeDefined();
    });

    it('should return error when delete repository fails', async () => {
      const creditCard = makeCreditCard();

      const getCreditCardRepositoryLocal = new GetCreditCardRepositoryStub();
      const deleteCreditCardRepositoryFailure =
        new DeleteCreditCardRepositoryFailureStub();

      getCreditCardRepositoryLocal.setCreditCard(creditCard);

      const deleteCreditCardUseCase = new DeleteCreditCardUseCase(
        getCreditCardRepositoryLocal,
        deleteCreditCardRepositoryFailure,
      );

      const dto: DeleteCreditCardDto = {
        id: creditCard.id,
      };

      const result = await deleteCreditCardUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardDeletionFailedError);
    });
  });
});
