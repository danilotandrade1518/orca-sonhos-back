import { DomainEvent } from '../../../shared/events/DomainEvent';

export class BudgetDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly ownerId: string,
    public readonly name: string,
  ) {
    super(aggregateId);
  }
}
