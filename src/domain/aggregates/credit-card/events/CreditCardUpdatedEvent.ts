import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CreditCardUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly previousName: string,
    public readonly newName: string,
    public readonly previousLimit: number,
    public readonly newLimit: number,
    public readonly previousClosingDay: number,
    public readonly newClosingDay: number,
    public readonly previousDueDay: number,
    public readonly newDueDay: number,
  ) {
    super(aggregateId);
  }
}
