import { DomainError } from '../../../shared/DomainError';

export class InvalidTransactionStatusError extends DomainError {
  constructor() {
    super('TransactionStatus is invalid');
    this.name = 'InvalidTransactionStatusError';
    this.fieldName = 'status';
  }
}
