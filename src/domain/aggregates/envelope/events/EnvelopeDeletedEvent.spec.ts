import { EnvelopeDeletedEvent } from './EnvelopeDeletedEvent';

describe('EnvelopeDeletedEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with properties', () => {
    const event = new EnvelopeDeletedEvent('env1', 'bud1', 'Env');
    expect(event.aggregateId).toBe('env1');
    expect(event.budgetId).toBe('bud1');
    expect(event.name).toBe('Env');
    expect(event.occurredOn).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
