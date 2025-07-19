import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';
import { AddTransactionRepository } from './AddTransactionRepository';

jest.mock('../../../connection/PostgreSQLConnection');
jest.mock('../../../mappers/transaction/TransactionMapper');

describe('AddTransactionRepository', () => {
  let repository: AddTransactionRepository;
  let mockQueryOne: jest.MockedFunction<PostgreSQLConnection['queryOne']>;
  let mockMapper: jest.Mocked<typeof TransactionMapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    mockMapper = TransactionMapper as jest.Mocked<typeof TransactionMapper>;
    repository = new AddTransactionRepository();
  });

  describe('execute', () => {
    const tx = Transaction.create({
      description: 'Add',
      amount: 1000,
      type: TransactionTypeEnum.INCOME,
      transactionDate: new Date('2024-01-01'),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    }).data!;

    const row: TransactionRow = {
      id: tx.id,
      description: tx.description,
      amount: '10.00',
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

    it('should add transaction successfully', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(tx);
      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledTimes(1);
    });

    it('should return error when transaction already exists', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      const err = new Error('dup') as Error & { code?: string };
      err.code = '23505';
      mockQueryOne.mockRejectedValue(err);

      const result = await repository.execute(tx);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error on connection fail', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      const err = new Error('fail');
      mockQueryOne.mockRejectedValue(err);

      const result = await repository.execute(tx);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
