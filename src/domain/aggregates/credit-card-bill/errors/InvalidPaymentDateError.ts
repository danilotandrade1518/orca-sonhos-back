import { DomainError } from '../../../shared/DomainError';

export class InvalidPaymentDateError extends DomainError {
  constructor() {
    super('Invalid payment date');
    this.name = 'InvalidPaymentDateError';
  }
}
