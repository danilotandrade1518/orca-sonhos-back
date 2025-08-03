import { DomainError } from '../../../shared/DomainError';

export class InvalidTransactionDateError extends DomainError {
  constructor(message = 'Invalid transaction date') {
    super(message);
    this.name = 'InvalidTransactionDateError';
    this.fieldName = 'transactionDate';
  }
}
