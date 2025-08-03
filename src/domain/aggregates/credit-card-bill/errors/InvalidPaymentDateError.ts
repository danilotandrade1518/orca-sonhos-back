import { DomainError } from '../../../shared/DomainError';

export class InvalidPaymentDateError extends DomainError {
  constructor() {
    super('The payment date provided is invalid');
    this.name = 'InvalidPaymentDateError';
  }
}
