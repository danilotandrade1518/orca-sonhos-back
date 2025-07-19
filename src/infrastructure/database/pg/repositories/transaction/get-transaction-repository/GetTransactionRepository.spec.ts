import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';
import { GetTransactionRepository } from './GetTransactionRepository';

jest.mock('../../../connection/PostgreSQLConnection');
jest.mock('../../../mappers/transaction/TransactionMapper');

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.fieldName = 'test';
  }
}

describe('GetTransactionRepository', () => {
  let repository: GetTransactionRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryOne: jest.MockedFunction<any>;
  let mockMapper: jest.Mocked<typeof TransactionMapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    mockMapper = TransactionMapper as jest.Mocked<typeof TransactionMapper>;
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    repository = new GetTransactionRepository();
  });

  describe('execute', () => {
    const validId = EntityId.create().value!.id;
    const row: TransactionRow = {
      id: validId,
      description: 'Test',
      amount: '20.00',
      type: 'EXPENSE',
      account_id: EntityId.create().value!.id,
      category_id: EntityId.create().value!.id,
      budget_id: EntityId.create().value!.id,
      transaction_date: new Date('2024-01-01'),
      status: 'SCHEDULED',
      is_deleted: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-02'),
    };

    it('should return transaction when found', async () => {
      const tx = {} as Transaction;
      mockQueryOne.mockResolvedValue(row);
      mockMapper.toDomain.mockReturnValue(Either.success(tx));

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(tx);
    });

    it('should handle null category_id', async () => {
      const rowNull = { ...row, category_id: null } as TransactionRow;
      const tx = {} as Transaction;
      mockQueryOne.mockResolvedValue(rowNull);
      mockMapper.toDomain.mockReturnValue(Either.success(tx));

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(tx);
    });

    it('should return null when not found', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return error when mapping fails', async () => {
      mockQueryOne.mockResolvedValue(row);
      mockMapper.toDomain.mockReturnValue(
        Either.error(new TestDomainError('map')),
      );

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error on db failure', async () => {
      const err = new Error('fail');
      mockQueryOne.mockRejectedValue(err);

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBe(err);
    });
  });
});
