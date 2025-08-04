import { DomainEvent } from '../../../shared/events/DomainEvent';

export class TransactionMarkedAsLateEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
}
