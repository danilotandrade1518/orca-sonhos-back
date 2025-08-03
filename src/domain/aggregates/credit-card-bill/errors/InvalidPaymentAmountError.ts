import { DomainError } from '../../../shared/DomainError';

export class InvalidPaymentAmountError extends DomainError {
  constructor() {
    super('Invalid payment amount');
    this.name = 'InvalidPaymentAmountError';
  }
}
