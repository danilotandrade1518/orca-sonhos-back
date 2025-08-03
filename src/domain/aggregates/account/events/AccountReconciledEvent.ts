import { DomainEvent } from '../../../shared/events/DomainEvent';

export class AccountReconciledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly budgetId: string,
    public readonly previousBalance: number,
    public readonly newBalance: number,
    public readonly difference: number,
    public readonly justification: string,
  ) {
    super(aggregateId);
  }
}
