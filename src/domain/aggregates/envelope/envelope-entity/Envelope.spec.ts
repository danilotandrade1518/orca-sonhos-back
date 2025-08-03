import { Envelope } from './Envelope';
import { ContributionSource } from '../value-objects/ContributionSource';

const makeEnvelope = () => {
  const result = Envelope.create({
    budgetId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test',
  });
  if (result.hasError) throw new Error('invalid envelope');
  return result.data!;
};

describe('EnvelopeContribution', () => {
  it('should create contribution with valid data', () => {
    const envelope = makeEnvelope();
    const result = envelope.makeContribution({
      amount: 100,
      source: ContributionSource.MANUAL,
      description: 'Aporte',
    });
    expect(result.hasError).toBe(false);
    expect(envelope.balance).toBe(100);
    expect(envelope.contributions.length).toBe(1);
  });

  it('should not allow negative contribution amount', () => {
    const envelope = makeEnvelope();
    const result = envelope.makeContribution({
      amount: -10,
      source: ContributionSource.MANUAL,
    });
    expect(result.hasError).toBe(true);
  });

  it('should emit event on contribution', () => {
    const envelope = makeEnvelope();
    envelope.makeContribution({ amount: 50, source: ContributionSource.MANUAL });
    const events = envelope.getEvents();
    expect(events.length).toBe(1);
  });
});
