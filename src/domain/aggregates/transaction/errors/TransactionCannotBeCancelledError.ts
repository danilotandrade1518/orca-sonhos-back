import { DomainError } from '../../../shared/DomainError';

export class TransactionCannotBeCancelledError extends DomainError {
  constructor() {
    super('Transaction cannot be cancelled');
  }
}
