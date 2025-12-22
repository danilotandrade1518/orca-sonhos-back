import {
  CreditCardBill,
  RestoreCreditCardBillDTO,
} from '../../../../domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '../../../../domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { Either } from '../../../../shared/core/either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { CreditCardBillNotFoundError } from '../../../shared/errors/CreditCardBillNotFoundError';
import { CreditCardBillDeletionFailedError } from '../../../shared/errors/CreditCardBillDeletionFailedError';

import { IGetCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IDeleteCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IDeleteCreditCardBillRepository';
import { DeleteCreditCardBillUseCase } from './DeleteCreditCardBillUseCase';
import { DeleteCreditCardBillRequestDTO } from './DeleteCreditCardBillRequestDTO';

class GetCreditCardBillRepositoryStub implements IGetCreditCardBillRepository {
  private creditCardBill: CreditCardBill | null = null;

  setCreditCardBill(creditCardBill: CreditCardBill | null) {
    this.creditCardBill = creditCardBill;
  }

  async execute(): Promise<Either<RepositoryError, CreditCardBill | null>> {
    return Either.success<RepositoryError, CreditCardBill | null>(
      this.creditCardBill,
    );
  }
}

class GetCreditCardBillRepositoryFailureStub
  implements IGetCreditCardBillRepository
{
  async execute(): Promise<Either<RepositoryError, CreditCardBill | null>> {
    return Either.error<RepositoryError, CreditCardBill | null>(
      new RepositoryError('Repository error'),
    );
  }
}

class DeleteCreditCardBillRepositoryStub
  implements IDeleteCreditCardBillRepository
{
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

class DeleteCreditCardBillRepositoryFailureStub
  implements IDeleteCreditCardBillRepository
{
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeCreditCardBill = (isDeleted = false): CreditCardBill => {
  const data: RestoreCreditCardBillDTO = {
    id: EntityId.create().value!.id,
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-10'),
    amount: 100000,
    status: BillStatusEnum.OPEN,
    isDeleted,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = CreditCardBill.restore(data);
  if (result.hasError) {
    throw new Error('Failed to create credit card bill for test');
  }
  return result.data!;
};

describe('DeleteCreditCardBillUseCase', () => {
  let deleteCreditCardBillUseCase: DeleteCreditCardBillUseCase;
  let getCreditCardBillRepository: GetCreditCardBillRepositoryStub;
  let deleteCreditCardBillRepository: DeleteCreditCardBillRepositoryStub;

  beforeEach(() => {
    getCreditCardBillRepository = new GetCreditCardBillRepositoryStub();
    deleteCreditCardBillRepository = new DeleteCreditCardBillRepositoryStub();

    deleteCreditCardBillUseCase = new DeleteCreditCardBillUseCase(
      getCreditCardBillRepository,
      deleteCreditCardBillRepository,
    );
  });

  describe('Success Cases', () => {
    it('should delete a credit card bill successfully', async () => {
      const creditCardBill = makeCreditCardBill();
      getCreditCardBillRepository.setCreditCardBill(creditCardBill);

      const dto: DeleteCreditCardBillRequestDTO = {
        id: creditCardBill.id,
      };

      const result = await deleteCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual({
        id: creditCardBill.id,
      });
    });
  });

  describe('Error Cases', () => {
    it('should return error when credit card bill is not found', async () => {
      getCreditCardBillRepository.setCreditCardBill(null);

      const dto: DeleteCreditCardBillRequestDTO = {
        id: 'invalid-bill-id',
      };

      const result = await deleteCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardBillNotFoundError);
    });

    it('should return error when get repository fails', async () => {
      const getCreditCardBillRepositoryFailure =
        new GetCreditCardBillRepositoryFailureStub();
      const deleteCreditCardBillRepository =
        new DeleteCreditCardBillRepositoryStub();

      const deleteCreditCardBillUseCase = new DeleteCreditCardBillUseCase(
        getCreditCardBillRepositoryFailure,
        deleteCreditCardBillRepository,
      );

      const dto: DeleteCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
      };

      const result = await deleteCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CreditCardBillDeletionFailedError,
      );
    });

    it('should return error when credit card bill is already deleted', async () => {
      const creditCardBill = makeCreditCardBill(true);
      getCreditCardBillRepository.setCreditCardBill(creditCardBill);

      const dto: DeleteCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
      };

      const result = await deleteCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors).toBeDefined();
    });

    it('should return error when credit card bill is paid', async () => {
      const paidBillData: RestoreCreditCardBillDTO = {
        id: 'valid-bill-id',
        creditCardId: 'valid-card-id',
        closingDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-10'),
        amount: 100000,
        status: BillStatusEnum.PAID,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paidBill = CreditCardBill.restore(paidBillData).data!;
      getCreditCardBillRepository.setCreditCardBill(paidBill);

      const dto: DeleteCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
      };

      const result = await deleteCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors).toBeDefined();
    });

    it('should return error when delete repository fails', async () => {
      const creditCardBill = makeCreditCardBill();

      const getCreditCardBillRepositoryLocal =
        new GetCreditCardBillRepositoryStub();
      const deleteCreditCardBillRepositoryFailure =
        new DeleteCreditCardBillRepositoryFailureStub();

      getCreditCardBillRepositoryLocal.setCreditCardBill(creditCardBill);

      const deleteCreditCardBillUseCase = new DeleteCreditCardBillUseCase(
        getCreditCardBillRepositoryLocal,
        deleteCreditCardBillRepositoryFailure,
      );

      const dto: DeleteCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
      };

      const result = await deleteCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CreditCardBillDeletionFailedError,
      );
    });
  });
});
