import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { SaveCreditCardBillRepository } from './SaveCreditCardBillRepository';

describe('SaveCreditCardBillRepository', () => {
  let repository: SaveCreditCardBillRepository;
  let mockConnection: {
    getClient: jest.Mock;
  };
  let mockClient: {
    query: jest.Mock;
    release: jest.Mock;
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockConnection = {
      getClient: jest.fn().mockResolvedValue(mockClient),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new SaveCreditCardBillRepository(mockConnection as any);
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
    it('should save credit card bill successfully', async () => {
      const bill = createValidCreditCardBill();
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockConnection.getClient).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        expect.arrayContaining([
          bill.id,
          bill.closingDate,
          bill.dueDate,
          150000,
          BillStatusEnum.OPEN,
          undefined, // paid_at
          false, // is_deleted
          bill.updatedAt,
        ]),
      );
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const bill = createValidCreditCardBill();
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      await repository.execute(bill);

      const [query, params] = mockClient.query.mock.calls[0];
      expect(query).toContain('UPDATE credit_card_bills');
      expect(query).toContain('closing_date = $2');
      expect(query).toContain('due_date = $3');
      expect(query).toContain('amount = $4');
      expect(query).toContain('status = $5');
      expect(query).toContain('paid_at = $6');
      expect(query).toContain('is_deleted = $7');
      expect(query).toContain('updated_at = $8');
      expect(query).toContain('WHERE id = $1');
      expect(params).toHaveLength(8);
    });

    it('should handle paid credit card bill', async () => {
      const bill = createValidCreditCardBill();
      bill.markAsPaid();

      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      const [, params] = mockClient.query.mock.calls[0];
      expect(params[4]).toBe(BillStatusEnum.PAID); // status
      expect(params[5]).toBeInstanceOf(Date); // paid_at
    });

    it('should handle deleted credit card bill', async () => {
      const bill = createValidCreditCardBill();
      bill.delete();

      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should handle credit card bill with different amount', async () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-10'),
        amount: 250000,
      }).data!;

      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        expect.arrayContaining([250000]),
      );
    });

    it('should handle credit card bill with zero amount', async () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2024-03-15'),
        dueDate: new Date('2024-04-10'),
        amount: 0,
      }).data!;

      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        expect.arrayContaining([0]),
      );
    });

    it('should return error when database client fails', async () => {
      const bill = createValidCreditCardBill();
      const dbError = new Error('Database connection failed');
      mockConnection.getClient.mockRejectedValue(dbError);

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Failed to save credit card bill: Database connection failed',
      );
    });

    it('should return error when query fails', async () => {
      const bill = createValidCreditCardBill();
      const queryError = new Error('Query execution failed');
      mockClient.query.mockRejectedValue(queryError);

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to save credit card bill',
      );
      expect(result.errors[0].message).toContain('Query execution failed');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should always release client even on error', async () => {
      const bill = createValidCreditCardBill();
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(true);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should preserve all credit card bill properties during update', async () => {
      const creditCardId = EntityId.create().value!.id;
      const closingDate = new Date('2024-05-15');
      const dueDate = new Date('2024-06-10');
      const bill = CreditCardBill.create({
        creditCardId,
        closingDate,
        dueDate,
        amount: 350000,
      }).data!;

      mockClient.query.mockResolvedValue({ rowCount: 1 });

      await repository.execute(bill);

      const [, params] = mockClient.query.mock.calls[0];
      expect(params[0]).toBe(bill.id); // id
      expect(params[1]).toBe(closingDate); // closing_date
      expect(params[2]).toBe(dueDate); // due_date
      expect(params[3]).toBe(350000); // amount
      expect(params[4]).toBe(BillStatusEnum.OPEN); // status
      expect(params[5]).toBe(undefined); // paid_at
      expect(params[6]).toBe(false); // is_deleted
      expect(params[7]).toBeInstanceOf(Date); // updated_at
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

      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(bill);

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        expect.arrayContaining([futureClosingDate, futureDueDate]),
      );
    });
  });

  describe('executeWithClient', () => {
    it('should update credit card bill with provided client', async () => {
      const bill = createValidCreditCardBill();
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await repository.executeWithClient(mockClient, bill);

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.release).not.toHaveBeenCalled(); // Should not release when using provided client
    });

    it('should return error when executeWithClient query fails', async () => {
      const bill = createValidCreditCardBill();
      const queryError = new Error('Query failed with client');
      mockClient.query.mockRejectedValue(queryError);

      const result = await repository.executeWithClient(mockClient, bill);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Query failed with client');
    });
  });
});
