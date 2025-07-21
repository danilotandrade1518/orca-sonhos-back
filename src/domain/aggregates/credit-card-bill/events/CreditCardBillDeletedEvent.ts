import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CreditCardBillDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly creditCardId: string,
  ) {
    super(aggregateId);
  }
}
