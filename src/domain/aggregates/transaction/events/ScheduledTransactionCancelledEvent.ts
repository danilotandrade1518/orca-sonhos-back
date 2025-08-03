import { DomainEvent } from '../../../shared/events/DomainEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

export class ScheduledTransactionCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly accountId: string,
    public readonly budgetId: string,
    public readonly amount: number,
    public readonly type: TransactionTypeEnum,
    public readonly reason: string,
    public readonly cancelledAt: Date,
    public readonly categoryId?: string,
    public readonly creditCardId?: string,
    public readonly transactionDate?: Date,
  ) {
    super(aggregateId);
  }
}
