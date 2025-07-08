import { DomainError } from '../../../shared/DomainError';

export class InvalidTransactionTypeError extends DomainError {
  constructor() {
    super('TransactionType is invalid');
    this.name = 'InvalidTransactionTypeError';
    this.fieldName = 'type';
  }
}
