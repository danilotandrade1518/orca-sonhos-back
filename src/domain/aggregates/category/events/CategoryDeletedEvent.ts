import { DomainEvent } from '../../../shared/events/DomainEvent';

export class CategoryDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly categoryName: string,
    public readonly budgetId: string,
  ) {
    super(aggregateId);
  }
}
