import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CategoryMapper, CategoryRow } from './CategoryMapper';

describe('CategoryMapper', () => {
  describe('toDomain', () => {
    it('should convert row to domain entity successfully', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: CategoryRow = {
        id,
        name: 'Food',
        type: CategoryTypeEnum.EXPENSE,
        budget_id: budgetId,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      const result = CategoryMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(id);
      expect(result.data!.name).toBe('Food');
      expect(result.data!.type).toBe(CategoryTypeEnum.EXPENSE);
      expect(result.data!.budgetId).toBe(budgetId);
      expect(result.data!.isDeleted).toBe(false);
      expect(result.data!.createdAt).toBe(now);
      expect(result.data!.updatedAt).toBe(now);
    });

    it('should handle income category', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: CategoryRow = {
        id,
        name: 'Salary',
        type: CategoryTypeEnum.INCOME,
        budget_id: budgetId,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      const result = CategoryMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.type).toBe(CategoryTypeEnum.INCOME);
    });

    it('should handle deleted category', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: CategoryRow = {
        id,
        name: 'Deleted Category',
        type: CategoryTypeEnum.EXPENSE,
        budget_id: budgetId,
        is_deleted: true,
        created_at: now,
        updated_at: now,
      };

      const result = CategoryMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error for invalid data', () => {
      const row: CategoryRow = {
        id: 'invalid-id',
        name: '',
        type: 'INVALID_TYPE' as CategoryTypeEnum,
        budget_id: 'invalid-budget-id',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = CategoryMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert expense category to row successfully', () => {
      const category = Category.create({
        name: 'Transportation',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = CategoryMapper.toRow(category);

      expect(result.id).toBe(category.id);
      expect(result.name).toBe('Transportation');
      expect(result.type).toBe(CategoryTypeEnum.EXPENSE);
      expect(result.budget_id).toBe(category.budgetId);
      expect(result.is_deleted).toBe(false);
      expect(result.created_at).toBe(category.createdAt);
      expect(result.updated_at).toBe(category.updatedAt);
    });

    it('should convert income category to row successfully', () => {
      const category = Category.create({
        name: 'Freelance',
        type: CategoryTypeEnum.INCOME,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = CategoryMapper.toRow(category);

      expect(result.type).toBe(CategoryTypeEnum.INCOME);
    });

    it('should handle deleted category entity', () => {
      const category = Category.create({
        name: 'Category to Delete',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: EntityId.create().value!.id,
      }).data!;

      category.delete();

      const result = CategoryMapper.toRow(category);

      expect(result.is_deleted).toBe(true);
    });

    it('should preserve all entity properties', () => {
      const budgetId = EntityId.create().value!.id;
      const category = Category.create({
        name: 'Complete Category',
        type: CategoryTypeEnum.EXPENSE,
        budgetId,
      }).data!;

      const result = CategoryMapper.toRow(category);

      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(Object.values(CategoryTypeEnum)).toContain(result.type);
      expect(result.budget_id).toBe(budgetId);
      expect(typeof result.is_deleted).toBe('boolean');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });
});
