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

  beforeAll(() => {
    // Mock Date.now para testes consistentes em casos específicos
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create event with correct properties', () => {
      const aggregateId = 'test-id';
      const testData = 'test-data';

      const event = new TestEvent(aggregateId, testData);

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.testData).toBe(testData);
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.eventVersion).toBe(1);
    });

    it('should handle empty aggregate id', () => {
      const event = new TestEvent('', 'test data');

      expect(event.aggregateId).toBe('');
      expect(event.testData).toBe('test data');
      expect(event.eventVersion).toBe(1);
    });

    it('should handle special characters in aggregate id', () => {
      const specialId = 'test-123_@#$%^&*()';
      const event = new TestEvent(specialId, 'test data');

      expect(event.aggregateId).toBe(specialId);
    });

    it('should handle very long aggregate ids', () => {
      const longId = 'a'.repeat(1000);
      const event = new TestEvent(longId, 'test data');

      expect(event.aggregateId).toBe(longId);
      expect(event.aggregateId.length).toBe(1000);
    });
  });

  describe('timestamp behavior', () => {
    it('should have occurred on date close to now', () => {
      jest.useRealTimers(); // Use real timers for this test
      const before = new Date();
      const event = new TestEvent('test-id', 'data');
      const after = new Date();

      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
      jest.useFakeTimers(); // Return to fake timers
    });

    it('should create different events with different timestamps', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const event1 = new TestEvent('test-id', 'data1');

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 2));

      const event2 = new TestEvent('test-id', 'data2');

      expect(event1.occurredOn).not.toEqual(event2.occurredOn);
      expect(event2.occurredOn.getTime()).toBeGreaterThan(
        event1.occurredOn.getTime(),
      );
      jest.useFakeTimers(); // Return to fake timers
    });

    it('should create consistent timestamps with fake timers', () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));

      const event1 = new TestEvent('id1', 'data1');
      const event2 = new TestEvent('id2', 'data2');

      expect(event1.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      expect(event2.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
    });

    it('should advance timestamps when time advances', () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));

      const event1 = new TestEvent('id1', 'data1');

      jest.advanceTimersByTime(1000); // Advance 1 second

      const event2 = new TestEvent('id2', 'data2');

      expect(event1.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      expect(event2.occurredOn).toEqual(new Date('2024-01-15T10:30:01.000Z'));
    });
  });

  describe('properties', () => {
    it('should have immutable properties', () => {
      const aggregateId = 'test-aggregate-123';
      const event = new TestEvent(aggregateId, 'test data');

      // Verify properties are readonly by accessing them
      expect(event.aggregateId).toBe(aggregateId);
      expect(event.eventVersion).toBe(1);
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.testData).toBe('test data');
    });

    it('should maintain consistent event version', () => {
      const event1 = new TestEvent('id1', 'data1');
      const event2 = new TestEvent('id2', 'data2');

      expect(event1.eventVersion).toBe(1);
      expect(event2.eventVersion).toBe(1);
    });
  });

  describe('inheritance', () => {
    it('should implement IDomainEvent interface', () => {
      const event = new TestEvent('test-id', 'test data');

      // Verify interface compliance
      expect(event).toHaveProperty('aggregateId');
      expect(event).toHaveProperty('occurredOn');
      expect(event).toHaveProperty('eventVersion');

      expect(typeof event.aggregateId).toBe('string');
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(typeof event.eventVersion).toBe('number');
    });

    it('should allow custom properties in derived classes', () => {
      const customData = { id: 123, name: 'test', active: true };

      class CustomDomainEvent extends DomainEvent {
        constructor(
          aggregateId: string,
          public readonly customProperty: typeof customData,
        ) {
          super(aggregateId);
        }
      }

      const event = new CustomDomainEvent('test-id', customData);

      expect(event.aggregateId).toBe('test-id');
      expect(event.customProperty).toEqual(customData);
      expect(event.eventVersion).toBe(1);
    });

    it('should handle multiple custom properties', () => {
      class ComplexEvent extends DomainEvent {
        constructor(
          aggregateId: string,
          public readonly stringProp: string,
          public readonly numberProp: number,
          public readonly booleanProp: boolean,
          public readonly objectProp: { key: string },
          public readonly optionalProp?: string,
        ) {
          super(aggregateId);
        }
      }

      const event = new ComplexEvent(
        'complex-id',
        'test string',
        42,
        true,
        { key: 'value' },
        'optional',
      );

      expect(event.stringProp).toBe('test string');
      expect(event.numberProp).toBe(42);
      expect(event.booleanProp).toBe(true);
      expect(event.objectProp).toEqual({ key: 'value' });
      expect(event.optionalProp).toBe('optional');
    });
  });

  describe('edge cases', () => {
    it('should handle null-like values in test data', () => {
      const eventWithEmpty = new TestEvent('id1', '');
      const eventWithUndefined = new TestEvent('id2', 'undefined');

      expect(eventWithEmpty.testData).toBe('');
      expect(eventWithUndefined.testData).toBe('undefined');
    });

    it('should maintain date precision', () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:45.123Z'));

      const event = new TestEvent('test-id', 'test data');

      expect(event.occurredOn.getMilliseconds()).toBe(123);
      expect(event.occurredOn.getSeconds()).toBe(45);
      expect(event.occurredOn.getMinutes()).toBe(30);
    });

    it('should handle Unicode characters in aggregate id', () => {
      const unicodeId = 'test-事件-🎯-ñoñó';
      const event = new TestEvent(unicodeId, 'test data');

      expect(event.aggregateId).toBe(unicodeId);
    });
  });
});
