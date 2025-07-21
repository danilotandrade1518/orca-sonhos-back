import { InvalidEntityIdError } from '../../../shared/errors/InvalidEntityIdError';
import { InvalidMoneyError } from '../../../shared/errors/InvalidMoneyError';
import { InvalidCreditCardBillDateError } from '../errors/InvalidCreditCardBillDateError';
import { BillStatusEnum } from '../value-objects/bill-status/BillStatus';
import { CreditCardBillCreatedEvent } from '../events/CreditCardBillCreatedEvent';
import { CreditCardBillPaidEvent } from '../events/CreditCardBillPaidEvent';
import { CreditCardBillDeletedEvent } from '../events/CreditCardBillDeletedEvent';
import { CreditCardBillReopenedEvent } from '../events/CreditCardBillReopenedEvent';
import { CreateCreditCardBillDTO, CreditCardBill } from './CreditCardBill';

const makeValidDTO = (
  overrides: Partial<CreateCreditCardBillDTO> = {},
): CreateCreditCardBillDTO => {
  const closingDate = new Date('2025-01-15');
  const dueDate = new Date('2025-01-25');

  return {
    creditCardId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    closingDate,
    dueDate,
    amount: 50000, // R$ 500,00
    status: BillStatusEnum.OPEN,
    ...overrides,
  };
};

