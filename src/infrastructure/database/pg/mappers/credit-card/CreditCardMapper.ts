import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface CreditCardRow {
  id: string;
  name: string;
  limit: number;
  closing_day: number;
  due_day: number;
  budget_id: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CreditCardMapper {
  static toDomain(row: CreditCardRow): Either<DomainError, CreditCard> {
    return CreditCard.restore({
      id: row.id,
      name: row.name,
      limit: row.limit,
      closingDay: row.closing_day,
      dueDay: row.due_day,
      budgetId: row.budget_id,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(creditCard: CreditCard): CreditCardRow {
    return {
      id: creditCard.id,
      name: creditCard.name,
      limit: creditCard.limit,
      closing_day: creditCard.closingDay,
      due_day: creditCard.dueDay,
      budget_id: creditCard.budgetId,
      is_deleted: creditCard.isDeleted,
      created_at: creditCard.createdAt,
      updated_at: creditCard.updatedAt,
    };
  }
}
