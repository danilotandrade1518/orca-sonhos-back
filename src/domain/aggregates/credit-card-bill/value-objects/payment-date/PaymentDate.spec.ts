import { InvalidPaymentDateError } from '../../errors/InvalidPaymentDateError';
import { PaymentDate } from './PaymentDate';

describe('PaymentDate', () => {
  const closingDate = new Date('2024-01-01');

  it('deve criar uma data válida', () => {
    const vo = PaymentDate.create(new Date('2024-01-10'), closingDate);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.date).toEqual(new Date('2024-01-10'));
  });

  it('deve retornar erro se data for futura', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const vo = PaymentDate.create(future, closingDate);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidPaymentDateError());
  });

  it('deve retornar erro se data for antes do período', () => {
    const past = new Date('2023-12-31');
    const vo = PaymentDate.create(past, closingDate);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidPaymentDateError());
  });
});
