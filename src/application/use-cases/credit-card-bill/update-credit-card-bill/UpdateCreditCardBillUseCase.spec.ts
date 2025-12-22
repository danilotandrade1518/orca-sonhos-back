import {
  CreditCardBill,
  RestoreCreditCardBillDTO,
} from '../../../../domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '../../../../domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { Either } from '../../../../shared/core/either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { CreditCardBillNotFoundError } from '../../../shared/errors/CreditCardBillNotFoundError';
import { CreditCardBillUpdateFailedError } from '../../../shared/errors/CreditCardBillUpdateFailedError';

import { IGetCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { ISaveCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/ISaveCreditCardBillRepository';
import { UpdateCreditCardBillUseCase } from './UpdateCreditCardBillUseCase';
import { UpdateCreditCardBillRequestDTO } from './UpdateCreditCardBillRequestDTO';

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

class SaveCreditCardBillRepositoryStub
  implements ISaveCreditCardBillRepository
{
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

class SaveCreditCardBillRepositoryFailureStub
  implements ISaveCreditCardBillRepository
{
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.error<RepositoryError, void>(
      new RepositoryError('Repository error'),
    );
  }
}

const makeCreditCardBill = (): CreditCardBill => {
  const validBillId = EntityId.create().value!.id;
  const validCreditCardId = EntityId.create().value!.id;

  const data: RestoreCreditCardBillDTO = {
    id: validBillId,
    creditCardId: validCreditCardId,
    closingDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-10'),
    amount: 100000,
    status: BillStatusEnum.OPEN,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = CreditCardBill.restore(data);
  return result.data!;
};

describe('UpdateCreditCardBillUseCase', () => {
  let updateCreditCardBillUseCase: UpdateCreditCardBillUseCase;
  let getCreditCardBillRepository: GetCreditCardBillRepositoryStub;
  let saveCreditCardBillRepository: SaveCreditCardBillRepositoryStub;

  beforeEach(() => {
    getCreditCardBillRepository = new GetCreditCardBillRepositoryStub();
    saveCreditCardBillRepository = new SaveCreditCardBillRepositoryStub();

    updateCreditCardBillUseCase = new UpdateCreditCardBillUseCase(
      getCreditCardBillRepository,
      saveCreditCardBillRepository,
    );
  });

  describe('Success Cases', () => {
    it('should update a credit card bill successfully', async () => {
      const creditCardBill = makeCreditCardBill();
      getCreditCardBillRepository.setCreditCardBill(creditCardBill);

      const dto: UpdateCreditCardBillRequestDTO = {
        id: creditCardBill.id,
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 150000,
      };

      const result = await updateCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual({
        id: expect.any(String),
        creditCardId: expect.any(String),
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 150000,
        status: BillStatusEnum.OPEN,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('Error Cases', () => {
    it('should return error when credit card bill is not found', async () => {
      getCreditCardBillRepository.setCreditCardBill(null);

      const dto: UpdateCreditCardBillRequestDTO = {
        id: 'invalid-bill-id',
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 150000,
      };

      const result = await updateCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardBillNotFoundError);
    });

    it('should return error when get repository fails', async () => {
      const getCreditCardBillRepositoryFailure =
        new GetCreditCardBillRepositoryFailureStub();
      const saveCreditCardBillRepository =
        new SaveCreditCardBillRepositoryStub();

      const updateCreditCardBillUseCase = new UpdateCreditCardBillUseCase(
        getCreditCardBillRepositoryFailure,
        saveCreditCardBillRepository,
      );

      const dto: UpdateCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 150000,
      };

      const result = await updateCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardBillUpdateFailedError);
    });

    it('should return error when due date is before closing date', async () => {
      const creditCardBill = makeCreditCardBill();
      getCreditCardBillRepository.setCreditCardBill(creditCardBill);

      const dto: UpdateCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
        closingDate: new Date('2024-03-15'),
        dueDate: new Date('2024-02-10'),
        amount: 150000,
      };

      const result = await updateCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeDefined();
    });

    it('should return error when amount is negative', async () => {
      const creditCardBill = makeCreditCardBill();
      getCreditCardBillRepository.setCreditCardBill(creditCardBill);

      const dto: UpdateCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: -10000,
      };

      const result = await updateCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeDefined();
    });

    it('should return error when save repository fails', async () => {
      const creditCardBill = makeCreditCardBill();

      const getCreditCardBillRepositoryLocal =
        new GetCreditCardBillRepositoryStub();
      const saveCreditCardBillRepositoryFailure =
        new SaveCreditCardBillRepositoryFailureStub();

      getCreditCardBillRepositoryLocal.setCreditCardBill(creditCardBill);

      const updateCreditCardBillUseCase = new UpdateCreditCardBillUseCase(
        getCreditCardBillRepositoryLocal,
        saveCreditCardBillRepositoryFailure,
      );

      const dto: UpdateCreditCardBillRequestDTO = {
        id: 'valid-bill-id',
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 150000,
      };

      const result = await updateCreditCardBillUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardBillUpdateFailedError);
    });
  });
});
