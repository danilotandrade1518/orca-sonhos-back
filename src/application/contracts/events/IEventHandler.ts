import { IDomainEvent } from '../../../domain/shared/events/IDomainEvent';

export interface IEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<void>;
}
