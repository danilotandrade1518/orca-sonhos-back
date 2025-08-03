import { ReconciliationAmount } from './ReconciliationAmount';
import { InvalidReconciliationAmountError } from '../../errors/InvalidReconciliationAmountError';

describe('ReconciliationAmount', () => {
  it('should create a valid positive amount', () => {
    const vo = ReconciliationAmount.create(10.5);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.amount).toBe(10.5);
  });

  it('should create a valid negative amount', () => {
    const vo = ReconciliationAmount.create(-5);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.amount).toBe(-5);
  });

  it('should return error for zero amount', () => {
    const vo = ReconciliationAmount.create(0);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationAmountError(0));
  });

  it('should return error for more than two decimals', () => {
    const vo = ReconciliationAmount.create(1.234);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationAmountError(1.234));
  });

  it('should return error for NaN', () => {
    const vo = ReconciliationAmount.create(NaN);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationAmountError(NaN));
  });
});
