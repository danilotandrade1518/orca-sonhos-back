import { DomainError } from '../../../shared/DomainError';

export class TransactionNotScheduledError extends DomainError {
  constructor() {
    super('Transaction is not scheduled');
  }
}
