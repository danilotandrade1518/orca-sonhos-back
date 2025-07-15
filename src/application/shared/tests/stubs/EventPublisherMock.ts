import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IDomainEvent } from '../../../../domain/shared/events/IDomainEvent';

export class EventPublisherMock implements IEventPublisher {
  private publishedEvents: IDomainEvent[] = [];

  async publish(event: IDomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  async publishMany(events: IDomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
  }

  // Helper methods for tests
  getPublishedEvents(): IDomainEvent[] {
    return [...this.publishedEvents];
  }

  getPublishedEventsOfType<T extends IDomainEvent>(
    eventType: new (...args: unknown[]) => T,
  ): T[] {
    return this.publishedEvents.filter(
      (event): event is T => event instanceof eventType,
    );
  }

  clear(): void {
    this.publishedEvents = [];
  }

  hasPublishedEvent<T extends IDomainEvent>(
    eventType: new (...args: unknown[]) => T,
  ): boolean {
    return this.publishedEvents.some((event) => event instanceof eventType);
  }

  getEventsCount(): number {
    return this.publishedEvents.length;
  }
}
