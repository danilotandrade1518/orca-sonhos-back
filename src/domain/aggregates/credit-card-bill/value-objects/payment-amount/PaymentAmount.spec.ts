import { PaymentAmount } from './PaymentAmount';

describe('PaymentAmount', () => {
  it('should create a valid payment amount', () => {
    const vo = PaymentAmount.create(100);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.cents).toBe(100);
  });

  it('should return error for zero amount', () => {
    const vo = PaymentAmount.create(0);
    expect(vo.hasError).toBe(true);
  });

  it('should return error for negative amount', () => {
    const vo = PaymentAmount.create(-10);
    expect(vo.hasError).toBe(true);
  });

  it('should return error for amount with more than two decimals', () => {
    const vo = PaymentAmount.create(10.123);
    expect(vo.hasError).toBe(true);
  });
});
