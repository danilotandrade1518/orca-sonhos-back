import { DomainError } from '../../../shared/DomainError';

export class InvalidCancellationReasonError extends DomainError {
  constructor() {
    super('Invalid cancellation reason');
    this.name = 'InvalidCancellationReasonError';
    this.fieldName = 'cancellationReason';
  }
}
