import { DomainEvent } from '../../../shared/events/DomainEvent';

export class EnvelopeDeactivatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly budgetId: string,
    public readonly name: string,
  ) {
    super(aggregateId);
  }
}
