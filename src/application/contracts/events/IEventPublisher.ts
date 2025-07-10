import { IDomainEvent } from '../../../domain/shared/events/IDomainEvent';

export interface IEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
  publishMany(events: IDomainEvent[]): Promise<void>;
}
