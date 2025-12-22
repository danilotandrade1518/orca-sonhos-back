import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { AddCreditCardBillRepository } from './AddCreditCardBillRepository';

describe('AddCreditCardBillRepository', () => {
  let repository: AddCreditCardBillRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new AddCreditCardBillRepository(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidCreditCardBill = (): CreditCardBill => {
    return CreditCardBill.create({
      creditCardId: EntityId.create().value!.id,
      closingDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-10'),
      amount: 150000,
    }).data!;
  };

  describe('execute', () => {
    it('should add credit card bill successfully', async () => {
      const bill = createValidCreditCardBill();

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_card_bills'),
        expect.arrayContaining([
          bill.id,
          bill.creditCardId,
          bill.closingDate,
          bill.dueDate,
          150000,
          BillStatusEnum.OPEN,
          undefined,
          false,
          bill.createdAt,
          bill.updatedAt,
        ]),
      );
    });

    it('should call INSERT with correct SQL structure', async () => {
      const bill = createValidCreditCardBill();

      await repository.execute(bill);

      const [query, params] = mockConnection.query.mock.calls[0];
      expect(query).toContain('INSERT INTO credit_card_bills');
      expect(query).toContain(
        'id, credit_card_id, closing_date, due_date, amount, status',
      );
      expect(query).toContain('paid_at, is_deleted, created_at, updated_at');
      expect(query).toContain(
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      );
      expect(params).toHaveLength(10);
    });

    it('should handle credit card bill with different amount', async () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 250000,
      }).data!;

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_card_bills'),
        expect.arrayContaining([250000]),
      );
    });

    it('should handle deleted credit card bill', async () => {
      const bill = createValidCreditCardBill();
      bill.delete();

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_card_bills'),
        expect.arrayContaining([true]),
      );
    });

    it('should handle credit card bill with zero amount', async () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2024-03-15'),
        dueDate: new Date('2024-04-10'),
        amount: 0,
      }).data!;

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_card_bills'),
        expect.arrayContaining([0]),
      );
    });

    it('should handle credit card bill with large amount', async () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2024-04-15'),
        dueDate: new Date('2024-05-10'),
        amount: 1000000,
      }).data!;

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_card_bills'),
        expect.arrayContaining([1000000]),
      );
    });

    it('should return error when database fails with duplicate key', async () => {
      const bill = createValidCreditCardBill();
      const dbError = new Error('Duplicate key violation') as Error & {
        code: string;
      };
      dbError.code = '23505';

      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Credit card bill with id already exists',
      );
    });

    it('should return error when database fails with generic error', async () => {
      const bill = createValidCreditCardBill();
      const dbError = new Error('Database connection failed');

      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to add credit card bill',
      );
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle unknown error type', async () => {
      const bill = createValidCreditCardBill();
      const unknownError = 'Unknown error string';

      mockConnection.query.mockRejectedValue(unknownError);

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to add credit card bill',
      );
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should handle credit card bill with future dates', async () => {
      const futureClosingDate = new Date('2025-12-15');
      const futureDueDate = new Date('2026-01-10');
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: futureClosingDate,
        dueDate: futureDueDate,
        amount: 75000,
      }).data!;

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_card_bills'),
        expect.arrayContaining([futureClosingDate, futureDueDate]),
      );
    });
  });
});
