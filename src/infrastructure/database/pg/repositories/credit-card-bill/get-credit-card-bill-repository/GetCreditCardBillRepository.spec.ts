import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  CreditCardBillMapper,
  CreditCardBillRow,
} from '../../../mappers/credit-card-bill/CreditCardBillMapper';
import { GetCreditCardBillRepository } from './GetCreditCardBillRepository';

jest.mock('../../../mappers/credit-card-bill/CreditCardBillMapper');

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TestDomainError';
  }
}

describe('GetCreditCardBillRepository', () => {
  let repository: GetCreditCardBillRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockMapper: jest.Mocked<typeof CreditCardBillMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockMapper = CreditCardBillMapper as jest.Mocked<
      typeof CreditCardBillMapper
    >;
    repository = new GetCreditCardBillRepository(mockConnection);
  });

  describe('execute', () => {
    const validId = EntityId.create().value!.id;
    const creditCardId = EntityId.create().value!.id;

    const createValidRow = (): CreditCardBillRow => ({
      id: validId,
      credit_card_id: creditCardId,
      closing_date: new Date('2024-01-31'),
      due_date: new Date('2024-02-15'),
      amount: 50000,
      status: BillStatusEnum.OPEN,
      paid_at: undefined,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createValidCreditCardBill = (): CreditCardBill => {
      const result = CreditCardBill.restore({
        id: validId,
        creditCardId,
        closingDate: new Date('2024-01-31'),
        dueDate: new Date('2024-02-15'),
        amount: 50000,
        status: BillStatusEnum.OPEN,
        paidAt: undefined,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result.data!;
    };

    it('should return credit card bill when found', async () => {
      const validRow = createValidRow();
      const validBill = createValidCreditCardBill();

      mockConnection.queryOne.mockResolvedValue(validRow);
      mockMapper.toDomain.mockReturnValue(Either.success(validBill));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(validBill);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validId],
      );
      expect(mockMapper.toDomain).toHaveBeenCalledWith(validRow);
    });

    it('should return null when credit card bill not found', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND is_deleted = false'),
        [validId],
      );
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should filter deleted credit card bills', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(validId);

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        [validId],
      );
    });

    it('should return error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to get credit card bill by id',
      );
    });

    it('should return error when mapping fails', async () => {
      const validRow = createValidRow();
      const mappingError = Either.error(
        new TestDomainError('Mapping failed') as DomainError,
      );

      mockConnection.queryOne.mockResolvedValue(validRow);
      mockMapper.toDomain.mockReturnValue(
        mappingError as Either<DomainError, CreditCardBill>,
      );

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to map credit card bill from database',
      );
    });

    it('should handle undefined database result', async () => {
      mockConnection.queryOne.mockResolvedValue(undefined);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should use correct SQL query structure', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(validId);

      const calledQuery = mockConnection.queryOne.mock.calls[0][0];
      expect(calledQuery).toContain('SELECT');
      expect(calledQuery).toContain(
        'id, credit_card_id, closing_date, due_date, amount, status',
      );
      expect(calledQuery).toContain(
        'paid_at, is_deleted, created_at, updated_at',
      );
      expect(calledQuery).toContain('FROM credit_card_bills');
      expect(calledQuery).toContain('WHERE id = $1 AND is_deleted = false');
    });

    it('should handle empty bill ID', async () => {
      const emptyId = '';
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(emptyId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockConnection.queryOne).toHaveBeenCalledWith(expect.any(String), [
        emptyId,
      ]);
    });

    it('should handle special characters in bill ID', async () => {
      const specialId = 'test-id-with-special-chars-@#$';
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(specialId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should handle network timeout error', async () => {
      const timeoutError = new Error('Connection timeout');
      mockConnection.queryOne.mockRejectedValue(timeoutError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should handle unknown database error', async () => {
      const unknownError = 'Unknown database error';
      mockConnection.queryOne.mockRejectedValue(unknownError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to get credit card bill by id',
      );
    });

    it('should call repository only once per execution', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(validId);
      await repository.execute(validId);

      expect(mockConnection.queryOne).toHaveBeenCalledTimes(2);
    });

    it('should preserve bill status in mapping', async () => {
      const validRow = createValidRow();
      const validBill = createValidCreditCardBill();

      mockConnection.queryOne.mockResolvedValue(validRow);
      mockMapper.toDomain.mockReturnValue(Either.success(validBill));

      await repository.execute(validId);

      expect(mockMapper.toDomain).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BillStatusEnum.OPEN,
        }),
      );
    });
  });
});
