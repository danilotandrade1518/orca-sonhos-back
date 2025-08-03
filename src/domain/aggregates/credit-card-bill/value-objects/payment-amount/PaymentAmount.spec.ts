import { InvalidPaymentAmountError } from '../../errors/InvalidPaymentAmountError';
import { PaymentAmount } from './PaymentAmount';

describe('PaymentAmount', () => {
  it('deve criar um valor de pagamento válido', () => {
    const vo = PaymentAmount.create(100.5);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.amount).toBe(100.5);
  });

  it('deve retornar erro se valor for zero ou negativo', () => {
    let vo = PaymentAmount.create(0);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidPaymentAmountError());

    vo = PaymentAmount.create(-10);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidPaymentAmountError());
  });

  it('deve retornar erro se tiver mais de duas casas decimais', () => {
    const vo = PaymentAmount.create(10.123);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidPaymentAmountError());
  });
});
