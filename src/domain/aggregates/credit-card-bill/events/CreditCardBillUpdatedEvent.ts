import { DomainEvent } from '../../../shared/events/DomainEvent';
import { BillStatusEnum } from '../value-objects/bill-status/BillStatus';

export class CreditCardBillUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly creditCardId: string,
    public readonly closingDate: Date,
    public readonly dueDate: Date,
    public readonly amount: number,
    public readonly status: BillStatusEnum,
  ) {
    super(aggregateId);
  }
}
