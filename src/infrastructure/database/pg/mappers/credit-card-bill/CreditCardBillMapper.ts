import { Either } from '@either';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { DomainError } from '@domain/shared/DomainError';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';

export type CreditCardBillRow = {
  id: string;
  credit_card_id: string;
  closing_date: Date;
  due_date: Date;
  amount: number;
  status: BillStatusEnum;
  paid_at?: Date;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

export class CreditCardBillMapper {
  static toDomain(row: CreditCardBillRow): Either<DomainError, CreditCardBill> {
    return CreditCardBill.restore({
      id: row.id,
      creditCardId: row.credit_card_id,
      closingDate: row.closing_date,
      dueDate: row.due_date,
      amount: row.amount,
      status: row.status,
      paidAt: row.paid_at,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(bill: CreditCardBill): CreditCardBillRow {
    return {
      id: bill.id,
      credit_card_id: bill.creditCardId,
      closing_date: bill.closingDate,
      due_date: bill.dueDate,
      amount: bill.amount,
      status: bill.status,
      paid_at: bill.paidAt,
      is_deleted: bill.isDeleted,
      created_at: bill.createdAt,
      updated_at: bill.updatedAt,
    };
  }
}
