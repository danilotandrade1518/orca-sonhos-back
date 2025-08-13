import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';
import { GetTransactionRepository } from './GetTransactionRepository';

jest.mock('../../../mappers/transaction/TransactionMapper');

class TestDomainError extends DomainError {
  protected fieldName: string = 'test';

  constructor(message: string) {
    super(message);
  }
}

describe('GetTransactionRepository', () => {
  let repository: GetTransactionRepository;
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
    repository = new GetTransactionRepository(mockConnection);
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
      mockConnection.query.mockResolvedValue({ rows: [row], rowCount: 1 });
      mockMapper.toDomain.mockReturnValue(Either.success(tx));

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(tx);
    });

    it('should return null when not found', async () => {
      mockConnection.query.mockResolvedValue(null);

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return error when mapping fails', async () => {
      mockConnection.query.mockResolvedValue({ rows: [row], rowCount: 1 });
      mockMapper.toDomain.mockReturnValue(
        Either.error(new TestDomainError('map')),
      );

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error on db failure', async () => {
      const err = new Error('fail');
      mockConnection.query.mockRejectedValue(err);

      const result = await repository.execute(validId);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBe(err);
    });
  });
});
