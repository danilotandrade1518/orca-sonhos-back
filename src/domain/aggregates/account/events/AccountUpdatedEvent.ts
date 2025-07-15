import { DomainEvent } from '../../../shared/events/DomainEvent';

export class AccountUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly budgetId: string,
    public readonly previousName: string,
    public readonly newName: string,
    public readonly previousInitialBalance: number,
    public readonly newInitialBalance: number,
    public readonly previousDescription?: string,
    public readonly newDescription?: string,
  ) {
    super(aggregateId);
  }
}
