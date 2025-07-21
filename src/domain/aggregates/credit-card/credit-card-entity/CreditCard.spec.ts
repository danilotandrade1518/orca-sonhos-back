import { InvalidEntityNameError } from '@domain/shared/errors/InvalidEntityNameError';
import { InvalidMoneyError } from '@domain/shared/errors/InvalidMoneyError';
import { InvalidCreditCardDayError } from '../errors/InvalidCreditCardDayError';
import { CreditCard } from './CreditCard';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { CreditCardCreatedEvent } from '../events/CreditCardCreatedEvent';
import { CreditCardUpdatedEvent } from '../events/CreditCardUpdatedEvent';
import { CreditCardDeletedEvent } from '../events/CreditCardDeletedEvent';
import { CreditCardAlreadyDeletedError } from '../errors/CreditCardAlreadyDeletedError';

describe('CreditCard', () => {
  const validDTO = {
    name: 'Nubank',
    limit: 2000,
    closingDay: 10,
    dueDay: 20,
    budgetId: EntityId.create().value!.id,
  };

  describe('create', () => {
    it('should create valid credit card and emit event', () => {
      const result = CreditCard.create(validDTO);

      expect(result.hasError).toBe(false);
      const card = result.data!;
      expect(card.getEvents()[0]).toBeInstanceOf(CreditCardCreatedEvent);
      expect(card.name).toBe(validDTO.name);
    });

    it('should validate invalid name', () => {
      const result = CreditCard.create({ ...validDTO, name: '' });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });

    it('should validate invalid data', () => {
      const result = CreditCard.create({ ...validDTO, limit: -1 });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidMoneyError(-1));
    });

    it('should validate invalid days', () => {
      const result = CreditCard.create({ ...validDTO, closingDay: 0 });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCreditCardDayError());
    });
  });

  describe('restore', () => {
    it('should restore credit card without emitting events', () => {
      const created = CreditCard.create(validDTO).data!;
      const restoreData = {
        id: created.id,
        name: created.name,
        limit: created.limit,
        closingDay: created.closingDay,
        dueDay: created.dueDay,
        budgetId: created.budgetId,
        isDeleted: false,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      const result = CreditCard.restore(restoreData);

      expect(result.hasError).toBe(false);
      const restored = result.data!;
      expect(restored.getEvents().length).toBe(0);
      expect(restored.id).toBe(created.id);
    });
  });

  describe('update', () => {
    it('should update fields and emit event', () => {
      const card = CreditCard.create(validDTO).data!;
      card.clearEvents();

      const result = card.update({
        name: 'New',
        limit: 3000,
        closingDay: 12,
        dueDay: 22,
      });

      expect(result.hasError).toBe(false);
      expect(card.name).toBe('New');
      expect(card.getEvents()[0]).toBeInstanceOf(CreditCardUpdatedEvent);
    });

    it('should not emit event if no changes', () => {
      const card = CreditCard.create(validDTO).data!;
      card.clearEvents();

      const result = card.update({
        name: validDTO.name,
        limit: validDTO.limit,
        closingDay: validDTO.closingDay,
        dueDay: validDTO.dueDay,
      });

      expect(result.hasError).toBe(false);
      expect(card.getEvents().length).toBe(0);
    });

    it('should return error when card deleted', () => {
      const card = CreditCard.create(validDTO).data!;
      card.delete();

      const result = card.update({ ...validDTO });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new CreditCardAlreadyDeletedError());
    });
  });

  describe('delete', () => {
    it('should soft delete card and emit event', () => {
      const card = CreditCard.create(validDTO).data!;
      card.clearEvents();

      const result = card.delete();

      expect(result.hasError).toBe(false);
      expect(card.isDeleted).toBe(true);
      expect(card.getEvents()[0]).toBeInstanceOf(CreditCardDeletedEvent);
    });

    it('should not delete twice', () => {
      const card = CreditCard.create(validDTO).data!;
      card.delete();
      const result = card.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new CreditCardAlreadyDeletedError());
    });
  });
});
