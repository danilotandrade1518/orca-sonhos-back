import { DomainEvent } from '../../../shared/events/DomainEvent';

export class GoalAchievedEvent extends DomainEvent {
  constructor(
    public readonly goalId: string,
    public readonly goalName: string,
    public readonly totalAmount: number,
    public readonly achievedAt: Date,
    public readonly budgetId: string,
  ) {
    super(goalId);
  }
}
