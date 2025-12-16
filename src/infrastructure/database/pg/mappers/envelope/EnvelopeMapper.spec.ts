import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EnvelopeMapper, EnvelopeRow } from './EnvelopeMapper';

describe('EnvelopeMapper', () => {
  describe('toDomain', () => {
    const validId = EntityId.create().value!.id;
    const budgetId = EntityId.create().value!.id;
    const categoryId = EntityId.create().value!.id;

    it('should convert row to domain successfully', () => {
      const row: EnvelopeRow = {
        id: validId,
        name: 'Test Envelope',
        monthly_limit: 10000,
        budget_id: budgetId,
        category_id: categoryId,
        is_deleted: false,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      };

      const result = EnvelopeMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(validId);
      expect(result.data!.name).toBe('Test Envelope');
      expect(result.data!.monthlyLimit).toBe(10000); // 100.00 * 100
      expect(result.data!.budgetId).toBe(budgetId);
      expect(result.data!.categoryId).toBe(categoryId);
      expect(result.data!.isDeleted).toBe(false);
      expect(result.data!.createdAt).toEqual(new Date('2025-01-01'));
      expect(result.data!.updatedAt).toEqual(new Date('2025-01-02'));
    });

    it('should handle monetary values correctly', () => {
      const row: EnvelopeRow = {
        id: validId,
        name: 'Test Envelope',
        monthly_limit: 150,
        budget_id: budgetId,
        category_id: categoryId,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = EnvelopeMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.monthlyLimit).toBe(150); // 1.50 * 100
    });

    it('should return error for invalid envelope data', () => {
      const row: EnvelopeRow = {
        id: 'invalid-id',
        name: '', // Invalid name
        monthly_limit: 10000,
        budget_id: budgetId,
        category_id: categoryId,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = EnvelopeMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert domain to row successfully', () => {
      const envelope = Envelope.create({
        name: 'Test Envelope',
        monthlyLimit: 10000, // 100.00 in cents
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
      }).data!;

      const result = EnvelopeMapper.toRow(envelope);

      expect(result.id).toBe(envelope.id);
      expect(result.name).toBe('Test Envelope');
      expect(result.monthly_limit).toBe(10000);
      expect(result.budget_id).toBe(envelope.budgetId);
      expect(result.category_id).toBe(envelope.categoryId);
      expect(result.is_deleted).toBe(false);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle monetary values correctly', () => {
      const envelope = Envelope.create({
        name: 'Test Envelope',
        monthlyLimit: 150, // 1.50 in cents
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
      }).data!;

      const result = EnvelopeMapper.toRow(envelope);

      expect(result.monthly_limit).toBe(150);
    });
  });
});
