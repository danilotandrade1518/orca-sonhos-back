import { DomainError } from '../../../shared/DomainError';

export class InvalidCancellationReasonError extends DomainError {
  constructor() {
    super('Cancellation reason must be between 3 and 255 characters');
    this.name = 'InvalidCancellationReasonError';
    this.fieldName = 'reason';
  }
}
