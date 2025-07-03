import { DomainError } from '../../../shared/domain-error';

export class InvalidTransactionStatusError extends DomainError {
  constructor() {
    super('TransactionStatus is invalid');
    this.name = 'InvalidTransactionStatusError';
    this.fieldName = 'status';
  }
}
