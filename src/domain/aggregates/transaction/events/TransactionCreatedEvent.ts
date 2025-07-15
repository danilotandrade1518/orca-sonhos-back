import { DomainEvent } from '../../../shared/events/DomainEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

export class TransactionCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly accountId: string,
    public readonly amount: number,
    public readonly type: TransactionTypeEnum,
    public readonly categoryId?: string,
  ) {
    super(aggregateId);
  }
}
