import { InvalidEntityNameError } from '@domain/shared/errors/InvalidEntityNameError';
import { InvalidMoneyError } from '@domain/shared/errors/InvalidMoneyError';

import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { InvalidCreditCardDayError } from '../errors/InvalidCreditCardDayError';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { CreditCard } from './CreditCard';

describe('CreditCard', () => {
  it('deve criar um cartão de crédito válido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      budgetId: EntityId.create().value?.id || '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(false);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('Nubank');
    expect(result.data?.limit).toBe(2000);
    expect(result.data?.closingDay).toBe(10);
    expect(result.data?.dueDay).toBe(20);
  });

  it('deve acumular erro se o closingDay for inválido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 0,
      dueDay: 20,
      budgetId: EntityId.create().value?.id || '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidCreditCardDayError());
  });

  it('deve acumular erro se o dueDay for inválido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 10,
      dueDay: 32,
      budgetId: EntityId.create().value?.id || '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidCreditCardDayError());
  });

  it('deve acumular múltiplos erros se ambos os dias forem inválidos', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 0,
      dueDay: 32,
      budgetId: EntityId.create().value?.id || '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors).toEqual([
      new InvalidCreditCardDayError(),
      new InvalidCreditCardDayError(),
    ]);
  });
});

describe('CreditCard - cenários de erro para name, limit e budgetId', () => {
  it('deve acumular erro se o nome for vazio', () => {
    const dto = {
      name: '',
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      budgetId: EntityId.create().value?.id || '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
  });

  it('deve acumular erro se o limite for negativo', () => {
    const dto = {
      name: 'Nubank',
      limit: -100,
      closingDay: 10,
      dueDay: 20,
      budgetId: EntityId.create().value?.id || '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidMoneyError(-100));
  });

  it('deve acumular erro se o budgetId for inválido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      budgetId: '',
    };
    const result = CreditCard.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidEntityIdError(''));
  });
});
