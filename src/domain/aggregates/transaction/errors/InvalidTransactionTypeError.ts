import { DomainError } from '../../../shared/domain-error';

export class InvalidTransactionTypeError extends DomainError {
  constructor() {
    super('TransactionType is invalid');
    this.name = 'InvalidTransactionTypeError';
    this.fieldName = 'type';
  }
}
