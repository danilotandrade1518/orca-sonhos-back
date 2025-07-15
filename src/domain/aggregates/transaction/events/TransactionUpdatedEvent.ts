import { DomainEvent } from '../../../shared/events/DomainEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

export class TransactionUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly previousAccountId: string,
    public readonly newAccountId: string,
    public readonly previousAmount: number,
    public readonly newAmount: number,
    public readonly previousType: TransactionTypeEnum,
    public readonly newType: TransactionTypeEnum,
  ) {
    super(aggregateId);
  }
}
