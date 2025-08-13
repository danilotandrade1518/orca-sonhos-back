import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CreditCardMapper, CreditCardRow } from './CreditCardMapper';

describe('CreditCardMapper', () => {
  describe('toDomain', () => {
    it('should convert row to domain entity successfully', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: CreditCardRow = {
        id,
        name: 'Test Credit Card',
        credit_limit: 100000,
        closing_day: 5,
        due_day: 10,
        budget_id: budgetId,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      const result = CreditCardMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(id);
      expect(result.data!.name).toBe('Test Credit Card');
      expect(result.data!.limit).toBe(100000);
      expect(result.data!.closingDay).toBe(5);
      expect(result.data!.dueDay).toBe(10);
      expect(result.data!.budgetId).toBe(budgetId);
      expect(result.data!.isDeleted).toBe(false);
      expect(result.data!.createdAt).toBe(now);
      expect(result.data!.updatedAt).toBe(now);
    });

    it('should handle deleted credit card', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: CreditCardRow = {
        id,
        name: 'Deleted Credit Card',
        credit_limit: 50000,
        closing_day: 15,
        due_day: 20,
        budget_id: budgetId,
        is_deleted: true,
        created_at: now,
        updated_at: now,
      };

      const result = CreditCardMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error for invalid data', () => {
      const row: CreditCardRow = {
        id: 'invalid-id',
        name: '',
        credit_limit: -1000,
        closing_day: 35,
        due_day: -5,
        budget_id: 'invalid-budget-id',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = CreditCardMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert domain entity to row successfully', () => {
      const creditCard = CreditCard.create({
        name: 'My Credit Card',
        limit: 200000,
        closingDay: 7,
        dueDay: 12,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = CreditCardMapper.toRow(creditCard);

      expect(result.id).toBe(creditCard.id);
      expect(result.name).toBe('My Credit Card');
      expect(result.credit_limit).toBe(200000);
      expect(result.closing_day).toBe(7);
      expect(result.due_day).toBe(12);
      expect(result.budget_id).toBe(creditCard.budgetId);
      expect(result.is_deleted).toBe(false);
      expect(result.created_at).toBe(creditCard.createdAt);
      expect(result.updated_at).toBe(creditCard.updatedAt);
    });

    it('should handle deleted credit card entity', () => {
      const creditCard = CreditCard.create({
        name: 'Card to Delete',
        limit: 150000,
        closingDay: 3,
        dueDay: 8,
        budgetId: EntityId.create().value!.id,
      }).data!;

      creditCard.delete();

      const result = CreditCardMapper.toRow(creditCard);

      expect(result.is_deleted).toBe(true);
    });

    it('should preserve all entity properties', () => {
      const budgetId = EntityId.create().value!.id;
      const creditCard = CreditCard.create({
        name: 'Complete Credit Card',
        limit: 300000,
        closingDay: 1,
        dueDay: 15,
        budgetId,
      }).data!;

      const result = CreditCardMapper.toRow(creditCard);

      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.credit_limit).toBe('number');
      expect(typeof result.closing_day).toBe('number');
      expect(typeof result.due_day).toBe('number');
      expect(result.budget_id).toBe(budgetId);
      expect(typeof result.is_deleted).toBe('boolean');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });
});
