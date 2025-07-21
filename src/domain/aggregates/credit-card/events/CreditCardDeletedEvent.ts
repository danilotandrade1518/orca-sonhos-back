import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CreditCardDeletedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
}
