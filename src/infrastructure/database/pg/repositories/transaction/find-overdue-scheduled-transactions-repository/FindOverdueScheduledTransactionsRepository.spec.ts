import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';
import { FindOverdueScheduledTransactionsRepository } from './FindOverdueScheduledTransactionsRepository';

jest.mock('../../../mappers/transaction/TransactionMapper');

class TestDomainError extends DomainError {
  protected fieldName: string = 'test';

  constructor(message: string) {
    super(message);
  }
}

describe('FindOverdueScheduledTransactionsRepository', () => {
  let repository: FindOverdueScheduledTransactionsRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockMapper: jest.Mocked<typeof TransactionMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockMapper = TransactionMapper as jest.Mocked<typeof TransactionMapper>;
    repository = new FindOverdueScheduledTransactionsRepository(mockConnection);
  });

  describe('execute', () => {
    const referenceDate = new Date('2025-08-08T00:00:00.000Z');
    const validId = EntityId.create().value!.id;
    const accountId = EntityId.create().value!.id;
    const categoryId = EntityId.create().value!.id;
    const budgetId = EntityId.create().value!.id;

    const createValidRow = (transactionDate: Date): TransactionRow => ({
      id: validId,
      description: 'Overdue transaction',
      amount: 5000,
      type: 'EXPENSE',
      account_id: accountId,
      category_id: categoryId,
      budget_id: budgetId,
      transaction_date: transactionDate,
      status: 'SCHEDULED',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createValidTransaction = (): Transaction => {
      const result = Transaction.create({
        description: 'Overdue transaction',
        amount: 5000, // 50.00 em centavos
        type: TransactionTypeEnum.EXPENSE,
        accountId,
        categoryId,
        budgetId,
        transactionDate: new Date('2025-08-07'),
        status: TransactionStatusEnum.SCHEDULED,
      });
      return result.data!;
    };

    it('should return overdue scheduled transactions', async () => {
      const overdueDate = new Date('2025-08-07T00:00:00.000Z'); // Anterior à referência
      const row = createValidRow(overdueDate);
      const transaction = createValidTransaction();

      mockConnection.query.mockResolvedValue({ rows: [row], rowCount: 1 });
      mockMapper.toDomain.mockReturnValue(Either.success(transaction));

      const result = await repository.execute(referenceDate);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toBe(transaction);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['SCHEDULED', referenceDate],
      );
    });

    it('should return empty array when no overdue transactions found', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await repository.execute(referenceDate);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('should filter by SCHEDULED status', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.execute(referenceDate);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.arrayContaining(['SCHEDULED']),
      );
    });

    it('should filter by transaction_date < referenceDate', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.execute(referenceDate);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('transaction_date < $2'),
        expect.arrayContaining([referenceDate]),
      );
    });

    it('should exclude deleted transactions', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.execute(referenceDate);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        expect.any(Array),
      );
    });

    it('should order by transaction_date ASC', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.execute(referenceDate);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY transaction_date ASC'),
        expect.any(Array),
      );
    });

    it('should handle multiple overdue transactions', async () => {
      const row1 = createValidRow(new Date('2025-08-06'));
      const row2 = createValidRow(new Date('2025-08-07'));
      const transaction1 = createValidTransaction();
      const transaction2 = createValidTransaction();

      mockConnection.query.mockResolvedValue({
        rows: [row1, row2],
        rowCount: 2,
      });
      mockMapper.toDomain
        .mockReturnValueOnce(Either.success(transaction1))
        .mockReturnValueOnce(Either.success(transaction2));

      const result = await repository.execute(referenceDate);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toBe(transaction1);
      expect(result.data![1]).toBe(transaction2);
    });

    it('should handle mapper errors', async () => {
      const row = createValidRow(new Date('2025-08-07'));
      const mapperError = new TestDomainError('Mapping failed');

      mockConnection.query.mockResolvedValue({ rows: [row], rowCount: 1 });
      mockMapper.toDomain.mockReturnValue(Either.error(mapperError));

      const result = await repository.execute(referenceDate);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to map transaction');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(referenceDate);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to find overdue scheduled transactions',
      );
    });

    it('should handle unknown errors', async () => {
      const unknownError = 'Unknown error';
      mockConnection.query.mockRejectedValue(unknownError);

      const result = await repository.execute(referenceDate);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should use correct SQL query structure', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.execute(referenceDate);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM transactions'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('AND transaction_date < $2'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('AND is_deleted = false'),
        expect.any(Array),
      );
    });
  });
});
