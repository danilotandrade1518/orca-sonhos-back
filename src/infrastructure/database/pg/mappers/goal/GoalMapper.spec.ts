import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { GoalMapper, GoalRow } from './GoalMapper';

describe('GoalMapper', () => {
  describe('toDomain', () => {
    it('should convert row to domain entity successfully', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();
      const deadline = new Date('2025-12-31');

      const row: GoalRow = {
        id,
        name: 'Emergency Fund',
        total_amount: 100000,
        accumulated_amount: 25000,
        deadline,
        budget_id: budgetId,
        is_achieved: false,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      const result = GoalMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(id);
      expect(result.data!.name).toBe('Emergency Fund');
      expect(result.data!.totalAmount).toBe(100000);
      expect(result.data!.accumulatedAmount).toBe(25000);
      expect(result.data!.deadline).toBe(deadline);
      expect(result.data!.budgetId).toBe(budgetId);
      expect(result.data!.isDeleted).toBe(false);
      expect(result.data!.createdAt).toBe(now);
      expect(result.data!.updatedAt).toBe(now);
    });

    it('should handle goal without deadline', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: GoalRow = {
        id,
        name: 'Vacation Fund',
        total_amount: 50000,
        accumulated_amount: 10000,
        deadline: null,
        budget_id: budgetId,
        is_achieved: false,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      const result = GoalMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.deadline).toBeUndefined();
    });

    it('should handle deleted goal', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const now = new Date();

      const row: GoalRow = {
        id,
        name: 'Deleted Goal',
        total_amount: 75000,
        accumulated_amount: 0,
        deadline: null,
        budget_id: budgetId,
        is_achieved: false,
        is_deleted: true,
        created_at: now,
        updated_at: now,
      };

      const result = GoalMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error for invalid data', () => {
      const row: GoalRow = {
        id: 'invalid-id',
        name: '',
        total_amount: -1000,
        accumulated_amount: -500,
        deadline: null,
        budget_id: 'invalid-budget-id',
        is_achieved: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = GoalMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert domain entity to row successfully', () => {
      const deadline = new Date('2025-12-31');
      const goal = Goal.create({
        name: 'New Car',
        totalAmount: 500000,
        budgetId: EntityId.create().value!.id,
        deadline,
        accumulatedAmount: 100000,
      }).data!;

      const result = GoalMapper.toRow(goal);

      expect(result.id).toBe(goal.id);
      expect(result.name).toBe('New Car');
      expect(result.total_amount).toBe(500000);
      expect(result.accumulated_amount).toBe(100000);
      expect(result.deadline).toBe(deadline);
      expect(result.budget_id).toBe(goal.budgetId);
      expect(result.is_achieved).toBe(goal.isAchieved());
      expect(result.is_deleted).toBe(false);
      expect(result.created_at).toBe(goal.createdAt);
      expect(result.updated_at).toBe(goal.updatedAt);
    });

    it('should handle goal without deadline', () => {
      const goal = Goal.create({
        name: 'Open Goal',
        totalAmount: 200000,
        budgetId: EntityId.create().value!.id,
        accumulatedAmount: 50000,
      }).data!;

      const result = GoalMapper.toRow(goal);

      expect(result.deadline).toBeNull();
    });

    it('should handle achieved goal', () => {
      const goal = Goal.create({
        name: 'Achieved Goal',
        totalAmount: 100000,
        budgetId: EntityId.create().value!.id,
        accumulatedAmount: 100000,
      }).data!;

      const result = GoalMapper.toRow(goal);

      expect(result.is_achieved).toBe(true);
      expect(result.accumulated_amount).toBe(result.total_amount);
    });

    it('should handle deleted goal entity', () => {
      const goal = Goal.create({
        name: 'Goal to Delete',
        totalAmount: 150000,
        budgetId: EntityId.create().value!.id,
        accumulatedAmount: 30000,
      }).data!;

      goal.delete();

      const result = GoalMapper.toRow(goal);

      expect(result.is_deleted).toBe(true);
    });

    it('should preserve all entity properties', () => {
      const budgetId = EntityId.create().value!.id;
      const goal = Goal.create({
        name: 'Complete Goal',
        totalAmount: 300000,
        budgetId,
        accumulatedAmount: 75000,
      }).data!;

      const result = GoalMapper.toRow(goal);

      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.total_amount).toBe('number');
      expect(typeof result.accumulated_amount).toBe('number');
      expect(result.budget_id).toBe(budgetId);
      expect(typeof result.is_achieved).toBe('boolean');
      expect(typeof result.is_deleted).toBe('boolean');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });
});
