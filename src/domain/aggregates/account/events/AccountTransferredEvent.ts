import { DomainEvent } from '../../../shared/events/DomainEvent';
import { TransferDirection } from '../../../shared/enums/TransferDirection';

export class AccountTransferredEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly targetAccountId: string,
    public readonly amount: number,
    public readonly direction: TransferDirection,
    public readonly description?: string,
  ) {
    super(accountId);
  }
}
