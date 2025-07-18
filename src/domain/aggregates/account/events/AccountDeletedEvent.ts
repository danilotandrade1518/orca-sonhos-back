import { DomainEvent } from '../../../shared/events/DomainEvent';
import { AccountTypeEnum } from '../value-objects/account-type/AccountType';

export class AccountDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly budgetId: string,
    public readonly name: string,
    public readonly type: AccountTypeEnum,
    public readonly balance: number,
    public readonly description?: string,
  ) {
    super(aggregateId);
  }
}
