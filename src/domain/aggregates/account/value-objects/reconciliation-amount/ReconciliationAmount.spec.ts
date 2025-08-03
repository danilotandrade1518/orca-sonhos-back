import { InvalidReconciliationAmountError } from '../../errors/InvalidReconciliationAmountError';
import { ReconciliationAmount } from './ReconciliationAmount';

describe('ReconciliationAmount', () => {
  it('should create a valid value for positive amount', () => {
    const vo = ReconciliationAmount.create(100);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.cents).toBe(100);
  });

  it('should create a valid value for negative amount', () => {
    const vo = ReconciliationAmount.create(-50);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.cents).toBe(-50);
  });

  it('should return error for zero amount', () => {
    const vo = ReconciliationAmount.create(0);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationAmountError(0));
  });

  it('should return error for non integer value', () => {
    const vo = ReconciliationAmount.create(10.5);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationAmountError(10.5));
  });

  it('should return error for NaN', () => {
    const vo = ReconciliationAmount.create(NaN);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationAmountError(NaN));
  });

  it('should compare equality correctly', () => {
    const vo1 = ReconciliationAmount.create(100);
    const vo2 = ReconciliationAmount.create(100);
    const vo3 = ReconciliationAmount.create(-100);
    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
  });
});
