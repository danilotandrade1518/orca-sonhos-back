import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CreditCardBillReopenedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly creditCardId: string,
  ) {
    super(aggregateId);
  }
}
