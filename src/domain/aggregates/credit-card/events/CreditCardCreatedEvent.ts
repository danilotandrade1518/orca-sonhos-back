import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CreditCardCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly creditCardName: string,
    public readonly limit: number,
    public readonly closingDay: number,
    public readonly dueDay: number,
    public readonly budgetId: string,
  ) {
    super(aggregateId);
  }
}
