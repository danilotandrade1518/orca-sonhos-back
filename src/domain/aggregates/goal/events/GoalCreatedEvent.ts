import { DomainEvent } from '../../../shared/events/DomainEvent';

export class GoalCreatedEvent extends DomainEvent {
  constructor(
    public readonly goalId: string,
    public readonly goalName: string,
    public readonly totalAmount: number,
    public readonly deadline: Date | undefined,
    public readonly budgetId: string,
  ) {
    super(goalId);
  }
}
