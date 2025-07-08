import { DomainError } from '../../../shared/DomainError';

export class InvalidTransactionDescriptionError extends DomainError {
  constructor() {
    super('Transaction description must be between 3 and 100 characters');
    this.name = 'InvalidTransactionDescriptionError';
    this.fieldName = 'description';
  }
}
