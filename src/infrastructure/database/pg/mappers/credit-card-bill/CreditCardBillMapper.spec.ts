import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import {
  CreditCardBillMapper,
  CreditCardBillRow,
} from './CreditCardBillMapper';

describe('CreditCardBillMapper', () => {
  describe('toDomain', () => {
    it('should convert row to domain entity successfully', () => {
      const id = EntityId.create().value!.id;
      const creditCardId = EntityId.create().value!.id;
      const closingDate = new Date('2025-01-05');
      const dueDate = new Date('2025-01-15');
      const now = new Date();

      const row: CreditCardBillRow = {
        id,
        credit_card_id: creditCardId,
        closing_date: closingDate,
        due_date: dueDate,
        amount: 150000,
        status: BillStatusEnum.OPEN,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      const result = CreditCardBillMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(id);
      expect(result.data!.creditCardId).toBe(creditCardId);
      expect(result.data!.closingDate).toBe(closingDate);
      expect(result.data!.dueDate).toBe(dueDate);
      expect(result.data!.amount).toBe(150000);
      expect(result.data!.status).toBe(BillStatusEnum.OPEN);
      expect(result.data!.paidAt).toBeUndefined();
      expect(result.data!.isDeleted).toBe(false);
      expect(result.data!.createdAt).toBe(now);
      expect(result.data!.updatedAt).toBe(now);
    });

    it('should handle paid bill with paid_at date', () => {
      const id = EntityId.create().value!.id;
      const creditCardId = EntityId.create().value!.id;
      const paidAt = new Date('2025-01-10');

      const row: CreditCardBillRow = {
        id,
        credit_card_id: creditCardId,
        closing_date: new Date('2025-01-05'),
        due_date: new Date('2025-01-15'),
        amount: 250000,
        status: BillStatusEnum.PAID,
        paid_at: paidAt,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = CreditCardBillMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.status).toBe(BillStatusEnum.PAID);
      expect(result.data!.paidAt).toBe(paidAt);
    });

    it('should handle overdue bill', () => {
      const id = EntityId.create().value!.id;
      const creditCardId = EntityId.create().value!.id;

      const row: CreditCardBillRow = {
        id,
        credit_card_id: creditCardId,
        closing_date: new Date('2024-12-05'),
        due_date: new Date('2024-12-15'),
        amount: 100000,
        status: BillStatusEnum.OVERDUE,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = CreditCardBillMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.status).toBe(BillStatusEnum.OVERDUE);
    });

    it('should handle deleted bill', () => {
      const id = EntityId.create().value!.id;
      const creditCardId = EntityId.create().value!.id;

      const row: CreditCardBillRow = {
        id,
        credit_card_id: creditCardId,
        closing_date: new Date('2025-01-05'),
        due_date: new Date('2025-01-15'),
        amount: 50000,
        status: BillStatusEnum.OPEN,
        is_deleted: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = CreditCardBillMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error for invalid data', () => {
      const row: CreditCardBillRow = {
        id: 'invalid-id',
        credit_card_id: 'invalid-credit-card-id',
        closing_date: new Date('invalid-date'),
        due_date: new Date('invalid-date'),
        amount: -1000,
        status: 'INVALID_STATUS' as BillStatusEnum,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = CreditCardBillMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert pending bill to row successfully', () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2025-02-05'),
        dueDate: new Date('2025-02-15'),
        amount: 300000,
      }).data!;

      const result = CreditCardBillMapper.toRow(bill);

      expect(result.id).toBe(bill.id);
      expect(result.credit_card_id).toBe(bill.creditCardId);
      expect(result.closing_date).toBe(bill.closingDate);
      expect(result.due_date).toBe(bill.dueDate);
      expect(result.amount).toBe(300000);
      expect(result.status).toBe(BillStatusEnum.OPEN);
      expect(result.paid_at).toBeUndefined();
      expect(result.is_deleted).toBe(false);
      expect(result.created_at).toBe(bill.createdAt);
      expect(result.updated_at).toBe(bill.updatedAt);
    });

    it('should handle paid bill with paid_at date', () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2025-02-05'),
        dueDate: new Date('2025-02-15'),
        amount: 200000,
      }).data!;

      bill.markAsPaid();

      const result = CreditCardBillMapper.toRow(bill);

      expect(result.status).toBe(BillStatusEnum.PAID);
      expect(result.paid_at).toBeDefined();
    });

    it('should handle deleted bill entity', () => {
      const bill = CreditCardBill.create({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date('2025-02-05'),
        dueDate: new Date('2025-02-15'),
        amount: 100000,
      }).data!;

      bill.delete();

      const result = CreditCardBillMapper.toRow(bill);

      expect(result.is_deleted).toBe(true);
    });

    it('should preserve all entity properties', () => {
      const creditCardId = EntityId.create().value!.id;
      const closingDate = new Date('2025-03-05');
      const dueDate = new Date('2025-03-15');

      const bill = CreditCardBill.create({
        creditCardId,
        closingDate,
        dueDate,
        amount: 400000,
      }).data!;

      const result = CreditCardBillMapper.toRow(bill);

      expect(typeof result.id).toBe('string');
      expect(result.credit_card_id).toBe(creditCardId);
      expect(result.closing_date).toBe(closingDate);
      expect(result.due_date).toBe(dueDate);
      expect(typeof result.amount).toBe('number');
      expect(Object.values(BillStatusEnum)).toContain(result.status);
      expect(typeof result.is_deleted).toBe('boolean');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });
});
