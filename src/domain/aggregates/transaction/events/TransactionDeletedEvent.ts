import { DomainEvent } from '../../../shared/events/DomainEvent';
import { TransactionStatusEnum } from '../value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

export class TransactionDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly accountId: string,
    public readonly budgetId: string,
    public readonly amount: number,
    public readonly type: TransactionTypeEnum,
    public readonly description: string,
    public readonly status: TransactionStatusEnum,
    public readonly categoryId?: string,
    public readonly creditCardId?: string,
    public readonly transactionDate?: Date,
  ) {
    super(aggregateId);
  }
}
