import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';
import { SaveTransactionRepository } from './SaveTransactionRepository';

jest.mock('../../../mappers/transaction/TransactionMapper');

describe('SaveTransactionRepository', () => {
  let repository: SaveTransactionRepository;
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
    repository = new SaveTransactionRepository(mockConnection);
  });

  describe('execute', () => {
    const tx = Transaction.create({
      description: 'save',
      amount: 2000,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date('2024-01-10'),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    }).data!;

    const row: TransactionRow = {
      id: tx.id,
      description: tx.description,
      amount: '20.00',
      type: tx.type,
      account_id: tx.accountId,
      category_id: tx.categoryId,
      budget_id: tx.budgetId,
      transaction_date: tx.transactionDate,
      status: tx.status,
      is_deleted: tx.isDeleted,
      created_at: tx.createdAt,
      updated_at: tx.updatedAt,
    };

    it('should update transaction successfully', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      mockConnection.query.mockResolvedValue(null);

      const result = await repository.execute(tx);
      expect(result.hasError).toBe(false);
    });

    it('should update existing transaction', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      mockConnection.query.mockResolvedValue(null);

      await repository.execute(tx);
      const query = mockConnection.query.mock.calls[0][0];
      expect(query).toContain('UPDATE transactions SET');
      expect(query).toContain('WHERE id = $1');
    });

    it('should call UPDATE with correct parameters', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      mockConnection.query.mockResolvedValue(null);

      await repository.execute(tx);
      const params = mockConnection.query.mock.calls[0][1];
      expect(params).toEqual([
        row.id,
        row.description,
        row.amount,
        row.type,
        row.account_id,
        row.category_id,
        row.budget_id,
        row.transaction_date,
        row.status,
        row.is_deleted,
        expect.any(Date), // updated_at é atualizado dinamicamente
      ]);
    });

    it('should return error when db fails', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      const err = new Error('db');
      mockConnection.query.mockRejectedValue(err);

      const result = await repository.execute(tx);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error when mapping fails', async () => {
      mockMapper.toRow.mockImplementation(() => {
        throw new Error('map');
      });

      const result = await repository.execute(tx);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
