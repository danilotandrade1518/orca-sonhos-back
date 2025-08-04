import { DomainEvent } from '../../../shared/events/DomainEvent';

export class ScheduledTransactionCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly reason: string,
  ) {
    super(aggregateId);
  }
}
