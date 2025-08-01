import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface GoalRow {
  id: string;
  name: string;
  total_amount: number;
  accumulated_amount: number;
  deadline: Date | null;
  budget_id: string;
  is_achieved: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class GoalMapper {
  static toDomain(row: GoalRow): Either<DomainError, Goal> {
    return Goal.restore({
      id: row.id,
      name: row.name,
      totalAmount: row.total_amount,
      accumulatedAmount: row.accumulated_amount,
      deadline: row.deadline || undefined,
      budgetId: row.budget_id,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(goal: Goal): GoalRow {
    return {
      id: goal.id,
      name: goal.name,
      total_amount: goal.totalAmount,
      accumulated_amount: goal.accumulatedAmount,
      deadline: goal.deadline || null,
      budget_id: goal.budgetId,
      is_achieved: goal.isAchieved(),
      is_deleted: goal.isDeleted,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt,
    };
  }
}
