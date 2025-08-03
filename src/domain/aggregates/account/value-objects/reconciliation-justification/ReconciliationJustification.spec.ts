import { ReconciliationJustification } from './ReconciliationJustification';
import { InvalidReconciliationJustificationError } from '../../errors/InvalidReconciliationJustificationError';

describe('ReconciliationJustification', () => {
  it('should create valid justification', () => {
    const vo = ReconciliationJustification.create('Ajuste devido a tarifa bancária');
    expect(vo.hasError).toBe(false);
    expect(vo.value?.justification).toBe('Ajuste devido a tarifa bancária');
  });

  it('should trim spaces', () => {
    const vo = ReconciliationJustification.create('   Just  ');
    expect(vo.hasError).toBe(true);
  });

  it('should return error when short', () => {
    const vo = ReconciliationJustification.create('short');
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationJustificationError());
  });

  it('should return error when too long', () => {
    const long = 'a'.repeat(501);
    const vo = ReconciliationJustification.create(long);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReconciliationJustificationError());
  });
});
