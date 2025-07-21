import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CreditCardBillPaidEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly creditCardId: string,
    public readonly amount: number,
    public readonly paidAt: Date,
  ) {
    super(aggregateId);
  }
}
