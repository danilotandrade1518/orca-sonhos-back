import { DomainError } from '../../../shared/DomainError';

export class TransactionAlreadyExecutedError extends DomainError {
  constructor() {
    super('Transaction has already been executed');
  }
}
