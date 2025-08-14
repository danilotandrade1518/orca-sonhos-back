import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { TransactionMapper, TransactionRow } from './TransactionMapper';

describe('TransactionMapper', () => {
  describe('toDomain', () => {
    it('should convert valid row to Transaction entity', () => {
      const row: TransactionRow = {
        id: EntityId.create().value!.id,
        description: 'Test',
        amount: 10050,
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

      const result = TransactionMapper.toDomain(row);
      expect(result.hasError).toBe(false);
      const tx = result.data!;
      expect(tx.description).toBe('Test');
      expect(tx.amount).toBe(10050);
      expect(tx.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(tx.categoryId).toBe(row.category_id!);
      expect(tx.status).toBe(TransactionStatusEnum.SCHEDULED);
    });

    it('should return error with invalid data', () => {
      const row: TransactionRow = {
        id: 'invalid',
        description: 'Te',
        amount: -100,
        type: 'WRONG',
        account_id: 'invalid',
        category_id: 'invalid',
        budget_id: 'invalid',
        transaction_date: new Date('2024-01-01'),
        status: 'WRONG',
        is_deleted: false,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      const result = TransactionMapper.toDomain(row);
      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert Transaction entity to row', () => {
      const tx = Transaction.create({
        description: 'RowTest',
        amount: 12345,
        type: TransactionTypeEnum.INCOME,
        transactionDate: new Date('2024-01-05'),
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        accountId: EntityId.create().value!.id,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const row = TransactionMapper.toRow(tx);
      expect(row.id).toBe(tx.id);
      expect(row.amount).toBe(12345);
      expect(row.type).toBe('INCOME');
      expect(row.category_id).toBe(tx.categoryId);
      expect(row.status).toBe('SCHEDULED');
    });
  });
});
