import { InvalidReconciliationJustificationError } from '../../errors/InvalidReconciliationJustificationError';
import { ReconciliationJustification } from './ReconciliationJustification';

describe('ReconciliationJustification', () => {
  it('should create valid justification', () => {
    const text = 'Ajuste de saldo devido a taxa bancária';
    const vo = ReconciliationJustification.create(text);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.justification).toBe(text);
  });

  it('should return error when text is too short', () => {
    const vo = ReconciliationJustification.create('short');
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(
      new InvalidReconciliationJustificationError('short'),
    );
  });

  it('should return error when text is too long', () => {
    const long = 'a'.repeat(501);
    const vo = ReconciliationJustification.create(long);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(
      new InvalidReconciliationJustificationError(long),
    );
  });

  it('should compare equality correctly', () => {
    const text = 'Reconciliação mensal de extrato';
    const vo1 = ReconciliationJustification.create(text);
    const vo2 = ReconciliationJustification.create(text);
    const vo3 = ReconciliationJustification.create('Outra justificativa diferente');
    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
  });
});
