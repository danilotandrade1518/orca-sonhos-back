import { InvalidCreditCardDayError } from '../errors/InvalidCreditCardDayError';
import { CreditCard } from './CreditCard';

describe('CreditCard', () => {
  it('deve criar um cartão de crédito válido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      budgetId: 'budget-1',
    };
    const result = CreditCard.create(dto);
    expect(result.hasError).toBe(false);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('Nubank');
    expect(result.data?.limit).toBe(2000);
    expect(result.data?.closingDay).toBe(10);
    expect(result.data?.dueDay).toBe(20);
    expect(result.data?.budgetId).toBe('budget-1');
  });

  it('deve acumular erro se o closingDay for inválido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 0,
      dueDay: 20,
      budgetId: 'budget-1',
    };
    const result = CreditCard.create(dto);
    expect(result.hasError).toBe(true);
    expect(
      result.errors.some((e) => e instanceof InvalidCreditCardDayError),
    ).toBe(true);
  });

  it('deve acumular erro se o dueDay for inválido', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 10,
      dueDay: 32,
      budgetId: 'budget-1',
    };
    const result = CreditCard.create(dto);
    expect(result.hasError).toBe(true);
    expect(
      result.errors.some((e) => e instanceof InvalidCreditCardDayError),
    ).toBe(true);
  });

  it('deve acumular múltiplos erros se ambos os dias forem inválidos', () => {
    const dto = {
      name: 'Nubank',
      limit: 2000,
      closingDay: 0,
      dueDay: 32,
      budgetId: 'budget-1',
    };
    const result = CreditCard.create(dto);
    expect(result.hasError).toBe(true);
    expect(
      result.errors.filter((e) => e instanceof InvalidCreditCardDayError)
        .length,
    ).toBe(2);
  });
});

describe('CreditCard - cenários de erro para name, limit e budgetId', () => {
  it('deve acumular erro se o nome for vazio', () => {
    const dto = {
      name: '',
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      budgetId: 'budget-1',
    };
    const result = CreditCard.create(dto);
    expect(result.hasError).toBe(true);
    expect(
      result.errors.some((e) => e.message?.toLowerCase().includes('nome')),
    ).toBe(true);
  });

  it('deve acumular erro se o limite for negativo', () => {
    const dto = {
      name: 'Nubank',
      limit: -100,
      closingDay: 10,
      dueDay: 20,
      budgetId: 'budget-1',
    };
    const result = CreditCard.create(dto);
    expect(result.hasError).toBe(true);
    expect(
      result.errors.some((e) => e.message?.toLowerCase().includes('valor')),
    ).toBe(true);
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
    expect(
      result.errors.some((e) => e.message?.toLowerCase().includes('id')),
    ).toBe(true);
  });
});
