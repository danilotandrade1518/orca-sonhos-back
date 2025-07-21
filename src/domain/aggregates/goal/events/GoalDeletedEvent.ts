import { DomainEvent } from '../../../shared/events/DomainEvent';

export class GoalDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly goalName: string,
    public readonly budgetId: string,
  ) {
    super(aggregateId);
  }
}
