import { DomainError } from '../../../shared/DomainError';

export class TransactionAlreadyDeletedError extends DomainError {
  constructor() {
    super('Transaction is already deleted');
  }
}
