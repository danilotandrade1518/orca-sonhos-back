import { ScheduledTransactionCancelledEvent } from './ScheduledTransactionCancelledEvent';

describe('ScheduledTransactionCancelledEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with reason', () => {
    const event = new ScheduledTransactionCancelledEvent('tx-1', 'Change');

    expect(event.aggregateId).toBe('tx-1');
    expect(event.reason).toBe('Change');
    expect(event.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
