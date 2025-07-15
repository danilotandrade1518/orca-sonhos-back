import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IDomainEvent } from '../../../../domain/shared/events/IDomainEvent';

export class EventPublisherStub implements IEventPublisher {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async publish(_event: IDomainEvent): Promise<void> {
    // Stub implementation - does nothing
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async publishMany(_events: IDomainEvent[]): Promise<void> {
    // Stub implementation - does nothing
  }
}
