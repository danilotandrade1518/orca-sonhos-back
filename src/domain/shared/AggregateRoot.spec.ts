import { AggregateRoot } from './AggregateRoot';
import { IDomainEvent } from './events/IDomainEvent';

describe('AggregateRoot', () => {
  class TestEvent implements IDomainEvent {
    public readonly occurredOn: Date;
    public readonly eventVersion: number = 1;

    constructor(
      public readonly aggregateId: string,
      public readonly testData: string,
    ) {
      this.occurredOn = new Date();
    }
  }

  class TestAggregate extends AggregateRoot {
    private _id: string;

    constructor(id: string) {
      super();
      this._id = id;
    }

    get id(): string {
      return this._id;
    }

    public testAddEvent(event: IDomainEvent): void {
      this.addEvent(event);
    }
  }

  it('should start with no events', () => {
    const aggregate = new TestAggregate('test-id');

    expect(aggregate.hasEvents()).toBe(false);
    expect(aggregate.getEvents()).toHaveLength(0);
  });

  it('should accumulate events correctly', () => {
    const aggregate = new TestAggregate('test-id');
    const event1 = new TestEvent('test-id', 'data1');
    const event2 = new TestEvent('test-id', 'data2');

    aggregate.testAddEvent(event1);
    aggregate.testAddEvent(event2);

    expect(aggregate.hasEvents()).toBe(true);
    expect(aggregate.getEvents()).toHaveLength(2);
    expect(aggregate.getEvents()[0]).toBe(event1);
    expect(aggregate.getEvents()[1]).toBe(event2);
  });

  it('should return copy of events array', () => {
    const aggregate = new TestAggregate('test-id');
    const event = new TestEvent('test-id', 'data');

    aggregate.testAddEvent(event);
    const events1 = aggregate.getEvents();
    const events2 = aggregate.getEvents();

    expect(events1).not.toBe(events2);
    expect(events1).toEqual(events2);
  });

  it('should clear events correctly', () => {
    const aggregate = new TestAggregate('test-id');
    const event = new TestEvent('test-id', 'data');

    aggregate.testAddEvent(event);
    expect(aggregate.hasEvents()).toBe(true);

    aggregate.clearEvents();
    expect(aggregate.hasEvents()).toBe(false);
    expect(aggregate.getEvents()).toHaveLength(0);
  });

  it('should not modify original events when modifying returned array', () => {
    const aggregate = new TestAggregate('test-id');
    const event = new TestEvent('test-id', 'data');

    aggregate.testAddEvent(event);
    const events = aggregate.getEvents();
    events.push(new TestEvent('test-id', 'extra'));

    expect(aggregate.getEvents()).toHaveLength(1);
    expect(aggregate.getEvents()[0]).toBe(event);
  });
});
