import { InsufficientEnvelopeBalanceError } from '../../errors/InsufficientEnvelopeBalanceError';
import { EnvelopeBalance } from './EnvelopeBalance';

describe('EnvelopeBalance', () => {
  it('should create balance with zero', () => {
    const result = EnvelopeBalance.create(0);
    expect(result.hasError).toBe(false);
    expect(result.data!.value).toBe(0);
  });

  it('should not create balance with negative value', () => {
    const result = EnvelopeBalance.create(-1);
    expect(result.hasError).toBe(true);
  });

  it('should add amount successfully', () => {
    const balance = EnvelopeBalance.create(0).data!;
    const result = balance.add(100);
    expect(result.hasError).toBe(false);
    expect(result.data!.value).toBe(100);
  });

  it('should not add non positive amount', () => {
    const balance = EnvelopeBalance.create(0).data!;
    const result = balance.add(0);
    expect(result.hasError).toBe(true);
  });

  it('should subtract amount successfully', () => {
    const balance = EnvelopeBalance.create(100).data!;
    const result = balance.subtract(50);
    expect(result.hasError).toBe(false);
    expect(result.data!.value).toBe(50);
  });

  it('should not subtract when insufficient', () => {
    const balance = EnvelopeBalance.create(30).data!;
    const result = balance.subtract(50);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientEnvelopeBalanceError);
  });

  it('should not subtract non positive amount', () => {
    const balance = EnvelopeBalance.create(30).data!;
    const result = balance.subtract(0);
    expect(result.hasError).toBe(true);
  });
});
