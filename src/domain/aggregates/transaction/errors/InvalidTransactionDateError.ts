import { DomainError } from '../../../shared/DomainError';

export class InvalidTransactionDateError extends DomainError {
  constructor() {
    super('Transaction date must be a valid past date within one year');
    this.name = 'InvalidTransactionDateError';
    this.fieldName = 'transactionDate';
  }
}
