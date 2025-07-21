import { DomainEvent } from '../../../shared/events/DomainEvent';

export class GoalUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly previousName: string,
    public readonly newName: string,
    public readonly previousTotalAmount: number,
    public readonly newTotalAmount: number,
    public readonly previousDeadline: Date | undefined,
    public readonly newDeadline: Date | undefined,
  ) {
    super(aggregateId);
  }
}
