import { DomainEvent } from './DomainEvent';

describe('DomainEvent', () => {
  class TestEvent extends DomainEvent {
    constructor(
      aggregateId: string,
      public readonly testData: string,
    ) {
      super(aggregateId);
    }
  }

  it('should create event with correct properties', () => {
    const aggregateId = 'test-id';
    const testData = 'test-data';

    const event = new TestEvent(aggregateId, testData);

    expect(event.aggregateId).toBe(aggregateId);
    expect(event.testData).toBe(testData);
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.eventVersion).toBe(1);
  });

  it('should have occurred on date close to now', () => {
    const before = new Date();
    const event = new TestEvent('test-id', 'data');
    const after = new Date();

    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should create different events with different timestamps', async () => {
    const event1 = new TestEvent('test-id', 'data1');

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 2));

    const event2 = new TestEvent('test-id', 'data2');

    expect(event1.occurredOn).not.toEqual(event2.occurredOn);
    expect(event2.occurredOn.getTime()).toBeGreaterThan(
      event1.occurredOn.getTime(),
    );
  });
});
