import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface EnvelopeRow {
  id: string;
  name: string;
  monthly_limit: number;
  budget_id: string;
  category_id: string;
  current_balance: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class EnvelopeMapper {
  static toDomain(row: EnvelopeRow): Either<DomainError, Envelope> {
    return Envelope.restore({
      id: row.id,
      name: row.name,
      monthlyLimit: Number(row.monthly_limit),
      budgetId: row.budget_id,
      categoryId: row.category_id,
      currentBalance: Number(row.current_balance),
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(envelope: Envelope): EnvelopeRow {
    return {
      id: envelope.id,
      name: envelope.name,
      monthly_limit: envelope.monthlyLimit,
      budget_id: envelope.budgetId,
      category_id: envelope.categoryId,
      current_balance: envelope.currentBalance,
      is_deleted: envelope.isDeleted,
      created_at: envelope.createdAt,
      updated_at: envelope.updatedAt,
    };
  }
}
