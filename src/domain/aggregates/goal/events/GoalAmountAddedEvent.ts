import { DomainEvent } from '../../../shared/events/DomainEvent';

export class GoalAmountAddedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly addedAmount: number,
    public readonly newAccumulatedAmount: number,
    public readonly budgetId: string,
  ) {
    super(aggregateId);
  }
}
