import { PaymentDate } from './PaymentDate';

describe('PaymentDate', () => {
  it('should create a valid payment date', () => {
    const date = new Date();
    const vo = PaymentDate.create(date);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.date).toEqual(date);
  });

  it('should return error for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const vo = PaymentDate.create(future);
    expect(vo.hasError).toBe(true);
  });

  it('should return error for invalid date', () => {
    const vo = PaymentDate.create(new Date('invalid'));
    expect(vo.hasError).toBe(true);
  });
});
