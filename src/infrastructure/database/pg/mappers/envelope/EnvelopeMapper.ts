import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface EnvelopeRow {
  id: string;
  name: string;
  monthly_limit: string;
  budget_id: string;
  category_id: string;
  current_balance: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class EnvelopeMapper {
  static toDomain(row: EnvelopeRow): Either<DomainError, Envelope> {
    const monthlyLimit = Math.round(parseFloat(row.monthly_limit) * 100);
    const currentBalance = Math.round(parseFloat(row.current_balance) * 100);

    return Envelope.restore({
      id: row.id,
      name: row.name,
      monthlyLimit,
      budgetId: row.budget_id,
      categoryId: row.category_id,
      currentBalance,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(envelope: Envelope): EnvelopeRow {
    return {
      id: envelope.id,
      name: envelope.name,
      monthly_limit: (envelope.monthlyLimit / 100).toFixed(2),
      budget_id: envelope.budgetId,
      category_id: envelope.categoryId,
      current_balance: (envelope.currentBalance / 100).toFixed(2),
      is_deleted: envelope.isDeleted,
      created_at: envelope.createdAt,
      updated_at: envelope.updatedAt,
    };
  }
}