describe('CreditCardBill', () => {
  describe('create', () => {
    it('deve criar uma fatura válida', () => {
      const dto = makeValidDTO();
      const result = CreditCardBill.create(dto);

      expect(result.hasError).toBe(false);
      expect(result.data?.creditCardId).toBe(dto.creditCardId);
      expect(result.data?.closingDate).toEqual(dto.closingDate);
      expect(result.data?.dueDate).toEqual(dto.dueDate);
      expect(result.data?.amount).toBe(50000);
      expect(result.data?.status).toBe(BillStatusEnum.OPEN);
      expect(result.data?.getEvents()).toHaveLength(1);
      expect(result.data?.getEvents()[0]).toBeInstanceOf(
        CreditCardBillCreatedEvent,
      );
    });

    it('deve criar uma fatura com status padrão "OPEN"', () => {
      const dto = makeValidDTO({ status: undefined });
      const result = CreditCardBill.create(dto);

      expect(result.hasError).toBe(false);
      expect(result.data?.status).toBe(BillStatusEnum.OPEN);
    });

    it('deve retornar erro se creditCardId for inválido', () => {
      const dto = makeValidDTO({ creditCardId: 'invalid-id' });
      const result = CreditCardBill.create(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError('invalid-id'));
    });

    it('deve retornar erro se amount for inválido', () => {
      const dto = makeValidDTO({ amount: -100 });
      const result = CreditCardBill.create(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidMoneyError(-100));
    });

    it('deve retornar erro se data de fechamento for posterior ou igual à data de vencimento', () => {
      const closingDate = new Date('2025-01-25');
      const dueDate = new Date('2025-01-20');
      const dto = makeValidDTO({ closingDate, dueDate });
      const result = CreditCardBill.create(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCreditCardBillDateError());
    });

    it('deve acumular múltiplos erros', () => {
      const dto = makeValidDTO({
        creditCardId: 'invalid',
        amount: -100,
      });
      const result = CreditCardBill.create(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('business methods', () => {
    let bill: CreditCardBill;

    beforeEach(() => {
      const dto = makeValidDTO();
      const result = CreditCardBill.create(dto);
      bill = result.data!;
    });

    describe('isOverdue', () => {
      it('deve retornar true se a fatura estiver vencida e não paga', () => {
        const pastDueDate = new Date();
        pastDueDate.setDate(pastDueDate.getDate() - 5); // 5 dias atrás

        const dto = makeValidDTO({
          dueDate: pastDueDate,
          status: BillStatusEnum.CLOSED,
        });
        const result = CreditCardBill.create(dto);
        const overdueBill = result.data!;

        expect(overdueBill.isOverdue).toBe(true);
      });

      it('deve retornar false se a fatura estiver vencida mas paga', () => {
        const pastDueDate = new Date();
        pastDueDate.setDate(pastDueDate.getDate() - 5);

        const dto = makeValidDTO({
          dueDate: pastDueDate,
          status: BillStatusEnum.PAID,
        });
        const result = CreditCardBill.create(dto);
        const paidBill = result.data!;

        expect(paidBill.isOverdue).toBe(false);
      });

      it('deve retornar false se a fatura não estiver vencida', () => {
        const futureDueDate = new Date();
        futureDueDate.setDate(futureDueDate.getDate() + 5);

        const dto = makeValidDTO({
          dueDate: futureDueDate,
          status: BillStatusEnum.CLOSED,
        });
        const result = CreditCardBill.create(dto);
        const futureBill = result.data!;

        expect(futureBill.isOverdue).toBe(false);
      });
    });

    describe('daysToDue', () => {
      it('deve calcular corretamente os dias até o vencimento', () => {
        const futureDueDate = new Date();
        futureDueDate.setDate(futureDueDate.getDate() + 7);

        const dto = makeValidDTO({ dueDate: futureDueDate });
        const result = CreditCardBill.create(dto);
        const futureBill = result.data!;

        expect(futureBill.daysToDue).toBe(7);
      });

      it('deve retornar número negativo para faturas vencidas', () => {
        const pastDueDate = new Date();
        pastDueDate.setDate(pastDueDate.getDate() - 3);

        const dto = makeValidDTO({ dueDate: pastDueDate });
        const result = CreditCardBill.create(dto);
        const pastBill = result.data!;

        expect(pastBill.daysToDue).toBe(-3);
      });
    });

    describe('markAsPaid', () => {
      beforeEach(() => {
        bill.clearEvents();
      });

      it('deve marcar a fatura como paga', () => {
        const result = bill.markAsPaid();

        expect(result.hasError).toBe(false);
        expect(bill.status).toBe(BillStatusEnum.PAID);
        expect(bill.paidAt).toBeDefined();
        expect(bill.paidAt).toBeInstanceOf(Date);
        const events = bill.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(CreditCardBillPaidEvent);
      });

      it('deve permitir marcar como paga múltiplas vezes sem erro', () => {
        bill.markAsPaid();
        bill.clearEvents();
        const result = bill.markAsPaid();

        expect(result.hasError).toBe(false);
        expect(bill.status).toBe(BillStatusEnum.PAID);
        expect(bill.getEvents()).toHaveLength(0);
      });
    });

    describe('delete', () => {
      it('deve deletar fatura e emitir evento', () => {
        const result = bill.delete();
        expect(result.hasError).toBe(false);
        expect(bill.isDeleted).toBe(true);
        const events = bill.getEvents();
        expect(events[events.length - 1]).toBeInstanceOf(
          CreditCardBillDeletedEvent,
        );
      });
    });

    describe('reopen', () => {
      it('deve reabrir fatura paga e emitir evento', () => {
        bill.markAsPaid();
        bill.clearEvents();
        const result = bill.reopen();
        expect(result.hasError).toBe(false);
        expect(bill.status).toBe(BillStatusEnum.OPEN);
        expect(bill.paidAt).toBeUndefined();
        const events = bill.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(CreditCardBillReopenedEvent);
      });
    });
  });

  describe('getters', () => {
    it('deve retornar valores corretos dos getters', () => {
      const dto = makeValidDTO();
      const result = CreditCardBill.create(dto);
      const bill = result.data!;

      expect(bill.id).toBeDefined();
      expect(bill.creditCardId).toBe(dto.creditCardId);
      expect(bill.closingDate).toEqual(dto.closingDate);
      expect(bill.dueDate).toEqual(dto.dueDate);
      expect(bill.amount).toBe(dto.amount);
      expect(bill.status).toBe(dto.status);
      expect(bill.createdAt).toBeInstanceOf(Date);
      expect(bill.updatedAt).toBeInstanceOf(Date);
      expect(bill.paidAt).toBeUndefined();
    });
  });
});
