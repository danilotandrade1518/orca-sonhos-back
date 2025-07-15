import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IDomainEvent } from '../../../../domain/shared/events/IDomainEvent';

export class EventPublisherStub implements IEventPublisher {
  public publishCalls: IDomainEvent[] = [];
  public publishManyCalls: IDomainEvent[][] = [];

  async publish(event: IDomainEvent): Promise<void> {
    this.publishCalls.push(event);
  }

  async publishMany(events: IDomainEvent[]): Promise<void> {
    this.publishManyCalls.push(events);
  }
}
