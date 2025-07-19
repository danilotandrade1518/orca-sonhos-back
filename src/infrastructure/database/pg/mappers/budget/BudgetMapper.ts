import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface BudgetRow {
  id: string;
  name: string;
  owner_id: string;
  participant_ids: string[]; // JSONB do PostgreSQL
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class BudgetMapper {
  static toDomain(row: BudgetRow): Either<DomainError, Budget> {
    return Budget.restore({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      participantIds: row.participant_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
    });
  }

  static toRow(budget: Budget): BudgetRow {
    return {
      id: budget.id,
      name: budget.name,
      owner_id: budget.ownerId,
      participant_ids: budget.participants,
      is_deleted: budget.isDeleted,
      created_at: budget.createdAt,
      updated_at: budget.updatedAt,
    };
  }
}
